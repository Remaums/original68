/**
 * Qui la boutique prévient, et qui les clients écrivent — réglables.
 *
 * Les deux vivaient dans le `.env` : les changer demandait un terminal sur le
 * VPS et un redémarrage, pour des valeurs qui bougent quand on change de
 * compte ou qu'on prend un associé.
 *
 * Ce que cette suite protège surtout, c'est le REPLI. Une boutique déjà en
 * service a son `.env` et n'a rien mis dans le panneau : le jour de la mise à
 * jour, ses commandes doivent continuer d'arriver au même endroit. Un champ
 * vide ne doit donc jamais vouloir dire « personne » — il veut dire « comme
 * avant ». Se tromper là-dessus, c'est une boutique qui ne reçoit plus ses
 * commandes sans que rien ne le dise.
 *
 * La suite rend les réglages tels qu'elle les a trouvés.
 *
 * Prérequis : serveur démarré avec ADMIN_IDS contenant 424242.
 * Usage :  BOT_TOKEN=… node test/contact.test.mjs
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

const reglages = async () =>
  (await fetch(`${BASE}/api/admin/settings`, { headers: h(ADMIN) })).json();
const poser = (contact, initData = ADMIN) =>
  fetch(`${BASE}/api/admin/settings`, {
    method: 'PUT', headers: h(initData), body: JSON.stringify({ contact }),
  });
const vitrine = async () => (await (await fetch(`${BASE}/api/catalog`)).json()).shop;

// Le repli se lisait dans la vitrine, du temps où /api/catalog publiait le
// compte du vendeur. Il ne le publie plus — une route sans signature n'a pas
// à le donner — alors on interroge directement le module qui porte ce repli.
const { retenirLeContact, vendeurJoignable, adminAPrevenir } =
  await import('../server/contact.js');
const { config } = await import('../server/config.js');

const depart = (await reglages()).contact ?? {};

try {
  console.log('\n── Le repli sur le .env ────────────────────────────');

  // C'est la ligne qui compte le plus de la suite : champ vide = comme avant.
  await poser({ adminChatId: '', sellerUsername: '' });
  retenirLeContact({ adminChatId: '', sellerUsername: '' });
  check('Sans réglage, la boutique garde le compte du .env',
    vendeurJoignable() === config.sellerUsername && Boolean(vendeurJoignable()),
    vendeurJoignable() || '(vide)');
  check("Et l'admin prévenu reste celui du .env",
    adminAPrevenir() === config.adminChatId, String(adminAPrevenir()));
  const sante = await (await fetch(`${BASE}/api/health`)).json();
  check("Et la santé dit qu'un compte vendeur est là",
    sante.config?.sellerUsername === true, JSON.stringify(sante.config?.sellerUsername));

  console.log('\n── Le panneau prend la main ────────────────────────');

  let r = await poser({ sellerUsername: '@boutique_essai' });
  check('Un @pseudo est accepté', r.status === 200, `HTTP ${r.status}`);
  check("Et c'est le pseudo qui est gardé, pas le @",
    (await r.json()).contact?.sellerUsername === 'boutique_essai');
  retenirLeContact({ sellerUsername: 'boutique_essai' });
  check('La boutique joint le nouveau compte',
    vendeurJoignable() === 'boutique_essai', vendeurJoignable());

  r = await poser({ sellerUsername: 'https://t.me/autre_compte' });
  check('Un lien t.me est accepté aussi',
    (await r.json()).contact?.sellerUsername === 'autre_compte');

  r = await poser({ adminChatId: '987654321' });
  check('Un identifiant de conversation est accepté', r.status === 200, `HTTP ${r.status}`);
  check('Et il est gardé', (await r.json()).contact?.adminChatId === '987654321');

  // Un groupe : c'est le cas qu'on veut permettre, deux vendeurs qui voient
  // les mêmes commandes. Refuser le signe serait n'accepter que les comptes.
  r = await poser({ adminChatId: '-1001234567890' });
  check('Un groupe (identifiant négatif) est accepté',
    (await r.json()).contact?.adminChatId === '-1001234567890');

  console.log('\n── Ce qu on refuse ─────────────────────────────────');

  for (const [quoi, contact] of [
    ['un pseudo trop court', { sellerUsername: 'abc' }],
    ['un pseudo qui commence par un chiffre', { sellerUsername: '1boutique' }],
    ['un pseudo avec un tiret', { sellerUsername: 'ma-boutique' }],
    ['une conversation qui n est pas un nombre', { adminChatId: 'chez-moi' }],
    ['un nombre avec un espace', { adminChatId: '123 456' }],
  ]) {
    r = await poser(contact);
    check(`Refusé : ${quoi}`, r.status === 400, `HTTP ${r.status}`);
  }

  // Un refus ne doit pas écrire à moitié : les valeurs d'avant tiennent.
  const apresRefus = (await reglages()).contact ?? {};
  check("Aucun refus n a changé les réglages",
    apresRefus.adminChatId === '-1001234567890' && apresRefus.sellerUsername === 'autre_compte',
    JSON.stringify(apresRefus));

  r = await poser({ adminChatId: '5' }, signInitData(TOKEN, { id: 778899, first_name: 'Curieux' }));
  check('Un client ne règle rien', r.status === 403, `HTTP ${r.status}`);

  console.log('\n── Un champ ne touche pas les autres ───────────────');

  // Le panneau enregistre parfois le seul réglage qu'on vient de toucher :
  // un patch partiel ne doit pas effacer les deux autres champs.
  await poser({ adminChatId: '111', sellerUsername: 'compte_a' });
  await poser({ adminChatId: '222' });
  const apres = (await reglages()).contact ?? {};
  check('Changer l admin garde le reste',
    apres.adminChatId === '222' && apres.sellerUsername === 'compte_a',
    JSON.stringify(apres));

  console.log('\n── Le retour en arrière ────────────────────────────');

  await poser({ adminChatId: '', sellerUsername: '' });
  const rendu = (await reglages()).contact ?? {};
  check('Vider les champs est accepté',
    rendu.adminChatId === '' && rendu.sellerUsername === '', JSON.stringify(rendu));
  retenirLeContact({ adminChatId: '', sellerUsername: '' });
  check('Et la boutique retombe sur le .env',
    vendeurJoignable() === config.sellerUsername && Boolean(vendeurJoignable()),
    vendeurJoignable() || '(vide)');

  console.log('\n── Ce que la vitrine ne dit pas ────────────────────');

  // Le compte du vendeur a vécu dans /api/catalog, pour un bouton qui ouvrait
  // sa conversation. Le bouton est parti ; le compte ne doit pas rester.
  retenirLeContact({ sellerUsername: 'compte_temoin' });
  const dehors = await vitrine();
  check("La vitrine publique ne donne pas le compte du vendeur",
    !('sellerUsername' in dehors), JSON.stringify(dehors));
  const brut = await (await fetch(`${BASE}/api/catalog`)).text();
  check('Et son pseudo ne se trouve nulle part dans la réponse',
    !brut.includes(config.sellerUsername), config.sellerUsername);
} finally {
  await poser({
    adminChatId: depart.adminChatId ?? '',
    sellerUsername: depart.sellerUsername ?? '',
  });
  const remis = (await reglages()).contact ?? {};
  const identique = JSON.stringify({ ...depart }) === JSON.stringify({ ...remis });
  console.log(`\n${identique ? 'OK   ' : 'ÉCHEC'}  Les réglages sont rendus tels qu on les a trouvés`);
  if (!identique) failures++;
}

console.log(`\nContact réglable : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
