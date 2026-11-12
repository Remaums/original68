/**
 * Ce que le client reçoit le jour où la porte principale tombe.
 *
 * `secours.test.mjs` éprouve la DÉCISION d'annoncer : trois refus de suite,
 * un hoquet de réseau qui ne compte pas, une seule annonce pour une panne qui
 * dure. Cette suite-ci éprouve l'ENVOI — l'autre moitié, celle qui arrive
 * chez le client.
 *
 * Le défaut qu'elle fige : le message disait « tout se passe désormais ici »
 * et ne donnait rien à toucher. Il demandait au client de retrouver seul un
 * chemin qui venait justement de disparaître. Le bouton EST la nouvelle
 * porte, et il doit partir avec l'annonce.
 *
 * Aucun import statique, et c'est nécessaire : `config.js` lit
 * l'environnement au moment où il est évalué, et les imports d'un module ES
 * sont hissés avant la première ligne. Poser WEBAPP_URL après un `import`
 * arriverait trop tard — la boutique n'aurait pas d'adresse, il n'y aurait
 * pas de bouton à vérifier, et la suite passerait en ne regardant rien.
 *
 * Usage :  node test/bascule.test.mjs
 */
process.env.WEBAPP_URL = process.env.WEBAPP_URL || 'https://exemple.test';
process.env.BOT_TOKEN_SECOURS =
  process.env.BOT_TOKEN_SECOURS || '8000000001:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB';

const { annonceDeBascule } = await import('../server/veille.js');
const { botSecours, prevenirLesInscrits } = await import('../server/bot-secours.js');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

console.log('\n── Le message de bascule, tel qu il part ───────────');

if (!botSecours) {
  check('Le bot de secours est monté', false, 'BOT_TOKEN_SECOURS absent malgré le repli');
} else {
  const partis = [];
  botSecours.api.config.use(async (prev, methode, charge) => {
    partis.push({
      methode, id: charge?.chat_id, texte: charge?.text ?? '',
      clavier: charge?.reply_markup ?? null,
    });
    if (methode === 'getMe') {
      return { ok: true, result: { id: 2, is_bot: true, first_name: 'S', username: 'secours' } };
    }
    return { ok: true, result: { message_id: 1, date: 0, chat: { id: 0, type: 'private' } } };
  });

  const texte = annonceDeBascule('Original68');
  const bilan = await prevenirLesInscrits(texte, { destinataires: [7001, 7002], pause: 0 });
  check('Le message part à chaque inscrit', bilan.envoyes === 2, JSON.stringify(bilan));

  const envois = partis.filter((e) => e.methode === 'sendMessage');
  check('Et à eux seuls', envois.map((e) => e.id).join() === '7001,7002',
    envois.map((e) => e.id).join());
  check('Il nomme la boutique', envois.every((e) => e.texte.includes('Original68')));
  check('Il dit que tout se passe ici maintenant',
    envois.every((e) => /désormais ici/i.test(e.texte)), envois[0]?.texte.split('\n').pop());
  // L'annonce d'une fermeture est ce qui fait fuir : on dit ce qui est vrai
  // et utile, pas ce qui est arrivé au compte.
  check('Il ne parle ni de suppression ni de bannissement',
    envois.every((e) => !/supprim|banni|ferm(é|e)|bloqu/i.test(e.texte)), '');

  const boutons = envois[0]?.clavier?.inline_keyboard?.flat() ?? [];
  check('Il porte le bouton de la boutique',
    boutons.length === 1 && Boolean(boutons[0].web_app),
    JSON.stringify(boutons.map((b) => b.text)));
  check('Et ce bouton ouvre bien la boutique',
    boutons[0]?.web_app?.url === process.env.WEBAPP_URL, boutons[0]?.web_app?.url);
  check('Chaque inscrit reçoit le même bouton',
    envois.every((e) => (e.clavier?.inline_keyboard?.flat() ?? []).length === 1));
}

console.log(`\nMessage de bascule : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
