/**
 * La langue du client : devinée, choisie, et partagée.
 *
 * Le bot ne parlait que français. Le vendeur a demandé que le message
 * d'accueil reprenne aussi le choix de la langue du cadre de la boutique.
 *
 * Ce que cette suite protège :
 *
 * - **un caractère réservé laissé nu dans UNE traduction** fait refuser le
 *   message entier par Telegram. `/start` ne répond alors plus rien à ce
 *   client-là, journal muet, et seuls les italiens s'en plaignent. Les huit
 *   langues sont donc rendues et relues, pas seulement le français ;
 * - **la langue est partagée** entre le bot et la boutique. Deux magasins
 *   séparés, et le client choisit l'italien dans la boutique pour recevoir
 *   ses messages en français — il recommence, ça ne tient pas, il conclut
 *   que le réglage est cassé ;
 * - **un choix l'emporte sur la langue du téléphone**, sinon il ne sert à
 *   rien : le seul client qui touche ce bouton est celui dont le téléphone
 *   n'est pas dans la bonne langue.
 *
 * Aucun réseau : l'API sortante du bot est interceptée.
 *
 * Usage :  BOT_TOKEN=… node test/langue.test.mjs
 */
import 'dotenv/config';

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('BOT_TOKEN manquant : renseigne .env avant de lancer les tests.');
  process.exit(1);
}

const { bot } = await import('../server/bot.js');
const { ouvrirLaPorte } = await import('../server/bot-captcha.js');
const { saveSettings } = await import('../server/settings.js');
const { langueDe, choisirLaLangue, oublierLaLangue, estConnue } = await import('../server/langue.js');
const { LANGUES, TEXTES } = await import('../webapp/js/langues.js');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

// Les deux péages du bot sont éteints : cette suite parle de langue, et un
// calcul posé avant l'accueil lui ferait lire l'épreuve au lieu du message.
await saveSettings({ features: { botCaptcha: false, porteSecours: false } });

let envois = [];
bot.api.config.use(async (prev, method, payload) => {
  envois.push({ method, payload });
  if (method === 'getMe') {
    return { ok: true, result: { id: 1, is_bot: true, first_name: 'B', username: 'testbot' } };
  }
  return { ok: true, result: { message_id: 1, date: 0, chat: { id: 0, type: 'private' } } };
});
bot.botInfo = {
  id: 1, is_bot: true, first_name: 'B', username: 'testbot',
  can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false,
  can_connect_to_business_account: false, has_main_web_app: false,
};
await bot.init();

const CLIENT = 963001;
let compteur = 5000;
const qui = (langue) => ({ id: CLIENT, is_bot: false, first_name: 'Client', language_code: langue });

const start = async (langue) => {
  envois = [];
  await bot.handleUpdate({
    update_id: compteur++,
    message: {
      message_id: compteur, date: Math.floor(Date.now() / 1000),
      chat: { id: CLIENT, type: 'private' }, from: qui(langue), text: '/start',
      entities: [{ type: 'bot_command', offset: 0, length: 6 }],
    },
  });
  return envois.find((e) => e.method === 'sendMessage');
};

const toucher = async (donnee, langue = 'fr') => {
  envois = [];
  await bot.handleUpdate({
    update_id: compteur++,
    callback_query: {
      id: String(compteur), from: qui(langue), chat_instance: '1', data: donnee,
      message: { message_id: 1, date: 0, chat: { id: CLIENT, type: 'private' }, from: qui(langue), text: 'x' },
    },
  });
  return envois;
};

const touches = (m) => (m?.payload?.reply_markup?.inline_keyboard ?? []).flat().map((b) => b.text);

