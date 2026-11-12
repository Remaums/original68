/**
 * Le parcours d'entrée, vu depuis la conversation.
 *
 * Le vendeur décrit le trajet ainsi : `/start`, un calcul à résoudre, puis
 * « il faut refaire /start pour ouvrir la boutique ». Cette suite vérifie que
 * le second `/start` n'est pas nécessaire — que la boutique s'ouvre d'elle-même
 * dès que le calcul est juste. Le bot ne parle pas à Telegram : l'API sortante
 * est interceptée, et on regarde ce qu'il aurait envoyé.
 *
 * Le scénario tourne dans un processus séparé, comme les autres suites qui
 * pilotent le bot : sa configuration est lue une fois à l'import, et le
 * magasin de la porte garde un état entre les épreuves.
 *
 * Usage :  node test/entree.test.mjs
 */
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const MOI = fileURLToPath(import.meta.url);
const RACINE = path.join(path.dirname(MOI), '..');
const CLIENT = { id: 918273, is_bot: false, first_name: 'Nouveau' };

/* ══ Rôle « ouvrier » : joue le parcours, rend ce qu'il a vu ══ */

if (process.env.ENTREE_SCENARIO) {
  const { bot } = await import('../server/bot.js');
  const { oublier, demanderLEpreuve } = await import('../server/bot-captcha.js');
  const { saveSettings } = await import('../server/settings.js');

  // L'épreuve du chat est le sujet de cette suite : on l'allume, quel que
  // soit l'état dans lequel la suite précédente a laissé la boutique.
  await saveSettings({ features: { botCaptcha: true } });

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

  // On repart d'un inconnu : sans cet oubli, le client garderait la porte
  // ouverte d'un essai précédent et le calcul ne serait jamais posé.
  await oublier(CLIENT.id);

  let compteur = 9000;
  const lu = () => {
    const vu = envois.map((e) => ({
      texte: e.payload?.text ?? '',
      // Le bouton qui ouvre la Mini App : c'est lui, et lui seul, qui
      // signifie « la boutique est ouverte ».
      boutique: (e.payload?.reply_markup?.inline_keyboard?.flat?.() ?? []).some((b) => b?.web_app?.url),
      choix: (e.payload?.reply_markup?.inline_keyboard?.flat?.() ?? [])
        .map((b) => b?.callback_data).filter((d) => /^cap:/.test(d ?? '')),
    }));
    envois = [];
    return vu;
  };

  const ecrire = async (texte) => {
    await bot.handleUpdate({
      update_id: compteur++,
      message: {
        message_id: compteur, date: Math.floor(Date.now() / 1000),
        chat: { id: CLIENT.id, type: 'private' }, from: CLIENT, text: texte,
        ...(texte.startsWith('/')
          ? { entities: [{ type: 'bot_command', offset: 0, length: texte.length }] }
          : {}),
      },
    });
    return lu();
  };

  const toucher = async (donnee) => {
    await bot.handleUpdate({
      update_id: compteur++,
      callback_query: {
        id: String(compteur), from: CLIENT, chat_instance: '1', data: donnee,
        message: {
          message_id: compteur, date: Math.floor(Date.now() / 1000),
          chat: { id: CLIENT.id, type: 'private' }, from: CLIENT, text: 'épreuve',
        },
      },
    });
    return lu();
  };

  const premier = await ecrire('/start');

  /* L'épreuve en cours, lue dans le magasin plutôt que devinée.
     `demanderLEpreuve` rend celle qui attend sans en tirer une nouvelle.

     Elle se relit après CHAQUE essai : une mauvaise réponse en tire une
     autre. Sans cette relecture, le test répondait juste à la question
     d'avant et concluait que le bot refusait les bonnes réponses. */
  const epreuveDuMoment = async () => {
    const porte = await demanderLEpreuve(CLIENT.id);
    const texte = porte.epreuve?.texte ?? '';
    const n = texte.match(/(\d+)\s*([+−-])\s*(\d+)/);
    return {
      texte,
      choix: porte.epreuve?.choix ?? [],
      juste: n ? (n[2] === '+' ? Number(n[1]) + Number(n[3]) : Number(n[1]) - Number(n[3])) : null,
    };
  };

  const un = await epreuveDuMoment();
  const calcul = un.texte;
  const faux = un.choix.find((v) => v !== un.juste);
  const apresFaux = faux === undefined ? [] : await toucher(`cap:${faux}`);

  const deux = await epreuveDuMoment();
  const juste = deux.juste;
  const apresJuste = await toucher(`cap:${juste}`);

  // Et une fois passé, /start doit continuer de rendre la boutique.
  const startApres = await ecrire('/start');

  console.log(JSON.stringify({ premier, calcul, juste, apresFaux, apresJuste, startApres }));
  process.exit(0);
}

/* ══ Rôle « chef » ══════════════════════════════════════════ */

const run = promisify(execFile);

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

// Le bouton qui ouvre la Mini App n'existe que si l'adresse est une URL
// HTTPS valide — c'est la règle de Telegram, et le sujet de `boutons.test`.
// Sans elle, cette suite conclurait que la boutique ne s'ouvre pas alors
// qu'elle mesurerait une configuration vide.
const { stdout } = await run(process.execPath, [MOI], {
  cwd: RACINE,
  env: { ...process.env, ENTREE_SCENARIO: '1', WEBAPP_URL: 'https://boutique.exemple' },
  maxBuffer: 4 * 1024 * 1024,
});
const vu = JSON.parse(stdout.trim().split('\n').pop());

console.log('\n── Le premier /start ───────────────────────────────');

check('Il répond quelque chose', vu.premier.length > 0, `${vu.premier.length} message(s)`);
check('Il pose un calcul', /\d+\s*[+−-]\s*\d+/.test(vu.calcul), vu.calcul);
check('Avec des boutons de réponse',
  vu.premier.some((m) => m.choix.length >= 2), vu.premier.map((m) => m.choix.length).join('/'));
check('Et il n\'ouvre PAS la boutique', !vu.premier.some((m) => m.boutique));

console.log('\n── Une mauvaise réponse ────────────────────────────');

check('Elle est refusée', vu.apresFaux.some((m) => /pas ça|Trop d'essais/i.test(m.texte)),
  vu.apresFaux.map((m) => m.texte.slice(0, 34)).join(' | '));
check('Et la boutique reste fermée', !vu.apresFaux.some((m) => m.boutique));

console.log('\n── La bonne réponse ────────────────────────────────');

// Le point de la suite : pas de second /start à taper.
check('Elle est acceptée', vu.apresJuste.some((m) => /Merci/i.test(m.texte)),
  vu.apresJuste.map((m) => m.texte.slice(0, 34)).join(' | '));
check('La boutique s\'ouvre dans la foulée, sans second /start',
  vu.apresJuste.some((m) => m.boutique),
  vu.apresJuste.map((m) => `${m.texte.slice(0, 22)}…${m.boutique ? ' +boutique' : ''}`).join(' | '));
check('Et le bouton arrive avec le message d\'accueil',
  vu.apresJuste.some((m) => m.boutique && m.texte.length > 20));

console.log('\n── Et ensuite ──────────────────────────────────────');

check('/start rend toujours la boutique', vu.startApres.some((m) => m.boutique));
check('Sans reposer de calcul', !vu.startApres.some((m) => m.choix.length));

console.log(`\n${failures ? `${failures} test(s) en échec` : 'Entrée : OK'}`);
process.exit(failures ? 1 : 0);
