/**
 * Qui entre dans la boutique — la décision, seule.
 *
 * Elle est prise à deux endroits du serveur : la route qui dit à la Mini App
 * quoi afficher, et le garde-fou qui refuse les appels. Les deux passent par
 * `decisionDEntree`, et c'est tout l'intérêt : écrites séparément, les deux
 * copies divergent, et le jour où elles divergent c'est l'écran qui dit
 * « entre » pendant que l'API répond 403.
 *
 * Ce que cette suite protège surtout : l'ORDRE. Le bot de secours d'abord,
 * le calcul ensuite. Inversé, le péage ne servirait à rien — un client qui
 * a déjà résolu le calcul est dans la boutique, et on n'a plus de raison de
 * lui demander quoi que ce soit.
 *
 * Aucun serveur, aucun magasin : la fonction ne lit rien elle-même.
 *
 * Usage :  node test/entree-voile.test.mjs
 */
import { decisionDEntree } from '../server/entree.js';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

/** Un inconnu dans une boutique qui a les deux portes. */
const inconnu = (extra = {}) => decisionDEntree({
  calculExige: true, secoursExige: true,
  admin: false, client: false, inscrit: false, calculPasse: false,
  lien: 'https://t.me/secours_bot',
  ...extra,
});

console.log('\n── L ordre des deux marches ────────────────────────');

let d = inconnu();
check('Un inconnu est arrêté', d.ouverte === false, JSON.stringify(d));
check('Et c est le bot de secours qu on lui demande EN PREMIER',
  d.etape === 'secours', d.etape);
check('Avec le lien où aller', d.lien === 'https://t.me/secours_bot', d.lien);

d = inconnu({ inscrit: true });
check('Écrit au bot de secours, il passe à la marche suivante',
  d.etape === 'calcul', d.etape);
check('Mais il n est pas entré pour autant', d.ouverte === false, String(d.ouverte));

d = inconnu({ inscrit: true, calculPasse: true });
check('Les deux faites, il entre', d.ouverte === true, JSON.stringify(d));

// Le point : résoudre le calcul ne dispense PAS du bot de secours. Sans
// cette épreuve, une inversion de l'ordre passerait inaperçue — le calcul
// est de loin le plus facile des deux à obtenir.
d = inconnu({ calculPasse: true });
check('Le calcul seul ne suffit pas : le secours reste demandé',
  d.ouverte === false && d.etape === 'secours', JSON.stringify(d));

console.log('\n── Qui n est soumis à rien ─────────────────────────');

check('Le vendeur entre', inconnu({ admin: true }).ouverte === true);
check('Un client qui a déjà commandé entre', inconnu({ client: true }).ouverte === true);
check("Et la boutique dit quand même qu'elle a une porte",
  inconnu({ client: true }).requise === true);

console.log('\n── Les interrupteurs ───────────────────────────────');

d = decisionDEntree({ calculExige: false, secoursExige: false,
  admin: false, client: false, inscrit: false, calculPasse: false });
check('Sans aucune porte, rien n est demandé',
  d.requise === false && d.ouverte === true, JSON.stringify(d));

d = inconnu({ secoursExige: false });
check('Sans bot de secours, seul le calcul reste', d.etape === 'calcul', d.etape);

d = inconnu({ calculExige: false });
check('Sans calcul, seul le bot de secours reste', d.etape === 'secours', d.etape);
d = inconnu({ calculExige: false, inscrit: true });
check('Et une fois écrit, il entre directement', d.ouverte === true, JSON.stringify(d));

console.log('\n── Une porte sans poignée ──────────────────────────');

// Le lien manque quand le second jeton est posé mais que Telegram n'a pas
// rendu le nom du bot. Retenir un client devant une porte qu'on ne sait pas
// lui désigner, c'est fermer la boutique pour une configuration à moitié
// faite — et personne ne comprendrait pourquoi.
d = inconnu({ lien: '' });
check('Sans lien, on ne retient personne sur cette marche',
  d.etape !== 'secours', d.etape);
check('Le calcul prend alors le relais', d.etape === 'calcul', JSON.stringify(d));
d = inconnu({ lien: '', calculExige: false });
check('Et sans calcul non plus, la boutique s ouvre', d.ouverte === true, JSON.stringify(d));

console.log('\n── Le compte des marches ───────────────────────────');

// Découvrir la seconde marche en revenant de la première, c'est se voir
// déplacer le but — et c'est là qu'on abandonne. Le client doit savoir dès
// le premier écran qu'il y en a deux.
d = inconnu();
check('Deux portes : « étape 1 sur 2 »', d.marche === 1 && d.marches === 2, JSON.stringify(d));

d = inconnu({ inscrit: true, lien: '' });
check('Une fois le secours écrit : « étape 2 sur 2 »',
  d.marche === 2 && d.marches === 2, JSON.stringify(d));

// Le piège : le lien disparaît de l'état dès que le client est inscrit — le
// serveur ne le calcule plus, il ne sert plus à rien. Compter les marches
// sur sa présence ferait lire « étape 1 sur 2 » puis « étape 1 sur 1 »,
// comme si la première n'avait jamais eu lieu.
check('Et la première marche continue de compter', d.marches === 2, String(d.marches));

d = inconnu({ secoursExige: false });
check('Le calcul seul ne compte qu une marche',
  d.marche === 1 && d.marches === 1, JSON.stringify(d));

d = inconnu({ calculExige: false });
check('Le secours seul non plus', d.marche === 1 && d.marches === 1, JSON.stringify(d));

// Une porte sans poignée ne se compte pas : l'annoncer donnerait à lire
// « étape 1 sur 2 » à quelqu'un qui n'en franchira qu'une.
d = inconnu({ lien: '' });
check('Une porte sans poignée ne compte pas', d.marches === 1, JSON.stringify(d));

console.log(`\nVoile d'entrée : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