try {
  await ouvrirLaPorte(CLIENT);
  await oublierLaLangue(CLIENT);

  console.log('\n── Ce que dit le téléphone ─────────────────────────');

  let m = await start('fr');
  check("L'accueil part en français", /est là pour/.test(m?.payload?.text ?? ''),
    (m?.payload?.text ?? '').slice(0, 40));

  m = await start('de-DE');
  check('Un téléphone allemand reçoit l allemand', /zeigt dir/.test(m?.payload?.text ?? ''),
    (m?.payload?.text ?? '').slice(0, 40));
  check('Et le bouton de langue est dans sa langue',
    touches(m).some((t) => /Sprache/.test(t)), touches(m).join(' | '));

  m = await start('zz');
  check('Une langue inconnue retombe sur le français', /est là pour/.test(m?.payload?.text ?? ''),
    (m?.payload?.text ?? '').slice(0, 40));

  console.log('\n── Le choix ────────────────────────────────────────');

  let e = await toucher('lang:menu');
  const menu = e.find((x) => x.method === 'editMessageReplyMarkup');
  const drapeaux = (menu?.payload?.reply_markup?.inline_keyboard ?? []).flat();
  check('Le bouton déroule les langues sur place',
    Boolean(menu) && !e.some((x) => x.method === 'sendMessage'),
    `${e.map((x) => x.method).join(',')}`);
  check('Les huit y sont, avec leur drapeau',
    drapeaux.length === LANGUES.length && drapeaux.every((b) => /\p{Regional_Indicator}{2}/u.test(b.text)),
    drapeaux.map((b) => b.text).join(' '));
  check('Deux par rang', (menu?.payload?.reply_markup?.inline_keyboard ?? []).every((r) => r.length <= 2),
    (menu?.payload?.reply_markup?.inline_keyboard ?? []).map((r) => r.length).join(''));

  e = await toucher('lang:nl');
  const edite = e.find((x) => x.method === 'editMessageText');
  check('Le message se réécrit à sa place, sans en ajouter un',
    Boolean(edite) && !e.some((x) => x.method === 'sendMessage'), e.map((x) => x.method).join(','));
  check('Et il est en néerlandais', /laat je/.test(edite?.payload?.text ?? ''),
    (edite?.payload?.text ?? '').slice(0, 40));
  check('Le clavier redevient celui de l accueil',
    touches(edite).some((t) => /Taal/.test(t)), touches(edite).join(' | '));

  check('Le choix est enregistré côté serveur',
    (await langueDe(CLIENT, 'fr')).code === 'nl', JSON.stringify(await langueDe(CLIENT, 'fr')));

  // Le point : sans cela le bouton ne servirait à rien. Le seul client qui
  // le touche est celui dont le téléphone n'est pas dans la bonne langue.
  m = await start('fr');
  check('Et il l emporte sur le téléphone au /start suivant',
    /laat je/.test(m?.payload?.text ?? ''), (m?.payload?.text ?? '').slice(0, 40));

  console.log('\n── Ce qu on refuse ─────────────────────────────────');

  check('Une langue hors catalogue est refusée', (await choisirLaLangue(CLIENT, 'klingon')) === null);
  check('Et elle ne remplace pas le choix en place',
    (await langueDe(CLIENT, 'fr')).code === 'nl');
  check('Un code de deux lettres inventé aussi', estConnue('zz') === false);
  e = await toucher('lang:zz');
  check("Le bouton d'une langue inconnue ne réécrit rien",
    !e.some((x) => x.method === 'editMessageText'), e.map((x) => x.method).join(','));

  console.log('\n── Les huit messages, tels que Telegram les reçoit ─');

  // Un seul caractère réservé laissé nu, dans une seule langue, et Telegram
  // refuse le message ENTIER : /start ne répond plus rien à ces clients-là.
  for (const l of LANGUES) {
    await choisirLaLangue(CLIENT, l.code);
    const msg = await start('fr');
    const texte = msg?.payload?.text ?? '';
    const horsCode = texte.replace(/`[^`]*`/g, '');
    const nus = [...horsCode.matchAll(/(^|[^\\])([_[\]()~>#+\-=|{}.!])/g)].map((x) => x[2]);
    const balises = /<\/?[a-z]+>/i.test(texte);
    check(`${l.code} : message envoyable, sans balise ni caractère nu`,
      Boolean(texte) && nus.length === 0 && !balises,
      nus.length ? `nus: ${[...new Set(nus)].join(' ')}` : balises ? 'balise HTML' : 'propre');
  }

  console.log('\n── Le dictionnaire ─────────────────────────────────');

  const clefs = ['accueil.texte', 'accueil.horaires', 'accueil.service', 'contact.especes',
    'accueil.botApp', 'profil.langue'];
  for (const l of LANGUES) {
    const manque = clefs.filter((c) => !String(TEXTES[l.code]?.[c] ?? '').trim());
    check(`${l.code} : les six clefs de l accueil sont là`, manque.length === 0, manque.join(' '));
  }
} finally {
  await oublierLaLangue(CLIENT);
  await saveSettings({ features: { botCaptcha: true, porteSecours: true } });
}

console.log(`\nLangue : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
