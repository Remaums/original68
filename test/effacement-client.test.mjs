/**
 * Effacer les données d'une personne, depuis le panneau.
 *
 * Ce que cette suite protège, et qui est le seul vrai risque de la
 * fonctionnalité : **un effacement partiel est pire que pas d'effacement du
 * tout**, parce qu'il annonce que c'est fait. Le vendeur répond « c'est
 * effacé » à son client, et le téléphone dort toujours dans un magasin qu'on
 * avait oublié.
 *
 * On ne se contente donc pas de croire le rapport du serveur : on repose les
 * questions **avec les yeux du client** — ses favoris, sa langue, ses
 * alertes, ses commandes, son profil — et chacune doit rendre un compte neuf.
 *
 * Et on éprouve les deux modes, qui ne se valent pas :
 *   — `oublier` : les commandes restent, sans personne dedans. Le bilan ne
 *     bouge pas. C'est presque toujours le bon choix.
 *   — `effacer` : elles partent aussi, et leur chiffre avec.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/effacement-client.test.mjs
 */
import 'dotenv/config';
import { signInitData, getShopPass, resetShop } from './helpers.mjs';

const TOKEN = process.env.BOT_TOKEN;
const BASE = process.env.TEST_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}
const ADMIN = signInitData(TOKEN, { id: 424242, first_name: 'Patron' });
const h = (initData) => ({ 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initData });

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

// La suite pose son propre décor, comme les autres : sans ça, elle dépend de
// ce que la précédente a laissé — et sur une boutique neuve, dont le rideau
// est baissé, la commande de la dernière partie rend 503. C'est la convention
// du projet, et elle existe exactement pour cette raison.
await resetShop(BASE, ADMIN, { features: { waitlist: true, favoris: true } });

// Une souche large et TIRÉE AU SORT, pas `Date.now() % 20000`.
//
// Vingt mille identifiants possibles pour une boutique de développement qui
// en a déjà vu un millier passer commande : environ une exécution sur quinze
// tombait sur un ancien client, qui entre alors sans épreuve — et la suite
// échouait sur « Rallumée, elle referme », une fois sur quinze, sans rien
// qui l'explique. Le hasard sur un milliard rend la collision négligeable.
const souche = 2000000000 + Math.floor(Math.random() * 900000000);
let suivant = 0;
const personne = (prenom = 'Passant') => {
  const id = souche + suivant++;
  return { id, initData: signInitData(TOKEN, { id, first_name: prenom }) };
};

const donnees = async (id) =>
  (await fetch(`${BASE}/api/admin/clients/${id}/donnees`, { headers: h(ADMIN) })).json();
const effacer = (id, corps, initData = ADMIN) =>
  fetch(`${BASE}/api/admin/clients/${id}/effacer`, {
    method: 'POST', headers: h(initData), body: JSON.stringify(corps),
  });

/**
 * Un article épuisé, pour pouvoir s'inscrire à son retour.
 *
 * On ne s'inscrit qu'à ce qui manque — le serveur refuse l'attente sur un
 * article disponible, et il a raison. La suite met donc un article à zéro,
 * et le rend tel qu'elle l'a trouvé à la fin.
 */
const stockDe = (p, v) => (v ? Number(v.stock ?? 0) : Number(p.stock ?? 0));
const poserLeStock = (produit, variantId, quantity) =>
  fetch(`${BASE}/api/admin/products/${produit}/stock`, {
    method: 'POST', headers: h(ADMIN), body: JSON.stringify({ variantId, quantity }),
  });
let aRemettre = null;
let premier = true;

/** Un client qui a vécu : une langue, un favori, une alerte, des réglages. */
async function semerDesDonnees(qui) {
  // La porte d'abord, sinon tout le reste est refusé.
  await fetch(`${BASE}/api/admin/porte/${qui.id}`, { method: 'POST', headers: h(ADMIN) });
  const produits = (await (await fetch(`${BASE}/api/catalog`)).json()).products;
  const cible = produits[0];
  const variante = cible.variants?.[0] ?? null;
  if (!aRemettre) {
    aRemettre = { id: cible.id, variantId: variante?.id ?? null, quantity: stockDe(cible, variante) };
    await poserLeStock(cible.id, aRemettre.variantId, 0);
  }
  await fetch(`${BASE}/api/langue`, {
    method: 'PUT', headers: h(qui.initData), body: JSON.stringify({ code: 'it' }),
  });
  await fetch(`${BASE}/api/favoris`, {
    method: 'POST', headers: h(qui.initData), body: JSON.stringify({ id: cible.id }),
  });
  await fetch(`${BASE}/api/profil/preferences`, {
    method: 'PUT', headers: h(qui.initData), body: JSON.stringify({ nouveautes: false }),
  });
  // L'alerte de retour n'a de sens que tant que l'article est épuisé — donc
  // pour le premier semis seulement, avant que le stock ne soit rendu. Les
  // suivants s'y heurteraient à un « cet article est disponible », refus juste
  // qui n'apprendrait rien ici.
  if (premier) {
    premier = false;
    const r = await fetch(`${BASE}/api/waitlist`, {
      method: 'POST', headers: h(qui.initData),
      body: JSON.stringify({ id: cible.id, variantId: aRemettre.variantId }),
    });
    if (r.status !== 201) {
      console.error(`  (attente non posée : HTTP ${r.status} ${await r.text()})`);
    }
  }
  return cible;
}

