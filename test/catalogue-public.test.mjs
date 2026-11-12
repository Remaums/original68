/**
 * Ce que le catalogue public dit, et surtout ce qu'il ne dit pas.
 *
 * `/api/catalog` se lit **sans la moindre signature** : tout ce qu'on y pose
 * est publié. Cette suite est la liste blanche de cette réponse — l'équivalent
 * de celle qui garde `/api/porte`.
 *
 * Elle a déjà servi : en rendant l'admin à prévenir réglable, le bloc de
 * contact entier s'est retrouvé dans cette réponse, identifiant de
 * conversation du vendeur compris. C'est une assertion qui l'a arrêté, pas
 * une relecture.
 *
 * Elle remplace `snapchat.test.mjs`, qui éprouvait un réglage de canal
 * n'existant plus : le bouton « Commander » ouvre toujours le même panneau,
 * et la boutique n'a plus rien à savoir du compte du vendeur.
 *
 * Usage :  BOT_TOKEN=… node test/catalogue-public.test.mjs
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
const h = { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': ADMIN };

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const reglages = async () =>
  (await fetch(`${BASE}/api/admin/settings`, { headers: h })).json();
const depart = (await reglages()).contact ?? {};

try {
  // On pose des valeurs reconnaissables : si l'une d'elles ressort dans la
  // réponse publique, on la verra du premier coup d'œil.
  await fetch(`${BASE}/api/admin/settings`, {
    method: 'PUT', headers: h,
    body: JSON.stringify({ contact: { adminChatId: '918273645', sellerUsername: 'compte_temoin' } }),
  });

  const publique = await (await fetch(`${BASE}/api/catalog`)).json();
  const brut = JSON.stringify(publique);

  console.log('\n── Ce qui ne doit pas en sortir ────────────────────');

  check('Aucun jeton de bot', !brut.includes(TOKEN));
  check("L'identifiant de l'admin à prévenir n'en sort pas",
    !brut.includes('918273645'),
    (brut.match(/918273645/g) ?? []).join(' ') || 'absent');
  check('Le bloc de réglages non plus', publique.contact === undefined,
    JSON.stringify(publique.contact ?? 'absent'));
  check("Ni le nom du champ", !/adminChatId/.test(brut));
  // Une adresse de base de données ou une liste d'admins n'ont rien à faire
  // dans une réponse anonyme non plus.
  check("Aucune adresse de base", !/postgres:\/\/|DATABASE_URL/.test(brut));
  check("Aucune liste d'administrateurs", !/adminIds/.test(brut));
  // Un `file_id` Telegram est une adresse utilisable par quiconque a le
  // jeton du bot : il ne voyage jamais ici.
  check('Aucun identifiant de fichier Telegram',
    !/"fileId"|"thumbFileId"/.test(brut),
    (brut.match(/"(thumb)?[fF]ileId"/g) ?? []).slice(0, 3).join(' ') || 'aucun');

  // Le compte du vendeur a vécu ici, pour le bouton « Écris-nous » de l'écran
  // Contact. Ce bouton n'existe plus, la boutique n'affiche le compte nulle
  // part — et une route sans signature n'a donc plus de raison de le donner.
  check("Le compte du vendeur n'en sort pas",
    publique.shop?.sellerUsername === undefined, JSON.stringify(publique.shop));
  check("Ni son pseudo ailleurs dans la réponse", !brut.includes('compte_temoin'),
    (brut.match(/compte_temoin/g) ?? []).join(' ') || 'absent');
  check("Ni le nom du champ", !/sellerUsername/.test(brut));

  console.log('\n── Ce qui en sort, et doit en sortir ───────────────');

  check("Le nom de la boutique", Boolean(publique.shop?.shopName), publique.shop?.shopName);
  check('Et le catalogue', Array.isArray(publique.products) && publique.products.length > 0,
    `${publique.products?.length} produits`);
} finally {
  await fetch(`${BASE}/api/admin/settings`, {
    method: 'PUT', headers: h,
    body: JSON.stringify({
      contact: {
        adminChatId: depart.adminChatId ?? '',
        sellerUsername: depart.sellerUsername ?? '',
      },
    }),
  });
  // On ne compare que ce qu'on a touché : un réglage écrit par une version
  // antérieure peut traîner dans le fichier sans être dans les défauts, et
  // exiger l'égalité de l'objet entier ferait échouer la restitution pour une
  // clef qu'on n'a jamais écrite.
  const remis = (await reglages()).contact ?? {};
  const identique = ['adminChatId', 'sellerUsername']
    .every((clef) => (remis[clef] ?? '') === (depart[clef] ?? ''));
  console.log(`\n${identique ? 'OK   ' : 'ÉCHEC'}  Les réglages sont rendus tels qu on les a trouvés`);
  if (!identique) failures++;
}

console.log(`\nCatalogue public : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
