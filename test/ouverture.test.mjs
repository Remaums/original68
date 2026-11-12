/**
 * Ouverture de la boutique.
 *
 * Le bandeau côté client ne suffit pas : on peut garder la Mini App ouverte
 * et valider son panier après la fermeture. C'est donc le serveur qui refuse.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/ouverture.test.mjs
 */
import 'dotenv/config';
import { signInitData, getShopPass, resetShop, franchirLaPorte } from './helpers.mjs';
import { isOpenNow, defaultHours, nextOpeningLabel, DAYS } from '../server/opening.js';

const TOKEN = process.env.BOT_TOKEN;
const BASE = process.env.TEST_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

const admin = signInitData(TOKEN, { id: 424242, first_name: 'Patron' });

// Le décor de départ, posé par cette suite plutôt que hérité de la
// précédente : sans ça, l'ordre du package.json devient un piège.
await resetShop(BASE, admin, { features: { hours: false, captcha: false } });
const client = signInitData(TOKEN, { id: 840001, first_name: 'Client' });

// L'épreuve du chat garde aussi la Mini App. Cette suite teste autre chose :
// sans ce passage, c'est la porte qui refuse en premier et les assertions
// portent sur le mauvais refus. Le défaut ne se voyait pas sur une boutique
// rodée, où ces clients avaient de vieilles commandes qui les exemptaient.
await franchirLaPorte(BASE, admin, 840001);

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const call = (path, { method = 'GET', body, init = admin, pass } = {}) =>
  fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': init,
      ...(pass ? { 'X-Shop-Pass': pass } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

/* ── Le calcul des horaires, sans serveur ────────────────── */

const jours = defaultHours();
const paris = (days) => ({ open: true, hours: { enabled: true, timezone: 'Europe/Paris', days } });
const at = (iso) => new Date(iso);

check('Ouvert dans le créneau', isOpenNow(paris(jours), at('2026-09-15T12:00:00Z')).open);
check('Fermé avant le créneau', !isOpenNow(paris(jours), at('2026-09-15T07:00:00Z')).open);
check('Jour marqué fermé', !isOpenNow(paris({ ...jours, mar: { closed: true } }), at('2026-09-15T12:00:00Z')).open);

const nuit = { ...jours, mar: { closed: false, from: '22:00', to: '02:00' }, mer: { closed: true } };
check('Créneau de nuit, avant minuit', isOpenNow(paris(nuit), at('2026-09-15T21:00:00Z')).open);
check('Créneau de nuit, après minuit', isOpenNow(paris(nuit), at('2026-09-15T23:00:00Z')).open, "horaire de la veille");
check('Créneau de nuit terminé', !isOpenNow(paris(nuit), at('2026-09-16T01:00:00Z')).open);
check("L'interrupteur prime sur les horaires",
  !isOpenNow({ ...paris(jours), open: false }, at('2026-09-15T12:00:00Z')).open);

/* ── Et sur le serveur ───────────────────────────────────── */

const catalog = await (await fetch(`${BASE}/api/catalog`)).json();
const product = catalog.products.find((p) => !p.variants && p.stock > 0);
await call(`/api/admin/products/${product.id}/stock`, { method: 'POST', body: { quantity: 50 } });
const panier = [{ id: product.id, quantity: 1 }];
const pass = await getShopPass(BASE, client);

const MESSAGE = 'On revient à 10 h, promis.';
await call('/api/admin/settings', { method: 'PUT', body: { opening: { open: false, message: MESSAGE } } });

let r = await fetch(`${BASE}/api/catalog`).then((x) => x.json());
check('Le catalogue annonce la fermeture', r.opening?.open === false && r.opening?.message === MESSAGE);

r = await call('/api/orders', { method: 'POST', init: client, body: { items: panier }, pass });
const data = await r.json().catch(() => ({}));
check('Commande refusée boutique fermée', r.status === 503 && data.error === MESSAGE, `HTTP ${r.status}`);

await call('/api/admin/settings', { method: 'PUT', body: { opening: { open: true } } });
r = await call('/api/orders', { method: 'POST', init: client, body: { items: panier }, pass });
check('Rouverte, la commande passe', r.status === 201, `HTTP ${r.status}`);

/* ── Un fuseau farfelu ne doit pas tout casser ───────────── */

r = await call('/api/admin/settings', {
  method: 'PUT',
  body: { opening: { hours: { enabled: true, timezone: 'Nawak/Nimporte', days: jours } } },
});
const saved = await r.json();
check('Fuseau invalide remplacé par le précédent', saved.opening.hours.timezone === 'Europe/Paris',
  saved.opening.hours.timezone);

await call('/api/admin/settings', { method: 'PUT', body: { opening: { open: true, hours: { enabled: false, timezone: 'Europe/Paris', days: jours } } } });


/* ── L'heure de retour annoncée par le bandeau ───────────── */

// Fonctions pures : on choisit l'instant plutôt que d'attendre 8 h du matin.
// Le fuseau des cas est UTC, pour que l'heure locale de la boutique soit
// lisible dans la date elle-même ; un cas en heure de Paris vient ensuite,
// posé sur une date d'hiver pour qu'aucun changement d'heure ne s'en mêle.
const jourDe = (date, tz) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: tz, weekday: 'short' })
    .format(date).replace('.', '').toLowerCase().slice(0, 3);