/** Ce que la personne voit d'elle-même. Un compte effacé doit avoir l'air neuf. */
async function sesYeux(qui) {
  const lire = async (chemin) => {
    const r = await fetch(`${BASE}${chemin}`, { headers: h(qui.initData) });
    return r.ok ? r.json() : null;
  };
  // La liste d'attente se lit ligne par ligne : sans l'identifiant en
  // paramètre, la route répond sur une clef vide et rend toujours « non ».
  // Ma première version l'interrogeait ainsi et prenait ce « non » pour une
  // preuve d'effacement.
  const ligne = `/api/waitlist?id=${encodeURIComponent(aRemettre.id)}` +
    (aRemettre.variantId ? `&variantId=${encodeURIComponent(aRemettre.variantId)}` : '');
  const [favoris, langue, profil, attente] = await Promise.all([
    lire('/api/favoris'), lire('/api/langue'), lire('/api/profil'), lire(ligne),
  ]);
  return { favoris, langue, profil, attente };
}

console.log('\n── Ce qu on trouve avant d effacer ─────────────────');

const client = personne('Éphémère');
const produit = await semerDesDonnees(client);

let vu = await donnees(client.id);
// `connu` vient du registre du bot, que seule une conversation remplit : une
// suite qui ne parle qu'en HTTP ne peut pas le semer. Ce qu'elle peut
// éprouver, c'est tout le reste.
check('Le panneau compte ses favoris', vu.favoris >= 1, String(vu.favoris));
check("Il n'est pas administrateur", vu.admin === false);

const avant = await sesYeux(client);
check('Sa langue est enregistrée', avant.langue?.code === 'it', JSON.stringify(avant.langue));
// Le produit exact, pas « la réponse fait plus de deux caractères » : ma
// première version passait sur `{"favoris":[],"max":100}`, c'est-à-dire sur
// un favori qui n'avait jamais été posé.
check('Son favori porte le bon produit',
  (avant.favoris?.favoris ?? []).includes(produit.id),
  JSON.stringify(avant.favoris).slice(0, 80));
check('Son alerte de retour est posée', avant.attente?.subscribed === true,
  JSON.stringify(avant.attente));

console.log('\n── Ce qu on refuse ─────────────────────────────────');

let r = await effacer(client.id, { mode: 'oublier' });
check('Sans le mot de confirmation, rien', r.status === 400, `HTTP ${r.status}`);
check('Et le refus dit lequel', /EFFACER/.test((await r.json()).error ?? ''), '');

r = await effacer(client.id, { mode: 'nimporte', confirmation: 'EFFACER', sauvegarde: false });
check('Un mode inconnu est refusé', r.status === 400, `HTTP ${r.status}`);

r = await effacer('pas-un-identifiant', { mode: 'oublier', confirmation: 'EFFACER', sauvegarde: false });
check('Un identifiant qui n en est pas un est refusé', r.status === 400, `HTTP ${r.status}`);

// Le garde-fou qui coûte le plus cher s'il manque : s'effacer soi-même.
r = await effacer(424242, { mode: 'effacer', confirmation: 'EFFACER', sauvegarde: false });
check('On ne peut pas effacer un administrateur', r.status === 400, `HTTP ${r.status}`);
check('Et le refus dit pourquoi',
  /administratrice|droits/i.test((await r.json()).error ?? ''), '');

r = await effacer(client.id, { mode: 'oublier', confirmation: 'EFFACER', sauvegarde: false },
  signInitData(TOKEN, { id: 778899, first_name: 'Curieux' }));
check('Un client ne peut effacer personne', r.status === 403, `HTTP ${r.status}`);

// Après tous ces refus, rien n'a bougé : un refus qui efface à moitié serait
// le pire des deux mondes.
vu = await donnees(client.id);
check("Aucun refus n a effacé quoi que ce soit", vu.favoris >= 1,
  JSON.stringify({ favoris: vu.favoris }));

console.log('\n── Oublier ─────────────────────────────────────────');

