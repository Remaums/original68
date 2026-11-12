/**
 * Qui entre dans la boutique, et ce qui lui manque encore.
 *
 * Deux marches, dans cet ordre : écrire au bot de secours, puis répondre au
 * calcul. L'ordre n'est pas décoratif — Telegram interdit à un bot d'écrire
 * le premier à qui ne lui a jamais écrit, et la seule fenêtre pour demander
 * ce geste est avant que le client ait ce qu'il est venu chercher.
 *
 * Cette décision est prise à DEUX endroits du serveur : la route qui dit à la
 * Mini App ce qu'elle doit afficher, et le garde-fou qui refuse les appels.
 * Écrites séparément, les deux copies divergent — et le jour où elles
 * divergent, c'est l'écran qui dit « entre » et l'API qui répond 403, ou pire
 * l'inverse. D'où cette fonction, sans réseau, sans magasin, sans Express :
 * on lui donne ce qu'on sait, elle rend la marche qui reste.
 *
 * Elle ne lit rien elle-même, et c'est le point : ce sont les trois lectures
 * coûteuses — les réglages, les commandes, le registre — qui décident, et
 * l'appelant sait mieux qu'elle lesquelles il peut éviter.
 */

/**
 * @param {object} etat
 * @param {boolean} etat.calculExige   `features.botCaptcha`
 * @param {boolean} etat.secoursExige  un second bot est posé ET l'interrupteur est allumé
 * @param {boolean} etat.admin         le vendeur
 * @param {boolean} etat.client        il a déjà commandé ici
 * @param {boolean} etat.inscrit       il a écrit au bot de secours
 * @param {boolean} etat.calculPasse   il a répondu au calcul
 * @param {string}  [etat.lien]        l'adresse du bot de secours
 * @returns {{requise: boolean, ouverte: boolean, etape?: 'secours'|'calcul',
 *            lien?: string, marche?: number, marches?: number}}
 */
export function decisionDEntree({
  calculExige, secoursExige, admin, client, inscrit, calculPasse, lien = '',
}) {
  // Aucune porte posée : la question ne se pose pas, et la Mini App n'a même
  // pas à afficher de voile.
  if (!calculExige && !secoursExige) return { requise: false, ouverte: true };

  // Le vendeur n'a pas à se justifier auprès de sa propre boutique. Un client
  // d'avant les portes non plus : elles ont été posées après lui, et il a
  // déjà payé de sa personne.
  if (admin || client) return { requise: true, ouverte: true };

  // Combien de marches ce visiteur-là a devant lui, en comptant celle qu'il
  // vient de franchir. Le client doit savoir dès la première qu'il y en a une
  // seconde : la découvrir en revenant, c'est se voir déplacer le but, et
  // c'est là qu'on abandonne. Le compte se fait donc ici, avec la décision,
  // et non dans l'écran — deux calculs séparés finiraient par ne plus dire la
  // même chose.
  //
  // La marche du secours compte encore une fois franchie (`inscrit`) : sinon
  // le client lirait « étape 1 sur 2 », puis « étape 1 sur 1 », comme si la
  // première n'avait jamais existé. Sans lien et sans inscription, elle ne
  // compte pas — c'est une porte sans poignée, et on ne la lui montre pas.
  const marcheSecours = secoursExige && (inscrit || Boolean(lien));
  const marches = (marcheSecours ? 1 : 0) + (calculExige ? 1 : 0);

  // Sans lien, on ne retient personne : une porte sans poignée n'est pas une
  // porte, c'est un mur. Mieux vaut laisser passer que bloquer sur une
  // configuration à moitié faite.
  if (secoursExige && !inscrit && lien) {
    return { requise: true, ouverte: false, etape: 'secours', lien, marche: 1, marches };
  }

  if (!calculExige) return { requise: true, ouverte: true };
  return {
    requise: true,
    ouverte: Boolean(calculPasse),
    etape: 'calcul',
    marche: marcheSecours ? 2 : 1,
    marches,
  };
}
