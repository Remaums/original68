/**
 * Le rideau de fer.
 *
 * Deux choses à prouver, et la seconde compte autant que la première :
 * que la boutique disparaît bien pour tout le monde, et que l'espace admin
 * reste joignable pour la faire revenir. Un rideau qu'on ne peut plus lever
 * n'est pas une sécurité, c'est une panne qu'on s'est infligée.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/urgence.test.mjs
 */
import 'dotenv/config';
import { signInitData } from './helpers.mjs';

const TOKEN = process.env.BOT_TOKEN;
const BASE = process.env.TEST_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

const admin = signInitData(TOKEN, { id: 424242, first_name: 'Patron' });
const client = signInitData(TOKEN, { id: 850001, first_name: 'Client' });

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const rideau = (urgence) =>
  fetch(`${BASE}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': admin },
    body: JSON.stringify({ urgence }),
  });

const code = async (chemin, init = {}) => (await fetch(`${BASE}${chemin}`, init)).status;

/* ── Rideau levé : rien ne doit avoir changé ─────────────── */

console.log('\n── Rideau levé ─────────────────────────────────────');
await rideau(false);

check('La boutique s\'affiche', (await code('/')) === 200);
check('Le catalogue répond', (await code('/api/catalog')) === 200);

/* ── Rideau baissé ───────────────────────────────────────── */

console.log('\n── Rideau baissé ───────────────────────────────────');
let r = await rideau(true);
check('Le rideau se baisse depuis l\'admin', r.ok, `HTTP ${r.status}`);

r = await fetch(`${BASE}/`);
const page = await r.text();
check('La page d\'accueil s\'en va', r.status === 200 && page.includes('google.com'),
  page.slice(0, 48));
// Sans cet en-tête, une Mini App rouverte servirait la page de renvoi gardée
// en mémoire alors que le rideau est déjà relevé — ou l'inverse, bien pire.
check('Elle interdit la mise en cache',
  /no-store/.test(r.headers.get('cache-control') ?? ''), r.headers.get('cache-control'));
// Ce qui ne doit surtout PAS fuir : un fragment de la boutique.
check('Elle ne laisse rien voir de la boutique',
  !/Original68|catalogue|produit/i.test(page), page.length + ' octets');

check('Le catalogue se tait', (await code('/api/catalog')) === 503);
check('On ne peut plus commander',
  (await code('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': client },
    body: JSON.stringify({ items: [] }),
  })) === 503);
check('Ni lire ses favoris',
  (await code('/api/favoris', { headers: { 'X-Telegram-Init-Data': client } })) === 503);

/* ── … mais la porte de service reste ouverte ────────────── */

console.log('\n── Ce qui reste debout ─────────────────────────────');

// Le point qui fait de ce bouton une sécurité plutôt qu'un piège.
check('L\'écran d\'admin s\'affiche encore', (await code('/admin.html')) === 200);
check('Son API répond encore',
  (await code('/api/admin/session', { headers: { 'X-Telegram-Init-Data': admin } })) === 200);
check('Ses feuilles de style arrivent', (await code('/css/admin.css')) === 200);
check('Son script aussi', (await code('/js/admin.js')) === 200);
check('Et ses polices', (await code('/assets/fonts/inter-latin.woff2')) === 200);

/* ── Et personne d'autre n'y touche ──────────────────────── */

console.log('\n── La porte ────────────────────────────────────────');

check('Un client ne relève pas le rideau',
  (await code('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': client },
    body: JSON.stringify({ urgence: false }),
  })) === 403);
check('Sans signature non plus',
  (await code('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urgence: false }),
  })) === 401);
check('Et le rideau tient toujours', (await code('/api/catalog')) === 503);

/* ── On relève ───────────────────────────────────────────── */

console.log('\n── Retour à la normale ─────────────────────────────');
r = await rideau(false);
check('Le rideau se relève', r.ok, `HTTP ${r.status}`);
check('La boutique revient', (await code('/')) === 200);
check('Le catalogue aussi', (await code('/api/catalog')) === 200);

// Le rideau est une chose, la fermeture du soir en est une autre : baisser
// l'un ne doit pas fermer l'autre, sinon on relève le rideau et l'on
// découvre une boutique fermée sans savoir pourquoi.
const reglages = await (await fetch(`${BASE}/api/admin/settings`, {
  headers: { 'X-Telegram-Init-Data': admin },
})).json();
check('Il n\'a pas touché à l\'ouverture', reglages.opening?.open === true,
  `open = ${reglages.opening?.open}`);
check('Et il est bien rangé dans les réglages', reglages.urgence === false);

console.log(`\n${failures ? `${failures} test(s) en échec` : 'Urgence : OK'}`);
process.exit(failures ? 1 : 0);