const horaires = (from, to) =>
  Object.fromEntries(DAYS.map((d) => [d, { closed: false, from, to }]));

const boutique = (days, tz = 'UTC') => ({ open: true, hours: { enabled: true, timezone: tz, days } });

const matin = new Date('2026-03-10T08:00:00Z');
const apresMidi = new Date('2026-03-10T15:00:00Z');

check("Fermée le matin, le retour est l'heure d'ouverture",
  nextOpeningLabel(boutique(horaires('13:00', '00:00')), matin) === '13h',
  String(nextOpeningLabel(boutique(horaires('13:00', '00:00')), matin)));

check('Une demie se dit en toutes lettres',
  nextOpeningLabel(boutique(horaires('13:30', '00:00')), matin) === '13h30',
  String(nextOpeningLabel(boutique(horaires('13:30', '00:00')), matin)));

check('Ouverte, il n\'y a pas de retour à annoncer',
  nextOpeningLabel(boutique(horaires('13:00', '00:00')), apresMidi) === null);

check('Fermée à la main, le retour est inconnu',
  nextOpeningLabel({ ...boutique(horaires('13:00', '00:00')), open: false }, matin) === null);

check('Sans horaires, rien à annoncer non plus',
  nextOpeningLabel({ open: true, hours: { enabled: false, timezone: 'UTC', days: horaires('13:00', '00:00') } }, matin) === null);

// Le retour peut tomber un autre jour : seul le lendemain est ouvert, et
// seulement de 10 h à 12 h. C'est le chemin qui traverse la boucle des sept
// jours, celui qu'un calcul fait sur la seule journée en cours raterait.
const demain = DAYS[(DAYS.indexOf(jourDe(matin, 'UTC')) + 1) % 7];
const seulDemain = Object.fromEntries(
  DAYS.map((d) => [d, d === demain ? { closed: false, from: '10:00', to: '12:00' } : { closed: true, from: '10:00', to: '12:00' }])
);
check('Le retour peut tomber le lendemain',
  nextOpeningLabel(boutique(seulDemain), matin) === '10h',
  String(nextOpeningLabel(boutique(seulDemain), matin)));

// Et l'heure est celle de la boutique, pas celle du serveur : à 8 h UTC un
// 10 janvier, Paris est à 9 h. Une boutique parisienne qui ouvre à 13 h
// annonce 13 h — si le fuseau était ignoré, elle annoncerait 12 h.
const janvier = new Date('2026-01-10T08:00:00Z');
check("L'heure annoncée est celle du fuseau de la boutique",
  nextOpeningLabel(boutique(horaires('13:00', '00:00'), 'Europe/Paris'), janvier) === '13h',
  String(nextOpeningLabel(boutique(horaires('13:00', '00:00'), 'Europe/Paris'), janvier)));

console.log(`\n${failures ? `${failures} test(s) en échec` : 'Ouverture : OK'}`);
process.exit(failures ? 1 : 0);
