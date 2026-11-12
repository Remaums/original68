/**
 * Le classement du catalogue : quel produit le client voit en premier.
 *
 * Le tri « par défaut » de la boutique suit l'ordre du tableau, en
 * repoussant seulement les articles épuisés en fin de liste. Mettre un
 * produit en avant, c'est donc le remonter dans ce tableau — et c'est ce
 * que le panneau d'administration fait maintenant faire au vendeur.
 *
 * Ce que cette suite protège, et qui n'est pas une coquetterie : on exige
 * la liste ENTIÈRE, et on vérifie que c'est une permutation exacte.
 * Accepter une liste partielle paraît plus commode — « monte celui-ci » —
 * mais deux écrans d'admin ouverts en même temps, ou un écran resté sur un
 * catalogue d'avant-hier, et les produits absents de la liste
 * disparaîtraient du catalogue. Une permutation ne peut rien perdre.
 *
 * La suite range le catalogue tel qu'elle l'a trouvé.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/classement.test.mjs
 */
import 'dotenv/config';
import { signInitData } from './helpers.mjs';

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

const catalogueAdmin = async () =>
  (await (await fetch(`${BASE}/api/admin/catalog`, { headers: h(ADMIN) })).json()).products;
const ranger = (ordre, initData = ADMIN) =>
  fetch(`${BASE}/api/admin/products/ordre`, {
    method: 'PUT', headers: h(initData), body: JSON.stringify({ ordre }),
  });

const depart = (await catalogueAdmin()).map((p) => p.id);
if (depart.length < 3) {
  console.error('Il faut au moins trois produits au catalogue pour éprouver un classement.');
  process.exit(1);
}

try {
  console.log('\n── Mettre un produit en avant ──────────────────────');

  const dernier = depart[depart.length - 1];
  let r = await ranger([dernier, ...depart.slice(0, -1)]);
  const corps = await r.json();
  check("L'ordre est accepté", r.status === 200, `HTTP ${r.status}`);
  check("Le serveur rend l'ordre retenu", corps.ordre?.[0] === dernier, corps.ordre?.[0]);

  const vu = (await (await fetch(`${BASE}/api/catalog`)).json()).products.map((p) => p.id);
  check('Le client le voit en premier', vu[0] === dernier, vu.slice(0, 2).join(' | '));
  check('Et aucun produit n a disparu', vu.length === depart.length,
    `${depart.length} → ${vu.length}`);

  console.log('\n── Ce que l on refuse ──────────────────────────────');

  // Le point de la suite : chacun de ces refus protège un produit qui,
  // sinon, quitterait le catalogue sans que personne le remarque.
  r = await ranger(depart.slice(0, 2));
  check('Une liste partielle est refusée', r.status === 400, `HTTP ${r.status}`);
  check('Et le refus dit combien il en manque',
    /manque \d+ produit/.test((await r.json()).error ?? ''), '');

  // Le refus doit nommer SA raison, pas seulement rendre 400 : une liste
  // avec un doublon est aussi plus longue que le catalogue, donc le
  // garde-fou de longueur la refuserait tout seul — et retirer celui du
  // doublon ne casserait rien ici. Lire le message, c'est éprouver le bon.
  r = await ranger([...depart, depart[0]]);
  check('Un doublon est refusé', r.status === 400, `HTTP ${r.status}`);
  check('Et le refus dit que le produit est nommé deux fois',
    /deux fois/.test((await r.json()).error ?? ''), '');

  r = await ranger(depart.map((id, i) => (i === 0 ? 'produit-fantome' : id)));
  check('Un identifiant inconnu est refusé', r.status === 400, `HTTP ${r.status}`);
  check("Et le refus le nomme", /produit-fantome/.test((await r.json()).error ?? ''), '');

  r = await ranger('pas une liste');
  check('Autre chose qu une liste est refusé', r.status === 400, `HTTP ${r.status}`);

  r = await ranger(depart, signInitData(TOKEN, { id: 778899, first_name: 'Curieux' }));
  check('Un client ne range pas le catalogue', r.status === 403, `HTTP ${r.status}`);

  // Après tous ces refus, le catalogue doit être exactement celui qu'on a
  // laissé au premier appel — aucun refus n'a écrit à moitié.
  const apresRefus = (await catalogueAdmin()).map((p) => p.id);
  check("Aucun refus n a modifié le catalogue",
    apresRefus[0] === dernier && apresRefus.length === depart.length,
    `${apresRefus.length} produits, tête : ${apresRefus[0]}`);

  console.log('\n── L ordre survit aux autres gestes ────────────────');

  // Enregistrer un produit passe par `normalizeProduct`, qui reconstruit
  // l'objet : si le rangement tenait dans le produit plutôt que dans le
  // tableau, une simple sauvegarde le perdrait.
  await fetch(`${BASE}/api/admin/products/${dernier}`, {
    method: 'PATCH', headers: h(ADMIN), body: JSON.stringify({ short: 'Retouche sans importance' }),
  });
  const apresPatch = (await catalogueAdmin()).map((p) => p.id);
  check("Enregistrer un produit ne le déplace pas", apresPatch[0] === dernier, apresPatch[0]);
} finally {
  await ranger(depart);
  const remis = (await catalogueAdmin()).map((p) => p.id);
  const identique = remis.join() === depart.join();
  console.log(`\n${identique ? 'OK   ' : 'ÉCHEC'}  Le catalogue est rendu tel qu on l a trouvé`);
  if (!identique) failures++;
}

console.log(`\nClassement : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
