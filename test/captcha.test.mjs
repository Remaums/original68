/**
 * Épreuve d'entrée.
 *
 * Le point sensible n'est pas l'écran : c'est que le serveur exige le
 * laissez-passer au moment de commander. Sans ça, sauter l'écran suffirait.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/captcha.test.mjs
 */
import crypto from 'node:crypto';
import 'dotenv/config';
import { resetShop, franchirLaPorte } from './helpers.mjs';

const TOKEN = process.env.BOT_TOKEN;
const BASE = process.env.TEST_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

function sign(user) {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify(user),
  });
  const dcs = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest();
  params.set('hash', crypto.createHmac('sha256', secret).update(dcs).digest('hex'));
  return params.toString();
}

const admin = sign({ id: 424242, first_name: 'Patron' });

// Le décor de départ, posé par cette suite plutôt que hérité de la
// précédente : sans ça, l'ordre du package.json devient un piège.
await resetShop(BASE, admin, { features: { captcha: true } });
const client = sign({ id: 810001, first_name: 'Client' });
const autre = sign({ id: 810002, first_name: 'Autre' });

// Cette suite teste l'épreuve de tuiles de la Mini App, pas la porte du chat.
// Sans ce passage, c'est la porte qui refuse en premier et on ne teste plus
// rien de ce qu'on croit tester.
await franchirLaPorte(BASE, admin, 810001, 810002);

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

/* ── Préparation ─────────────────────────────────────────── */

await call('/api/admin/settings', { method: 'PUT', body: { captcha: { enabled: true } } });
const catalog = await (await fetch(`${BASE}/api/catalog`)).json();
check('Le catalogue annonce la porte', catalog.gates?.captcha === true);

const product = catalog.products.find((p) => !p.variants && p.stock > 0);
await call(`/api/admin/products/${product.id}/stock`, { method: 'POST', body: { quantity: 100 } });
const panier = [{ id: product.id, quantity: 1 }];

/* ── Sans laissez-passer, pas de commande ────────────────── */

let r = await call('/api/orders', { method: 'POST', init: client, body: { items: panier } });
let data = await r.json().catch(() => ({}));
check('Commande sans épreuve refusée', r.status === 403 && data.error === 'CAPTCHA_REQUIS', `HTTP ${r.status}`);

/* ── L'épreuve, résolue puis rejouée ─────────────────────── */

/** Un glissement, comme un doigt : plusieurs points, et du temps. */
const geste = (jusqua) => {
  const debut = Date.now();
  return Array.from({ length: 8 }, (_, i) => ({
    t: debut + i * 30, x: Math.round((jusqua * (i + 1)) / 8),
  }));
};

const challenge = await (await call('/api/captcha', { init: client })).json();
check('Une image du film est servie',
  /^\/assets\/captcha\/charge-\d+\.jpg$/.test(challenge.image ?? ''), challenge.image);
check('Avec la taille du plateau et de la pièce',
  challenge.largeur > 0 && challenge.hauteur > 0 && challenge.piece > 0,
  `${challenge.largeur}×${challenge.hauteur}, pièce ${challenge.piece}`);
check('Le trou tient entièrement dans le cadre',
  challenge.x >= 0 && challenge.x + challenge.piece <= challenge.largeur &&
  challenge.y >= 0 && challenge.y + challenge.piece <= challenge.hauteur,
  `x=${challenge.x} y=${challenge.y}`);
// La pièce part du bord gauche : si le trou y était aussi, l'épreuve serait
// déjà résolue sans bouger.
check("Le trou n'est pas au point de départ", challenge.x > challenge.piece,
  `x=${challenge.x}, pièce ${challenge.piece}`);

// `...challenge` porte DÉJÀ `x` — le serveur l'envoie pour qu'on dessine le
// trou. Pour éprouver l'absence de réponse, il faut donc le retirer : ma
// première version se contentait de l'étaler et croyait tester le vide.
const { x: _sansX, ...sansPosition } = challenge;
r = await call('/api/captcha', {
  method: 'POST', init: client, body: { ...sansPosition, trace: geste(challenge.x) },
});
check('Sans position, refusé', r.status === 400, `HTTP ${r.status}`);

r = await call('/api/captcha', {
  method: 'POST', init: client, body: { ...challenge, x: challenge.x, trace: [] },
});
check('Sans geste, refusé', r.status === 400, `HTTP ${r.status}`);

r = await call('/api/captcha', {
  method: 'POST', init: client,
  body: { ...challenge, x: challenge.x + 40, trace: geste(challenge.x + 40) },
});
check('À côté du trou, refusé', r.status === 400, `HTTP ${r.status}`);

// Le jeton lie l'épreuve à CE client : le bricoler doit être sans effet.
r = await call('/api/captcha', {
  method: 'POST', init: client,
  body: { ...challenge, token: '0'.repeat(64), x: challenge.x, trace: geste(challenge.x) },
});
check('Un jeton bricolé, refusé', r.status === 400, `HTTP ${r.status}`);

r = await call('/api/captcha', {
  method: 'POST', init: client, body: { ...challenge, x: challenge.x, trace: geste(challenge.x) },
});
const { pass } = await r.json();
check('La pièce au bon endroit, accepté', r.status === 200 && typeof pass === 'string');

// Ce que le serveur juge, c'est SA cible, pas celle que le client annonce :
// annoncer un trou ailleurs ne déplace pas la réponse.
const menteur = await (await call('/api/captcha', { init: client })).json();
r = await call('/api/captcha', {
  method: 'POST', init: client,
  body: { ...menteur, x: menteur.x + 60, trace: geste(menteur.x + 60) },
});
check("Annoncer un autre trou ne change pas la cible", r.status === 400, `HTTP ${r.status}`);

/* ── Le laissez-passer est nominatif ─────────────────────── */

r = await call('/api/orders', { method: 'POST', init: autre, body: { items: panier }, pass });
check('Laissez-passer inutilisable par un autre', r.status === 403, `HTTP ${r.status}`);

r = await call('/api/orders', { method: 'POST', init: client, body: { items: panier }, pass });
check('Commande acceptée avec le laissez-passer', r.status === 201, `HTTP ${r.status}`);

r = await call('/api/orders', { method: 'POST', init: client, body: { items: panier }, pass: '9999999999999.deadbeef' });
check('Laissez-passer forgé refusé', r.status === 403, `HTTP ${r.status}`);

/* ── Désactivée, la porte s'efface ───────────────────────── */

await call('/api/admin/settings', { method: 'PUT', body: { captcha: { enabled: false } } });
r = await call('/api/orders', { method: 'POST', init: autre, body: { items: panier } });
check('Épreuve désactivée : la commande passe', r.status === 201, `HTTP ${r.status}`);

await call('/api/admin/settings', { method: 'PUT', body: { captcha: { enabled: true } } });

console.log(`\n${failures ? `${failures} test(s) en échec` : "Épreuve d'entrée : OK"}`);
process.exit(failures ? 1 : 0);
