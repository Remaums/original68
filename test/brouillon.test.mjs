/**
 * Quand la boutique annonce un nouveau produit — et quand elle se tait.
 *
 * Le défaut que cette suite fige : la route de création vérifiait
 * `produit.hidden`, un champ que le catalogue ne produit jamais. `!undefined`
 * valant `true`, TOUT brouillon masqué s'annonçait — la ligne disait
 * exactement l'inverse de ce que faisait le code juste en dessous, et le
 * vendeur voyait partir l'annonce d'un produit qu'il était en train de
 * préparer.
 *
 * Son corollaire, arrivé avec la correction : un brouillon qui ne s'annonce
 * pas à sa création doit s'annoncer à sa PUBLICATION, sinon ces produits-là
 * entrent au catalogue en silence et la seule façon d'être annoncé devient
 * de ne pas se relire.
 *
 * Et une copie ne s'annonce jamais : elle naît masquée.
 *
 * Aucun réseau : l'API sortante du bot est interceptée, et on lit ce qu'il
 * aurait envoyé. La suite monte son propre Express plutôt que d'interroger
 * la boutique de développement — un envoi Telegram ne se voit pas depuis
 * l'extérieur.
 *
 * Usage :  BOT_TOKEN=… node test/brouillon.test.mjs
 */
import 'dotenv/config';
import express from 'express';
import { signInitData } from './helpers.mjs';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

const { bot } = await import('../server/bot.js');
const { adminRouter } = await import('../server/admin.js');
const { saveSettings } = await import('../server/settings.js');
const { deleteProduct } = await import('../server/catalog.js');

await saveSettings({ features: { announcements: true } });

let envois = [];
bot.api.config.use(async (prev, method, payload) => {
  envois.push({ method, texte: payload?.text ?? '' });
  if (method === 'getMe') {
    return { ok: true, result: { id: 1, is_bot: true, first_name: 'B', username: 'testbot' } };
  }
  return { ok: true, result: { message_id: 1, date: 0, chat: { id: 0, type: 'private' } } };
});

const PORT = 3197;
const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);
const serveur = app.listen(PORT);
const BASE = `http://127.0.0.1:${PORT}`;

const ADMIN_ID = Number((process.env.ADMIN_IDS ?? '424242').split(',')[0].trim());
const h = {
  'Content-Type': 'application/json',
  'X-Telegram-Init-Data': signInitData(TOKEN, { id: ADMIN_ID, first_name: 'Patron' }),
};

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const marque = Date.now().toString(36);
const aRanger = [];

/** Joue un appel, laisse partir ce qui part après la réponse, rend les annonces. */
async function annoncesDe(chemin, options) {
  envois = [];
  const r = await fetch(`${BASE}${chemin}`, { headers: h, ...options });
  const corps = await r.json().catch(() => ({}));
  // La proposition part APRÈS la réponse, volontairement : l'écran d'admin
  // ne doit pas attendre Telegram. Il faut donc lui laisser le temps.
  await new Promise((res) => setTimeout(res, 500));
  const dites = envois
    .filter((e) => e.method === 'sendMessage' && /Nouveau produit/.test(e.texte))
    .map((e) => e.texte.slice(0, 60).replace(/\n/g, ' ⏎ '));
  return { statut: r.status, corps, dites };
}

try {
  console.log('\n── Un produit créé visible ─────────────────────────');

  let vu = await annoncesDe('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({ id: `br-vu-${marque}`, name: 'Visible dès le départ', price: 1500, stock: 3 }),
  });
  aRanger.push(vu.corps.id);
  check('Il est créé', vu.statut === 201, `HTTP ${vu.statut} ${vu.corps.error ?? ''}`);
  check('Et il est annoncé', vu.dites.length === 1, vu.dites.join(' | ') || 'aucune annonce');

  console.log('\n── Un brouillon créé masqué ────────────────────────');

  vu = await annoncesDe('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({ id: `br-cache-${marque}`, name: 'Brouillon masqué', price: 1500, stock: 3, visible: false }),
  });
  const brouillon = vu.corps;
  aRanger.push(brouillon.id);
  check('Il est créé', vu.statut === 201, `HTTP ${vu.statut} ${brouillon.error ?? ''}`);
  check('Il est bien masqué', brouillon.visible === false, String(brouillon.visible));
  check("Et il n'annonce RIEN", vu.dites.length === 0, vu.dites.join(' | '));

  console.log('\n── Le brouillon, publié ────────────────────────────');

  vu = await annoncesDe(`/api/admin/products/${brouillon.id}`, {
    method: 'PATCH', body: JSON.stringify({ visible: true }),
  });
  check('Il se publie', vu.statut === 200 && vu.corps.visible === true, `HTTP ${vu.statut}`);
  check("C'est là qu'il s'annonce", vu.dites.length === 1, vu.dites.join(' | ') || 'aucune annonce');
  check('Et le message porte son nom',
    /Brouillon masqué/.test(vu.dites[0] ?? ''), vu.dites[0]);

  console.log('\n── Un enregistrement ordinaire ─────────────────────');

  // Le point : c'est le PASSAGE de masqué à visible qui annonce, pas
  // l'enregistrement. Sans cette distinction, chaque correction de faute de
  // frappe repartait en annonce à toute la clientèle.
  vu = await annoncesDe(`/api/admin/products/${brouillon.id}`, {
    method: 'PATCH', body: JSON.stringify({ short: 'Une correction de rien du tout' }),
  });
  check('Il est enregistré', vu.statut === 200, `HTTP ${vu.statut}`);
  check("Et il ne réannonce pas", vu.dites.length === 0, vu.dites.join(' | '));

  vu = await annoncesDe(`/api/admin/products/${brouillon.id}`, {
    method: 'PATCH', body: JSON.stringify({ visible: true }),
  });
  check('Republier un produit déjà visible n annonce rien non plus',
    vu.dites.length === 0, vu.dites.join(' | '));

  console.log('\n── Une copie ───────────────────────────────────────');

  vu = await annoncesDe(`/api/admin/products/${brouillon.id}/dupliquer`, {
    method: 'POST', body: JSON.stringify({ name: `Copie silencieuse ${marque}` }),
  });
  if (vu.corps.id) aRanger.push(vu.corps.id);
  check('La copie est créée', vu.statut === 201, `HTTP ${vu.statut} ${vu.corps.error ?? ''}`);
  check('Elle naît masquée', vu.corps.visible === false, String(vu.corps.visible));
  check("Et elle n'annonce rien", vu.dites.length === 0, vu.dites.join(' | '));
} finally {
  for (const id of aRanger) if (id) await deleteProduct(id).catch(() => {});
  serveur.close();
}

console.log(`\nBrouillons et annonces : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
