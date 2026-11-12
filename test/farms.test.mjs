/**
 * Les farms : les producteurs, avec leur logo.
 *
 * Ce que la suite protège :
 *
 * - **une farm se range proprement** : nom obligatoire, doublons fondus,
 *   liste vide acceptée (une boutique peut s'en passer) ;
 * - **une farm qui garde son identifiant garde son logo** : l'admin n'a
 *   pas à renvoyer ce qu'il n'a pas touché ;
 * - **le logo ne sort jamais en référence Telegram** : le catalogue public
 *   donne l'adresse /api/farm-logo/…, jamais le `file_id` ;
 * - **un produit se rattache à une farm, et s'en détache** ;
 * - **la sauvegarde emporte les farms**, sinon une restauration les perdrait.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/farms.test.mjs
 */
import 'dotenv/config';
import { signInitData } from './helpers.mjs';

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

const admin = { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': signInitData(TOKEN, { id: 424242, first_name: 'Patron' }) };
const api = async (method, chemin, body) => {
  const res = await fetch(`${BASE}/api/admin${chemin}`, { method, headers: admin, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const catalogue = async () => (await fetch(`${BASE}/api/catalog`)).json();

const avant = (await api('GET', '/catalog')).data;
const farmsAvant = avant.farms ?? [];
const cobaye = avant.products[0];

try {
  console.log('\n── Ranger les farms ────────────────────────────────');
  const pose = await api('PUT', '/farms', { farms: [
    { label: 'Farm Témoin' }, { label: 'farm témoin' }, { label: '   ' }, { label: 'Deuxième Farm' },
  ] });
  check('La liste s enregistre', pose.status === 200, `HTTP ${pose.status}`);
  check('Les doublons sont fondus, les noms vides écartés', pose.data.length === 2, JSON.stringify(pose.data.map((f) => f.label)));
  const temoin = pose.data[0];
  check('Une farm reçoit un identifiant lisible', temoin?.id === 'farm-temoin', temoin?.id);
  check('Une liste qui n en est pas une est refusée', (await api('PUT', '/farms', { farms: 'nope' })).status === 400);

  console.log('\n── Le logo ─────────────────────────────────────────');
  // Un logo déposé chez Telegram, posé comme le ferait l'envoi depuis l'admin.
  await api('PUT', '/farms', { farms: [{ id: temoin.id, label: temoin.label, logoFileId: 'AgACAgFARMLOGO' }, { label: 'Deuxième Farm' }] });
  const renomme = await api('PUT', '/farms', { farms: [{ id: temoin.id, label: 'Farm Témoin Renommée' }, { label: 'Deuxième Farm' }] });
  const gardee = (await api('GET', '/catalog')).data.farms.find((f) => f.id === temoin.id);
  check('Renommée, la farm garde son logo', gardee?.logoFileId === 'AgACAgFARMLOGO' && gardee?.label === 'Farm Témoin Renommée',
    `HTTP ${renomme.status} · ${gardee?.label} / ${gardee?.logoFileId}`);
  const brut = JSON.stringify(await catalogue());
  check('Le catalogue public ne donne pas la référence du logo', !brut.includes('AgACAgFARMLOGO') && !brut.includes('logoFileId'));
  check('Le logo d une farm inconnue n existe pas', (await fetch(`${BASE}/api/farm-logo/inconnue`)).status === 404);

  console.log('\n── Un produit et sa farm ───────────────────────────');
  const rattache = await api('PATCH', `/products/${cobaye.id}`, { farm: temoin.id });
  check('Un produit se rattache à une farm', rattache.status === 200 && rattache.data.farm === temoin.id, rattache.data.farm);
  const public1 = (await catalogue()).products.find((p) => p.id === cobaye.id);
  check('Le catalogue public le dit', public1?.farm === temoin.id);
  const detache = await api('PATCH', `/products/${cobaye.id}`, { farm: '' });
  check('Une farm vide l en détache', detache.status === 200 && detache.data.farm === undefined, JSON.stringify(detache.data.farm));

  console.log('\n── La sauvegarde ───────────────────────────────────');
  const sauvegarde = await fetch(`${BASE}/api/admin/backup`, { headers: admin }).then((r) => r.json()).catch(() => null);
  const farmsSauvees = sauvegarde?.catalog?.farms;
  check('La sauvegarde emporte les farms', Array.isArray(farmsSauvees) && farmsSauvees.some((f) => f.id === temoin.id),
    Array.isArray(farmsSauvees) ? `${farmsSauvees.length} farms` : 'absentes');

  console.log('\n── Sans farm ───────────────────────────────────────');
  const vide = await api('PUT', '/farms', { farms: [] });
  check('Une boutique peut se passer de farms', vide.status === 200 && vide.data.length === 0);
} finally {
  await api('PATCH', `/products/${cobaye.id}`, { farm: cobaye.farm ?? '' });
  await api('PUT', '/farms', { farms: farmsAvant });
}

console.log(`\n${failures ? `${failures} test(s) en échec` : 'Farms : OK'}`);
process.exit(failures ? 1 : 0);
