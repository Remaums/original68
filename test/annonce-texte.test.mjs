/**
 * Une annonce part telle que le vendeur l'a écrite.
 *
 * Le bot ajoutait un pied de page : un filet de séparation, la raison pour
 * laquelle on reçoit ce message, et « Écris /stop pour ne plus en recevoir ».
 * Le vendeur écrit ses annonces au mot près — un prix, une heure, une
 * signature — et veut qu'elles arrivent telles quelles.
 *
 * Ce que cette suite fige, et c'est tout son intérêt : **rien** ne doit
 * s'ajouter. Pas une ligne, pas un tiret, pas un caractère. La vérification
 * porte donc sur l'égalité EXACTE du texte envoyé, et non sur l'absence du
 * mot « stop » — une nouvelle mention, un jour, passerait entre les mailles
 * d'un test qui ne cherche qu'un mot.
 *
 * `/stop` marche toujours : c'est sa mention automatique qui s'en va, pas la
 * sortie. La suite le vérifie aussi, sinon on aurait retiré la porte en
 * croyant n'enlever que le panneau.
 *
 * Aucun réseau : l'API sortante du bot est interceptée, et on lit ce qu'il
 * aurait envoyé.
 *
 * Usage :  BOT_TOKEN=… node test/annonce-texte.test.mjs
 */
import 'dotenv/config';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

// `config` lit l'environnement à l'import : on pose une adresse AVANT, sinon
// le bouton de la boutique n'est pas fabriqué et le test de sa présence ne
// prouve rien — c'était le cas de ma première version, qui passait en
// affirmant « aucun clavier ».
process.env.WEBAPP_URL = process.env.WEBAPP_URL || 'https://exemple.test';
const { bot, diffuser } = await import('../server/bot.js');

const envois = [];
bot.api.config.use(async (prev, method, payload) => {
  envois.push({ method, texte: payload?.text ?? '', clavier: payload?.reply_markup ?? null });
  if (method === 'getMe') {
    return { ok: true, result: { id: 1, is_bot: true, first_name: 'B', username: 'testbot' } };
  }
  return { ok: true, result: { message_id: 1, date: 0, chat: { id: 0, type: 'private' } } };
});

console.log('\n── Le texte, et rien que le texte ──────────────────');

// Un texte qui ressemble à ce qu'un vendeur écrit vraiment : plusieurs
// lignes, un tiret, un emoji. Si le bot recolle quoi que ce soit, l'égalité
// exacte le dira.
const TEXTE = 'Arrivage du jour 🌿\n\nPlasma Static — 20 € les 1,2 g\nJusqu\'à minuit.';

await diffuser({ id: 'essai', texte: TEXTE }, [{ id: 111 }, { id: 222 }], { paquet: 10, pause: 0 });

const messages = envois.filter((e) => e.method === 'sendMessage');
check('Le message est parti à chacun', messages.length === 2, String(messages.length));
check('Le texte est EXACTEMENT celui du vendeur',
  messages.every((m) => m.texte === TEXTE),
  JSON.stringify(messages[0]?.texte));
check('Pas un caractère de plus',
  messages.every((m) => m.texte.length === TEXTE.length),
  `${messages[0]?.texte.length} / ${TEXTE.length}`);

// Les trois morceaux de l'ancien pied, nommés un par un : si l'un revient,
// on saura lequel sans relire le diff.
for (const [quoi, motif] of [
  ['le filet de séparation', /— — —/],
  ['la mention de /stop', /\/stop/i],
  ['la phrase « tu reçois ce message »', /tu reçois ce message/i],
]) {
  check(`Plus de ${quoi}`, !messages.some((m) => motif.test(m.texte)), '');
}

console.log('\n── Ce qui reste en place ───────────────────────────');

// Le bouton de la boutique n'est pas du texte : il ne gêne pas l'annonce, et
// il est la raison d'être de l'envoi.
const boutons = messages[0]?.clavier?.inline_keyboard?.flat() ?? [];
check('Le bouton de la boutique est toujours là',
  boutons.length > 0 && boutons.some((b) => b.web_app || b.url),
  JSON.stringify(boutons.map((b) => b.text)));

// La sortie existe toujours, même si plus rien ne l'annonce : on a enlevé le
// panneau, pas la porte.
const { desabonner, estDesabonne, reabonner } = await import('../server/annonces.js');
const cobaye = 4242424242;
await desabonner(cobaye);
check('Se désabonner marche toujours', (await estDesabonne(cobaye)) === true);
await reabonner(cobaye);
check('Et se réabonner aussi', (await estDesabonne(cobaye)) === false);

// La commande elle-même est toujours déclarée dans le bot.
const source = await (await import('node:fs/promises')).readFile(
  new URL('../server/bot.js', import.meta.url), 'utf8'
);
check("La commande /stop existe toujours dans le bot",
  /bot\.command\(\s*'stop'/.test(source));

console.log(`\nTexte des annonces : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
