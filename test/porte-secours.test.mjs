/**
 * L'ordre d'entrée : le bot de secours, puis le calcul, puis la boutique.
 *
 * Le vendeur l'a demandé dans cet ordre-là, et l'ordre est le sujet. Un
 * premier visiteur doit écrire au second bot AVANT de résoudre l'addition,
 * parce que c'est la seule fenêtre où on peut encore le lui demander :
 * Telegram interdit à un bot d'écrire le premier à qui ne lui a jamais
 * écrit, et le jour de la panne il sera trop tard.
 *
 * Ce que cette suite protège en particulier : un « c'est fait » cru sur
 * parole. Le bouton ne doit rien ouvrir tant que le registre ne dit pas
 * que le client est passé là-bas — sinon le péage ne coûte qu'un appui et
 * ne couvre personne.
 *
 * Le bot ne parle pas à Telegram : l'API sortante est interceptée, et on
 * regarde ce qu'il aurait envoyé. Le scénario tourne dans un processus
 * séparé, comme les autres suites qui pilotent le bot : la configuration
 * est lue une fois à l'import, et il en faut une avec un second jeton.
 *
 * Usage :  node test/porte-secours.test.mjs
 */
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const MOI = fileURLToPath(import.meta.url);
const RACINE = path.join(path.dirname(MOI), '..');
const CLIENT = { id: 918274, is_bot: false, first_name: 'Visiteur' };
// Un patron sans commande à son nom, et déclaré pour ce seul processus.
// Avec l'administrateur du .env, l'épreuve ne prouvait rien : il a des
// commandes dans les données de développement, et c'est cette exemption-là
// qui le faisait passer — retirer le contrôle d'admin ne cassait rien.
const PATRON = { id: 777042, is_bot: false, first_name: 'Patron' };
const SECOURS_NOM = 'boutique_secours_bot';

/* ══ Rôle « ouvrier » : joue le parcours, rend ce qu'il a vu ══ */

if (process.env.PORTE_SECOURS_SCENARIO) {
  const { bot } = await import('../server/bot.js');
  const { oublier: oublierLeCalcul } = await import('../server/bot-captcha.js');
  const { inscrire, oublier: oublierLeSecours } = await import('../server/secours.js');
  const { saveSettings } = await import('../server/settings.js');

  await saveSettings({ features: { botCaptcha: true, porteSecours: true } });

  let envois = [];
  bot.api.config.use(async (prev, method, payload) => {
    envois.push({ method, payload });
    if (method === 'getMe') {
      return { ok: true, result: { id: 1, is_bot: true, first_name: 'Bot', username: 'testbot' } };
    }
    return {
      ok: true,
      result: { message_id: 1, date: 0, chat: { id: payload?.chat_id ?? 0, type: 'private' } },
    };
  });
  bot.botInfo = {
    id: 1, is_bot: true, first_name: 'Bot', username: 'testbot',
    can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false,
    can_connect_to_business_account: false, has_main_web_app: false,
  };
  await bot.init();

  // On repart d'un inconnu des deux côtés : les deux magasins gardent un
  // état entre les exécutions, et un client resté inscrit d'un essai
  // précédent ne verrait jamais le péage qu'on vient éprouver.
  await oublierLeCalcul(CLIENT.id);
  await oublierLeSecours(CLIENT.id);

  let compteur = 9000;
  const boutons = (e) => e.payload?.reply_markup?.inline_keyboard?.flat?.() ?? [];
  const lu = () => {
    const vu = envois.map((e) => ({
      texte: e.payload?.text ?? '',
      boutique: boutons(e).some((b) => b?.web_app?.url),
      liens: boutons(e).map((b) => b?.url).filter(Boolean),
      touches: boutons(e).map((b) => b?.callback_data).filter(Boolean),
      alerte: e.method === 'answerCallbackQuery' ? (e.payload?.text ?? '') : null,
    }));
    envois = [];
    return vu;
  };

  const ecrire = async (texte, qui = CLIENT) => {
    await bot.handleUpdate({
      update_id: compteur++,
      message: {
        message_id: compteur, date: Math.floor(Date.now() / 1000),
        chat: { id: qui.id, type: 'private' }, from: qui, text: texte,
        ...(texte.startsWith('/')
          ? { entities: [{ type: 'bot_command', offset: 0, length: texte.length }] }
          : {}),
      },
    });
    return lu();
  };

  const toucher = async (donnee, qui = CLIENT) => {
    await bot.handleUpdate({
      update_id: compteur++,
      callback_query: {
        id: String(compteur), from: qui, chat_instance: '1', data: donnee,
        message: {
          message_id: compteur, date: Math.floor(Date.now() / 1000),
          chat: { id: qui.id, type: 'private' }, from: qui, text: 'péage',
        },
      },
    });
    return lu();
  };

  const premier = await ecrire('/start');
  const menteur = await toucher('sec:fait');
  // La commande de secours elle-même ne doit pas être prise au péage.
  const demandeDuLien = await ecrire('/secours');
  // Le vendeur n'a pas à s'enregistrer auprès de sa propre boutique.
  const patron = await ecrire('/start', PATRON);

  // Le vendeur touche « j'ai écrit » sans l'avoir fait : le péage ne l'attrape
  // pas (il n'est pas retenu), donc l'appui va jusqu'au gestionnaire de fin.
  // Sans lui, rien ne se passait — et un bouton qui tourne dans le vide passe
  // pour cassé, on le touche trois fois.
  const patronMenteur = await toucher('sec:fait', PATRON);
  await inscrire(PATRON.id);
  const patronVrai = await toucher('sec:fait', PATRON);

  // Le client va écrire au second bot : c'est ce que son premier middleware
  // aurait fait. Même processus, même magasin.
  await inscrire(CLIENT.id);
  const apresInscription = await toucher('sec:fait');

  const { demanderLEpreuve } = await import('../server/bot-captcha.js');
  const porte = await demanderLEpreuve(CLIENT.id);
  const n = (porte.epreuve?.texte ?? '').match(/(\d+)\s*([+−-])\s*(\d+)/);
  const juste = n ? (n[2] === '+' ? Number(n[1]) + Number(n[3]) : Number(n[1]) - Number(n[3])) : null;
  const apresCalcul = await toucher(`cap:${juste}`);

  // Interrupteur éteint : plus de péage du tout, même pour un inconnu.
  await oublierLeCalcul(CLIENT.id);
  await oublierLeSecours(CLIENT.id);
  await saveSettings({ features: { porteSecours: false } });
  const eteint = await ecrire('/start');
  await saveSettings({ features: { porteSecours: true } });
  await oublierLeSecours(CLIENT.id);

  await oublierLeSecours(PATRON.id);
  console.log(JSON.stringify({
    premier, menteur, demandeDuLien, patron, patronMenteur, patronVrai,
    apresInscription, apresCalcul, eteint,
  }));
  process.exit(0);
}