r = await effacer(client.id, { mode: 'oublier', confirmation: 'EFFACER', sauvegarde: false });
const rapport = await r.json();
check("L'effacement est accepté", r.status === 200, `HTTP ${r.status}`);
check('Le rapport dit ce qu il a trouvé AVANT', rapport.avant?.favoris >= 1,
  JSON.stringify(rapport.avant));

vu = await donnees(client.id);
check('Le panneau ne le connaît plus', vu.connu === false);
check('Plus de favoris', vu.favoris === 0, String(vu.favoris));
check('Plus de vérification', vu.verification === 'none', vu.verification);

// L'effacement a refermé la porte du bot sur lui — c'est normal, elle est
// une donnée comme une autre. On la rouvre pour pouvoir REGARDER : sans ça,
// tout rendrait 403 et l'on prendrait un refus pour un magasin vide. C'est
// exactement le piège dans lequel ma première version est tombée.
r = await fetch(`${BASE}/api/admin/porte/${client.id}`, { method: 'POST', headers: h(ADMIN) });
check('La porte s était refermée sur lui', r.status === 200, `HTTP ${r.status}`);

// Le point de la suite : on repose les questions avec SES yeux.
const apres = await sesYeux(client);
check('Sa langue est oubliée', apres.langue?.code !== 'it', JSON.stringify(apres.langue));
check('Ses favoris sont vides',
  Array.isArray(apres.favoris?.favoris) && apres.favoris.favoris.length === 0,
  JSON.stringify(apres.favoris).slice(0, 80));
check('Son alerte de retour a disparu', apres.attente?.subscribed === false,
  JSON.stringify(apres.attente));

console.log('\n── Effacer, quand il ne doit rien rester ───────────');

const autre = personne('Second');
await semerDesDonnees(autre);
r = await effacer(autre.id, { mode: 'effacer', confirmation: 'EFFACER', sauvegarde: false });
const second = await r.json();
check('Accepté', r.status === 200, `HTTP ${r.status}`);
check('Le mode est rendu tel quel', second.mode === 'effacer', second.mode);

vu = await donnees(autre.id);
check('Il ne reste rien', vu.connu === false && vu.favoris === 0 && vu.commandes === 0,
  JSON.stringify({ connu: vu.connu, favoris: vu.favoris, commandes: vu.commandes }));

// Le stock est rendu AVANT la suite, et non à la fin.
//
// La partie « commandes » prend une sauvegarde et la restaure, pour éprouver
// qu'une commande anonymisée y survit. Cette restauration réécrit le
// catalogue à partir de la sauvegarde — donc avec l'article encore à zéro, et
// avec des identifiants de format repassés par la normalisation, qui renomme
// « 1.2g » en « 1-2g » sur une boutique neuve. Remettre le stock après cela,
// c'est viser un format qui n'existe plus : 404, et une suite qui laisse un
// article épuisé derrière elle.
if (aRemettre) {
  const remise = await poserLeStock(aRemettre.id, aRemettre.variantId, aRemettre.quantity);
  const produits = (await (await fetch(`${BASE}/api/catalog`)).json()).products;
  const remis = produits.find((p) => p.id === aRemettre.id);
  const variante = remis?.variants?.find((v) => v.id === aRemettre.variantId) ?? null;
  check('Le stock est rendu tel qu on l a trouvé',
    remise.ok && stockDe(remis ?? {}, variante) === aRemettre.quantity,
    `${stockDe(remis ?? {}, variante)} / ${aRemettre.quantity}`);
}

console.log('\n── Les commandes : la seule vraie différence ───────');

// Jusqu'ici les deux modes faisaient la même chose. C'est sur les commandes
// qu'ils se séparent, et c'est le choix que le vendeur doit comprendre :
// oublier garde la comptabilité, effacer la réécrit.
const acheteur = personne('Acheteur');
const rayon = (await (await fetch(`${BASE}/api/catalog`)).json()).products
  .find((p) => p.id !== aRemettre.id && (!p.variants || p.variants.some((v) => v.stock > 0)));
const format = rayon.variants?.find((v) => v.stock > 0) ?? null;
// Deux portes à franchir, pas une : celle du bot, et l'épreuve de tuiles de
// la boutique, qui voyage dans `X-Shop-Pass`. Sans la seconde, la commande
// rend 403 et l'on croit à un bogue de l'effacement.
const commander = async (qui) => {
  await fetch(`${BASE}/api/admin/porte/${qui.id}`, { method: 'POST', headers: h(ADMIN) });
  const laissezPasser = await getShopPass(BASE, qui.initData);
  return fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { ...h(qui.initData), ...(laissezPasser ? { 'X-Shop-Pass': laissezPasser } : {}) },
    body: JSON.stringify({ items: [{ id: rayon.id, variantId: format?.id, quantity: 1 }], mode: 'pickup' }),
  });
};

