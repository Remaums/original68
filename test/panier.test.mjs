/**
 * Le panier et les promos.
 *
 * Le panier vit dans le téléphone du client : c'est `webapp/js/panier.js`
 * qui décide de tout (ce qu'on peut ajouter, combien, à quel prix, ce que
 * dit le récapitulatif), et il se teste sans navigateur. Ce que la suite
 * protège :
 *
 * - **on ne commande pas l'impossible** : jamais plus que le stock, jamais
 *   plus de vingt par ligne, et un panier relu se remet d'accord avec le
 *   catalogue (produit retiré, format supprimé, stock qui a baissé) ;
 * - **la promo se calcule une seule fois** : le prix payé est le prix plein
 *   moins la promo, l'ancien prix reste affichable, et le total le suit ;
 * - **le serveur garde la main** : une promo hors bornes est refusée, la
 *   retirer remet le prix plein, et le bandeau se règle sans rien casser.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/panier.test.mjs
 */
import 'dotenv/config';
import {
  apresRemise, prixDuFormat, prixDAppel, formatParDefaut, nettoyer, ajouter, changerQte,
  nombreDArticles, detailler, recapitulatif, plusFortePromo, QTE_MAX,
} from '../webapp/js/panier.js';
import { signInitData, getShopPass } from './helpers.mjs';

const TOKEN = process.env.BOT_TOKEN;
const BASE = process.env.TEST_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const kush = {
  id: 'kush', name: 'Néon Kush', price: 1200, remise: 10,
  variants: [
    { id: '1g', label: '1 g', price: 1200, stock: 3 },
    { id: '5g', label: '5 g', price: 5000, stock: 0 },
  ],
};
const brique = { id: 'brique', name: 'Brique 68', price: 1800, stock: 50 };
const solo = { id: 'solo', name: 'Solo', price: 900, variants: [{ id: 'u', label: 'Unique', price: 900, stock: 2 }] };
const catalogue = [kush, brique, solo];
const euros = (c) => `${(c / 100).toFixed(2).replace('.', ',')} €`;

console.log('\n── La promo ────────────────────────────────────────');
check('10 % sur 12 € font 10,80 €', apresRemise(1200, 10) === 1080, apresRemise(1200, 10));
check('Sans promo, le prix ne bouge pas', apresRemise(1800, 0) === 1800 && apresRemise(1800, undefined) === 1800);
check('L arrondi tombe au centime', apresRemise(999, 7) === 929, apresRemise(999, 7));
{
  const f = prixDuFormat(kush, '1g');
  check('Un format en promo donne le prix payé et l ancien', f.prix === 1080 && f.avant === 1200, JSON.stringify(f));
  const g = prixDuFormat(brique, null);
  check('Sans promo, pas d ancien prix', g.prix === 1800 && g.avant === null, JSON.stringify(g));
}
{
  const a = prixDAppel(kush);
  check('Le prix d appel est celui du moins cher encore en stock', a.prix === 1080 && a.plusieurs === true, JSON.stringify(a));
  check('Un produit simple n a pas de « dès »', prixDAppel(brique).plusieurs === false);
  const pepite = { id: 'pepite', name: 'Pépite', price: 800, variants: [
    { id: 'petit', label: '1 g', price: 800, stock: 0 },
    { id: 'grand', label: '3 g', price: 2100, stock: 4 },
  ] };
  check('Le format le moins cher épuisé n est pas le prix d appel', prixDAppel(pepite).prix === 2100, prixDAppel(pepite).prix);
  const toutEpuise = { ...pepite, variants: pepite.variants.map((v) => ({ ...v, stock: 0 })) };
  check('Tout épuisé : le moins cher de tous', prixDAppel(toutEpuise).prix === 800);
}
check('La plus forte promo du catalogue', plusFortePromo([kush, brique, { remise: 40 }]) === 40);
check('Aucune promo : zéro', plusFortePromo([brique]) === 0);

