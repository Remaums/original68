/**
 * Dupliquer une fiche produit.
 *
 * Un vendeur qui saisit vingt variétés ne change que le nom et la photo :
 * mêmes formats, mêmes prix, mêmes caractéristiques. Tout retaper, c'est
 * une demi-heure par produit et une faute de frappe sur le troisième.
 *
 * Ce que cette suite protège, et qui n'est pas cosmétique :
 *
 * - **le stock ne se copie pas.** Un stock repris, c'est de la marchandise
 *   annoncée qui n'existe pas, et un client qui commande ce qu'on ne peut
 *   pas lui remettre. Sur la fiche ET sur chaque format.
 * - **la copie naît masquée.** C'est ce qui permet d'en faire vingt de suite
 *   sans rien montrer d'à moitié fait.
 * - **aucune annonce ne part d'une copie**, et une annonce part quand le
 *   vendeur la publie. Sans le second point, un brouillon entrerait au
 *   catalogue en silence — et la seule façon d'être annoncé serait de ne
 *   pas se relire.
 * - **l'identifiant se déduit du nom donné**, pas de « (copie) » : il sert
 *   de clé dans les commandes et ne bouge plus jamais.
 *
 * Usage :  BOT_TOKEN=… node test/duplication.test.mjs
 */
import 'dotenv/config';
import { signInitData, resetShop } from './helpers.mjs';

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

await resetShop(BASE, ADMIN, { features: { announcements: true } });

const marque = Date.now().toString(36);
const SOURCE = `dup-source-${marque}`;
const aRanger = [SOURCE];

const original = {
  id: SOURCE,
  name: 'Plasma Static — Original',
  category: 'fleurs',
  short: 'Le court',
  description: 'Première ligne\n- Un point\n- Un autre',
  points: ['Texture souple', "Scellé d'origine"],
  tags: ['indica', 'intérieur'],
  badge: 'TOP VENTE',
  image: '/assets/products/box.svg',
  // Un prix de fiche même avec des formats : le catalogue le valide avant de
  // regarder les variantes, et le refuse s'il manque.
  price: 1000,
  visible: true,
  variants: [
    { label: '1 g', price: 1000, stock: 17 },
    { label: '5 g', price: 4500, stock: 4 },
  ],
};

let r = await fetch(`${BASE}/api/admin/products`, {
  method: 'POST', headers: h(ADMIN), body: JSON.stringify(original),
});
const source = await r.json();
check("L'original est créé", r.status === 201, `HTTP ${r.status} ${source.error ?? ''}`);
// Sans lui, tout ce qui suit compare des `undefined` entre eux et passe pour
// vert. On s'arrête là plutôt que de rendre un rapport qui ment.
if (r.status !== 201) {
  console.log("\nRien à éprouver sans l'original.");
  process.exit(1);
}

// On vieillit l'original avant de le copier : sans cela les deux dates ne
// diffèrent que de quelques millisecondes, et l'épreuve passerait même si la
// copie reprenait la date de sa source — ce qui la ferait entrer dans les
// « nouveautés » avec l'ancienneté de l'original.
const VIEUX = '2020-03-01T12:00:00.000Z';
await fetch(`${BASE}/api/admin/products/${SOURCE}`, {
  method: 'PATCH', headers: h(ADMIN), body: JSON.stringify({ createdAt: VIEUX }),
});

console.log('\n── Ce que la copie reprend ─────────────────────────');

r = await fetch(`${BASE}/api/admin/products/${SOURCE}/dupliquer`, {
  method: 'POST', headers: h(ADMIN), body: JSON.stringify({ name: 'Plasma Static — Banana' }),
});
const copie = await r.json();
check('La copie est créée', r.status === 201, `HTTP ${r.status} ${copie.error ?? ''}`);
if (copie.id) aRanger.push(copie.id);