r = await commander(acheteur);
check('Sa commande est passée', r.status === 201, `HTTP ${r.status} ${r.ok ? '' : await r.text()}`);
const commande = await r.json();

vu = await donnees(acheteur.id);
check('Le panneau voit sa commande', vu.commandes === 1, String(vu.commandes));
check('Et ce qu il a dépensé', vu.depense > 0, String(vu.depense));

await effacer(acheteur.id, { mode: 'oublier', confirmation: 'EFFACER', sauvegarde: false });
vu = await donnees(acheteur.id);
check('Oublier : la commande reste, mais plus à son nom', vu.commandes === 0, String(vu.commandes));

// Elle est toujours dans le magasin du vendeur, montant compris.
const toutes = await (await fetch(`${BASE}/api/admin/orders`, { headers: h(ADMIN) })).json();
const liste = Array.isArray(toutes) ? toutes : (toutes.orders ?? []);
const gardee = liste.find((o) => o.reference === (commande.reference ?? commande.order?.reference));
check('Le vendeur la voit encore', Boolean(gardee), commande.reference ?? '?');
check("Elle n'a plus de nom",
  gardee?.user?.id === null && gardee?.anonymise === true,
  JSON.stringify({ user: gardee?.user, anonymise: gardee?.anonymise }));
check('Mais elle garde son montant', (gardee?.total ?? 0) > 0, String(gardee?.total));

// Puis le second acheteur, qu'on efface pour de bon.
const acheteur2 = personne('Acheteur2');
r = await commander(acheteur2);
check('La seconde commande passe aussi', r.status === 201, `HTTP ${r.status}`);
const commande2 = await r.json();
await effacer(acheteur2.id, { mode: 'effacer', confirmation: 'EFFACER', sauvegarde: false });
const apresTout = await (await fetch(`${BASE}/api/admin/orders`, { headers: h(ADMIN) })).json();
const liste2 = Array.isArray(apresTout) ? apresTout : (apresTout.orders ?? []);
const ref2 = commande2.reference ?? commande2.order?.reference;
check('Effacer : la commande a disparu du magasin',
  !liste2.some((o) => o.reference === ref2), ref2 ?? '?');

// Et elle doit SURVIVRE à un aller-retour de sauvegarde. Le filtre de
// restauration écartait toute commande sans identifiant — c'est-à-dire
// exactement celles qu'on vient d'anonymiser. Une boutique qui suivait le
// conseil du panneau perdait donc sa comptabilité à la première restauration,
// et rien ne le disait.
const copie = await (await fetch(`${BASE}/api/admin/backup`, { headers: h(ADMIN) })).json();
check('La sauvegarde emporte la commande anonymisée',
  copie.orders.some((o) => o.reference === gardee?.reference), String(copie.counts?.orders));
r = await fetch(`${BASE}/api/admin/backup/restore`, {
  method: 'POST', headers: h(ADMIN), body: JSON.stringify(copie),
});
const restaure = await r.json();
check('La restauration ne la jette pas', (restaure.commandes?.ecartees ?? 0) === 0,
  JSON.stringify(restaure.commandes ?? restaure));
const apresRestauration = await (await fetch(`${BASE}/api/admin/orders`, { headers: h(ADMIN) })).json();
const listeR = Array.isArray(apresRestauration) ? apresRestauration : (apresRestauration.orders ?? []);
check('Elle est toujours là après restauration',
  listeR.some((o) => o.reference === gardee?.reference), gardee?.reference ?? '?');

console.log('\n── Ce qui n est PAS effacé, et se dit ──────────────');

// Effacer quelqu'un ne le débloque pas : sinon l'effacement deviendrait le
// moyen de se débloquer soi-même.
const gener = personne('Génant');
await semerDesDonnees(gener);
await fetch(`${BASE}/api/admin/clients/${gener.id}/block`, { method: 'POST', headers: h(ADMIN) });
const avantBloc = await donnees(gener.id);
r = await effacer(gener.id, { mode: 'oublier', confirmation: 'EFFACER', sauvegarde: false });
const troisieme = await r.json();
if (avantBloc.bloque) {
  check('Un bloqué reste bloqué', (await donnees(gener.id)).bloque === true);
  check('Et le rapport le dit', troisieme.bloqueEncore === true, String(troisieme.bloqueEncore));
} else {
  check('Le blocage a bien été posé', false, 'la suite ne prouve rien sans lui');
}
// Et on le débloque : la suite ne laisse pas un compte bloqué derrière elle.
await fetch(`${BASE}/api/admin/clients/${gener.id}/unblock`, { method: 'POST', headers: h(ADMIN) });

console.log(`\nEffacement d'une personne : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