/* ══ Rôle « chef » ══════════════════════════════════════════ */

const run = promisify(execFile);
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const { stdout } = await run(process.execPath, [MOI], {
  cwd: RACINE,
  env: {
    ...process.env,
    PORTE_SECOURS_SCENARIO: '1',
    WEBAPP_URL: 'https://boutique.exemple',
    BOT_TOKEN_SECOURS: '9000000001:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    BOT_USERNAME_SECOURS: SECOURS_NOM,
    ADMIN_IDS: String(PATRON.id),
    ADMIN_CHAT_ID: String(PATRON.id),
  },
  maxBuffer: 4 * 1024 * 1024,
});
const vu = JSON.parse(stdout.trim().split('\n').pop());

const calcul = (m) => m.touches.some((d) => /^cap:/.test(d));
// Un seul endroit qui décide « ce message parle du péage » : deux regex
// écrites séparément, c'est celle du cas négatif qui finit par ne rien
// reconnaître et par déclarer le péage éteint alors qu'il tient toujours.
const parleDuSecours = (m) => /second bot|bot de secours/i.test(m.texte);
// L'accueil se reconnaît à sa marque, pas à un mot de sa phrase : « 🌿 * »
// n'est envoyé que par lui dans tout le bot, et il survit à une réécriture
// du texte — celle que le vendeur vient justement de demander.
const accueilli = (m) => /🌿 \*/.test(m.texte);

console.log('\n── Le premier /start ───────────────────────────────');

check('Le bot répond', vu.premier.length > 0, `${vu.premier.length} message(s)`);
check('Il demande le bot de secours AVANT tout',
  vu.premier.some((m) => parleDuSecours(m) && /\/start/.test(m.texte)),
  vu.premier.map((m) => m.texte.slice(0, 40)).join(' | '));
check('Il donne le lien, avec le paramètre qui ramène ici',
  vu.premier.some((m) => m.liens.some((l) => l === `https://t.me/${SECOURS_NOM}?start=entree`)),
  vu.premier.flatMap((m) => m.liens).join(' '));
check('Et un bouton pour revenir dire que c est fait',
  vu.premier.some((m) => m.touches.includes('sec:fait')));
check('Le calcul n est PAS encore posé', !vu.premier.some(calcul),
  vu.premier.flatMap((m) => m.touches).join(' '));