console.log('\n── Ajouter ─────────────────────────────────────────');
check('Plusieurs formats : il faut choisir', formatParDefaut(kush).aChoisir === true);
check('Un seul format : il s ajoute d un appui', formatParDefaut(solo).variantId === 'u' && !formatParDefaut(solo).aChoisir);
check('Produit simple : rien à choisir', formatParDefaut(brique).variantId === null && !formatParDefaut(brique).aChoisir);
{
  let panier = [];
  ({ lignes: panier } = ajouter(panier, kush, '1g'));
  ({ lignes: panier } = ajouter(panier, kush, '1g'));
  check('Le même format s ajoute à la même ligne', panier.length === 1 && panier[0].qte === 2, JSON.stringify(panier));
  ajouter(panier, kush, '1g');
  check('Ajouter ne modifie pas le panier d avant', panier[0].qte === 2);
  let r = ajouter(panier, kush, '1g');
  r = ajouter(r.lignes, kush, '1g');
  check('Jamais plus que le stock', r.lignes[0].qte === 3 && r.ajoutes === 0, `${r.lignes[0].qte}, ajoutés ${r.ajoutes}`);
  check('Un format épuisé ne s ajoute pas', ajouter([], kush, '5g').ajoutes === 0 && ajouter([], kush, '5g').lignes.length === 0);
  let gros = [];
  for (let i = 0; i < QTE_MAX + 5; i++) gros = ajouter(gros, brique, null).lignes;
  check(`Pas plus de ${QTE_MAX} par ligne`, gros[0].qte === QTE_MAX, gros[0].qte);
  check('Le compteur additionne les lignes', nombreDArticles([{ qte: 2 }, { qte: 3 }]) === 5);
}

console.log('\n── Changer une quantité ────────────────────────────');
{
  const panier = [{ id: 'kush', variantId: '1g', qte: 2 }, { id: 'brique', variantId: null, qte: 1 }];
  check('Plus, dans la limite du stock', changerQte(panier, 0, 9, catalogue)[0].qte === 3);
  check('Zéro retire la ligne', changerQte(panier, 0, 0, catalogue).length === 1);
  check('Une ligne inconnue ne casse rien', changerQte(panier, 7, 1, catalogue).length === 2);
}

console.log('\n── Un panier relu ──────────────────────────────────');
{
  const relu = nettoyer([
    { id: 'kush', variantId: '1g', qte: 9 },        // le stock a baissé
    { id: 'kush', variantId: '1g', qte: 1 },        // doublon
    { id: 'kush', variantId: 'disparu', qte: 1 },   // format supprimé
    { id: 'parti', variantId: null, qte: 1 },       // produit retiré
    { id: 'brique', variantId: 'x', qte: 1 },       // format sur un produit simple
    { id: 'kush', variantId: '5g', qte: 1 },        // épuisé
    null, 'abîmé',
  ], catalogue);
  check('Il ne reste que ce que la boutique peut servir', relu.length === 1, JSON.stringify(relu));
  check('Ramené au stock, doublons fondus', relu[0]?.qte === 3, relu[0]?.qte);
  check('Un panier illisible devient vide', nettoyer('pas un tableau', catalogue).length === 0);
}

console.log('\n── Le total et le récapitulatif ────────────────────');
{
  const panier = [{ id: 'kush', variantId: '1g', qte: 2 }, { id: 'brique', variantId: null, qte: 1 }];
  const chiffre = detailler(panier, catalogue);
  check('Le total suit les prix remisés', chiffre.total === 2 * 1080 + 1800, chiffre.total);
  check('Et dit ce que la promo fait économiser', chiffre.economie === 2 * 120, chiffre.economie);
  const texte = recapitulatif(chiffre, { boutique: 'O68', titre: 'Ma commande', totalMot: 'Total', formatPrix: euros });
  check('Le récapitulatif nomme la boutique', texte.startsWith('Ma commande — O68'), texte.split('\n')[0]);
  check('Chaque ligne porte quantité, nom, format et montant', texte.includes('• 2 × Néon Kush (1 g) — 21,60 €'));
  check('Le produit simple n a pas de format entre parenthèses', texte.includes('• 1 × Brique 68 — 18,00 €'));
  check('Le total et l économie', texte.includes('Total : 39,60 € (−2,40 €)'));
}

/* ── Côté serveur ────────────────────────────────────────── */