check("L'identifiant vient du nom donné", copie.id === 'plasma-static-banana', copie.id);
check('Le nom est celui demandé', copie.name === 'Plasma Static — Banana', copie.name);
check('La catégorie suit', copie.category === original.category, copie.category);
check('Le texte court suit', copie.short === original.short, copie.short);
check('La description suit', copie.description === original.description, copie.description);
check('Les caractéristiques suivent',
  JSON.stringify(copie.points) === JSON.stringify(original.points), JSON.stringify(copie.points));
check('Les étiquettes suivent', JSON.stringify(copie.tags) === JSON.stringify(original.tags),
  JSON.stringify(copie.tags));
check('La pastille suit', copie.badge === original.badge, copie.badge);
check('Les formats suivent, libellés et prix',
  copie.variants?.length === 2 &&
    copie.variants[0].label === '1 g' && copie.variants[0].price === 1000 &&
    copie.variants[1].label === '5 g' && copie.variants[1].price === 4500,
  JSON.stringify(copie.variants?.map((v) => `${v.label}@${v.price}`)));

console.log('\n── Ce que la copie NE reprend PAS ──────────────────');

check('Le stock de chaque format est à zéro',
  copie.variants?.every((v) => v.stock === 0),
  JSON.stringify(copie.variants?.map((v) => v.stock)));
check('La copie naît masquée', copie.visible === false, String(copie.visible));
check("La date d'entrée est celle d'aujourd'hui, pas celle de l'original",
  copie.createdAt !== VIEUX && Date.now() - Date.parse(copie.createdAt) < 60000,
  `${VIEUX} → ${copie.createdAt}`);

console.log('\n── Ce que le client voit ───────────────────────────');

const vitrine = await (await fetch(`${BASE}/api/catalog`)).json();
const ids = (vitrine.products ?? []).map((p) => p.id);
check("L'original est au catalogue", ids.includes(SOURCE));
check('La copie masquée n y est pas', !ids.includes(copie.id), ids.filter((i) => i.startsWith('plasma-static')).join(','));

console.log('\n── Les garde-fous ──────────────────────────────────');

r = await fetch(`${BASE}/api/admin/products/${SOURCE}/dupliquer`, {
  method: 'POST', headers: h(ADMIN), body: JSON.stringify({ name: '   ' }),
});
check('Une copie sans nom est refusée', r.status === 400, `HTTP ${r.status}`);

r = await fetch(`${BASE}/api/admin/products/${SOURCE}/dupliquer`, {
  method: 'POST', headers: h(ADMIN), body: JSON.stringify({ name: 'Plasma Static — Banana' }),
});
check('Deux copies du même nom : la seconde est refusée', r.status === 409, `HTTP ${r.status}`);

r = await fetch(`${BASE}/api/admin/products/nexiste-pas-${marque}/dupliquer`, {
  method: 'POST', headers: h(ADMIN), body: JSON.stringify({ name: 'Fantôme' }),
});
check('Dupliquer un produit inconnu est refusé', r.status === 404, `HTTP ${r.status}`);

r = await fetch(`${BASE}/api/admin/products/${SOURCE}/dupliquer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': signInitData(TOKEN, { id: 777333, first_name: 'Curieux' }) },
  body: JSON.stringify({ name: 'Vol de fiche' }),
});
check('Un client ne duplique rien', r.status === 403, `HTTP ${r.status}`);

console.log('\n── Publier la copie ────────────────────────────────');

r = await fetch(`${BASE}/api/admin/products/${copie.id}`, {
  method: 'PATCH', headers: h(ADMIN), body: JSON.stringify({ visible: true }),
});
const publiee = await r.json();
check('Elle se publie', r.status === 200 && publiee.visible === true, `HTTP ${r.status}`);
const apres = await (await fetch(`${BASE}/api/catalog`)).json();
check('Et elle apparaît alors au catalogue',
  (apres.products ?? []).some((p) => p.id === copie.id));

/* ── Rangement ── */
for (const id of aRanger) {
  await fetch(`${BASE}/api/admin/products/${id}`, { method: 'DELETE', headers: h(ADMIN) }).catch(() => {});
}

console.log(`\nDuplication : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