check('Et la boutique n est PAS ouverte', !vu.premier.some((m) => m.boutique));

console.log('\n── « C\'est fait », sans que ce le soit ─────────────');

check('Le bouton n est pas cru sur parole',
  vu.menteur.some((m) => /pas encore vu/i.test(m.texte) || /pas encore vu/i.test(m.alerte ?? '')),
  vu.menteur.map((m) => (m.alerte ?? m.texte).slice(0, 34)).join(' | '));
check('Le calcul reste fermé', !vu.menteur.some(calcul));
check('Et la boutique aussi', !vu.menteur.some((m) => m.boutique));

console.log('\n── Ce que le péage laisse passer ───────────────────');

check('/secours répond, même non inscrit',
  vu.demandeDuLien.some((m) => new RegExp(SECOURS_NOM).test(m.texte)),
  vu.demandeDuLien.map((m) => m.texte.slice(0, 40)).join(' | '));
// Le vendeur ne doit jamais pouvoir se fermer sa propre boutique : il entre.
// Mais il n'est pas inscrit pour autant, donc injoignable le jour de la
// panne — on lui propose donc le geste, dans un message À PART. C'est le
// défaut que le vendeur a signalé : le lien était noyé dans l'accueil, sans
// bouton, et ne se touchait jamais.
check('Le vendeur entre sans être retenu', vu.patron.some((m) => m.boutique),
  vu.patron.map((m) => m.texte.slice(0, 30)).join(' | '));
check("L'accueil ne parle plus du bot de secours",
  !parleDuSecours(vu.patron.find(accueilli) ?? { texte: '' }),
  (vu.patron.find(accueilli)?.texte ?? '').slice(0, 70));
check('La proposition est un message séparé, après',
  vu.patron.findIndex(parleDuSecours) > vu.patron.findIndex(accueilli),
  vu.patron.map((m) => m.texte.slice(0, 22)).join(' | '));
check('Et elle porte les boutons, pas un lien nu',
  vu.patron.some((m) => parleDuSecours(m) && m.touches.includes('sec:fait') && m.liens.length > 0),
  vu.patron.flatMap((m) => m.touches).join(' '));

console.log('\n── Le bouton hors du péage ─────────────────────────');

check('Il répond, au lieu de tourner dans le vide', vu.patronMenteur.length > 0,
  `${vu.patronMenteur.length} message(s)`);
check('Et il ne croit pas sur parole',
  vu.patronMenteur.some((m) => /pas encore vu/i.test(m.texte) || /pas encore vu/i.test(m.alerte ?? '')),
  vu.patronMenteur.map((m) => (m.alerte ?? m.texte).slice(0, 30)).join(' | '));
check('Une fois le geste fait, il le confirme',
  vu.patronVrai.some((m) => /je t'ai vu|joignable/i.test(m.texte)),
  vu.patronVrai.map((m) => m.texte.slice(0, 40)).join(' | '));

console.log('\n── Une fois écrit au bot de secours ────────────────');

check('Le calcul arrive alors, et pas avant', vu.apresInscription.some(calcul),
  vu.apresInscription.flatMap((m) => m.touches).join(' '));
check('La boutique n est toujours pas ouverte', !vu.apresInscription.some((m) => m.boutique));

console.log('\n── Puis le calcul juste ────────────────────────────');

check('Il est accepté', vu.apresCalcul.some((m) => /Merci/i.test(m.texte)),
  vu.apresCalcul.map((m) => m.texte.slice(0, 34)).join(' | '));
check('Et la boutique s ouvre enfin', vu.apresCalcul.some((m) => m.boutique));
// L'ordre demandé par le vendeur : bot de secours, calcul, PUIS bienvenue.
// L'accueil est le dernier message du parcours, pas le premier.
check("L'accueil n arrive qu ici, à la fin",
  vu.apresCalcul.some(accueilli) &&
    !vu.premier.some(accueilli) &&
    !vu.apresInscription.some(accueilli),
  vu.apresCalcul.map((m) => m.texte.slice(0, 26)).join(' | '));
check("Et il ne redemande pas le bot de secours, déjà fait",
  !vu.apresCalcul.some(parleDuSecours),
  vu.apresCalcul.map((m) => m.texte.slice(0, 26)).join(' | '));

console.log('\n── L interrupteur éteint ───────────────────────────');

check('Plus de péage du secours', !vu.eteint.some(parleDuSecours),
  vu.eteint.map((m) => m.texte.slice(0, 34)).join(' | '));
check('Mais le calcul, lui, reste posé', vu.eteint.some(calcul),
  vu.eteint.flatMap((m) => m.touches).join(' '));

console.log(`\nPorte de secours : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