console.log('\n── Le serveur ──────────────────────────────────────');
const admin = { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': signInitData(TOKEN, { id: 424242, first_name: 'Patron' }) };
const api = async (method, chemin, body) => {
  const res = await fetch(`${BASE}/api/admin${chemin}`, { method, headers: admin, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const catalogueServi = async () => (await fetch(`${BASE}/api/catalog`)).json();

const { products } = await catalogueServi();
const cible = products[0];
const avant = { remise: cible.remise ?? 0 };
const reglagesAvant = (await catalogueServi()).promoBandeau;

try {
  check('Une promo de 95 % est refusée', (await api('PATCH', `/products/${cible.id}`, { remise: 95 })).status === 400);
  check('Une promo négative aussi', (await api('PATCH', `/products/${cible.id}`, { remise: -5 })).status === 400);
  const pose = await api('PATCH', `/products/${cible.id}`, { remise: 15 });
  check('Une promo de 15 % passe', pose.status === 200 && pose.data.remise === 15, `HTTP ${pose.status}`);
  const servi = (await catalogueServi()).products.find((p) => p.id === cible.id);
  check('Le catalogue public la montre', servi.remise === 15);
  check('Sans toucher au prix enregistré', servi.price === cible.price, `${servi.price} / ${cible.price}`);
  const retire = await api('PATCH', `/products/${cible.id}`, { remise: 0 });
  check('Zéro retire la promo', retire.status === 200 && retire.data.remise === undefined, JSON.stringify(retire.data.remise));

  const bandeau = await api('PUT', '/settings', { promoBandeau: { actif: false, titre: '  Black Friday  ' } });
  check('Le bandeau se règle', bandeau.status === 200 && bandeau.data.promoBandeau?.actif === false, `HTTP ${bandeau.status}`);
  check('Son titre est nettoyé', bandeau.data.promoBandeau?.titre === 'Black Friday', bandeau.data.promoBandeau?.titre);
  const servis = await catalogueServi();
  check('Le catalogue public porte le bandeau', servis.promoBandeau?.actif === false);
  check('Et le compte des cœurs', servis.coeurs && typeof servis.coeurs === 'object');
  const partiel = await api('PUT', '/settings', { promoBandeau: { actif: true } });
  check('Un réglage partiel garde le titre', partiel.data.promoBandeau?.titre === 'Black Friday');

  // La commande enregistrée paie le prix remisé, comme la boutique l'affiche.
  await api('PATCH', `/products/${cible.id}`, { remise: 20 });
  const produit = (await catalogueServi()).products.find((p) => p.id === cible.id);
  const format = produit.variants?.find((v) => Number(v.stock) > 0) ?? null;
  const plein = format ? format.price : produit.price;
  const client = { id: 600000000 + Math.floor(Math.random() * 9999999), first_name: 'Testeur' };
  const initClient = signInitData(TOKEN, client);
  const pass = await getShopPass(BASE, initClient);
  const res = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initClient, 'X-Shop-Pass': pass },
    body: JSON.stringify({ items: [{ id: produit.id, variantId: format?.id ?? null, quantity: 2 }], mode: 'pickup' }),
  });
  const commande = await res.json().catch(() => ({}));
  check('La commande passe', res.status === 201, `HTTP ${res.status} ${commande.error ?? ''}`);
  check('Au prix remisé, calculé comme la boutique', commande.items?.[0]?.unitPrice === apresRemise(plein, 20),
    `${commande.items?.[0]?.unitPrice} pour ${apresRemise(plein, 20)}`);
  check('Et le total suit', commande.subtotal === 2 * apresRemise(plein, 20), commande.subtotal);
  // On l'annule : le stock revient en rayon.
  if (commande.reference) await api('POST', `/orders/${commande.reference}/status`, { status: 'annulee' });
} finally {
  await api('PATCH', `/products/${cible.id}`, avant);
  await api('PUT', '/settings', { promoBandeau: reglagesAvant ?? { actif: true, titre: '' } });
}

console.log(`\n${failures ? `${failures} test(s) en échec` : 'Panier et promos : OK'}`);
process.exit(failures ? 1 : 0);
