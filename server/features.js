/**
 * Registre des fonctionnalités activables.
 *
 * Une seule liste, ici, qui sert à trois choses : les valeurs par défaut, la
 * validation de ce qu'enregistre l'admin, et les libellés affichés dans le
 * tableau de bord. Ajouter une fonctionnalité, c'est ajouter une ligne — pas
 * la recopier dans trois fichiers qui finiraient par diverger.
 *
 * Un interrupteur ne sert que s'il est respecté **côté serveur** : masquer un
 * bouton dans la Mini App ne ferme rien, l'appel reste possible. Chaque clé
 * ci-dessous est donc vérifiée dans une route ou un envoi, jamais seulement
 * dans l'affichage.
 *
 * `obsolete: true` retire un interrupteur du panneau quand il ne pilote
 * plus rien. Aucun ne l'est aujourd'hui : la boutique a retrouvé son panier
 * et sa commande enregistrée, et avec eux les zones, les créneaux, les
 * remises, les codes promo et les garde-fous.
 */

export const FEATURES = [
  {
    key: 'ageGate',
    label: "Porte d'âge",
    hint:
      "L'écran « as-tu 18 ans ? » à l'ouverture de la boutique. " +
      "Éteint par défaut : il ne vérifie rien — n'importe qui appuie sur « oui » — " +
      "et ajoute un geste avant le catalogue. La mention légale reste en bas de la boutique.",
    default: false,
  },
  {
    key: 'captcha',
    label: 'Épreuve anti-robot',
    hint:
      "Une pièce à faire glisser à sa place sur une image du film d'ouverture, " +
      'avant de pouvoir commander.',
    default: true,
  },
  {
    key: 'botCaptcha',
    label: "Calcul d'entrée du bot (ancien)",
    hint:
      "Un petit calcul au premier /start, avant que le bot ne réponde. " +
      "Éteint d'origine : l'épreuve d'entrée est désormais le puzzle de la " +
      "boutique, et deux épreuves à la suite font partir les clients. " +
      "Rallume-le seulement si tu veux les deux.",
    // Éteint par défaut depuis que le puzzle existe. Une boutique déjà en
    // service garde son réglage : un défaut ne remonte pas dans un fichier
    // écrit, et personne ne doit voir sa porte s'ouvrir sans l'avoir demandé.
    default: false,
  },
  {
    key: 'porteSecours',
    label: 'Enregistrer le bot de secours en entrant',
    hint:
      "Au tout premier /start, le bot demande d'abord d'écrire au bot de secours, " +
      'puis pose le calcul. Sans ce geste, il ne pourra jamais prévenir ce client ' +
      "si la boutique change de bot : Telegram interdit d'écrire le premier à qui " +
      "ne vous a jamais écrit. Sans second bot configuré, cet interrupteur ne fait rien.",
    default: true,
  },
  {
    key: 'verification',
    label: "Vérification d'identité",
    hint: "Le client fait valider une pièce dans la conversation du bot avant de commander.",
    default: false,
  },
  {
    key: 'hours',
    label: 'Horaires automatiques',
    hint: 'La boutique se ferme et se rouvre toute seule selon la grille de la semaine.',
    // Allumés par défaut : le bandeau de la boutique annonce des horaires, et
    // sans cet interrupteur rien ne les fait respecter — on peut commander à
    // quatre heures du matin devant un « OUVERT 13H – 00H ».
    default: true,
  },
  {
    key: 'zones',
    label: 'Zones de livraison',
    hint: 'Seuls les codes postaux déclarés sont desservis, avec leurs propres tarifs.',
    default: true,
  },
  {
    key: 'slots',
    label: 'Créneaux',
    hint: 'Le client réserve une plage horaire, avec une capacité par créneau.',
    default: false,
  },
  {
    key: 'animations',
    label: 'Animations et widgets',
    hint:
      "Les cartes qui apparaissent en cascade, l'article qui s'envole vers le panier, " +
      "le bandeau qui décompte jusqu'à la fermeture, la barre de progression vers la " +
      'livraison offerte. Coupé, tout reste en place, mais sans mouvement.',
    default: true,
  },
  {
    key: 'search',
    label: 'Recherche au catalogue',
    hint: 'Une barre de recherche et un tri (prix, nouveautés) au-dessus de la grille.',
    default: true,
  },
  {
    key: 'tiers',
    label: 'Remises par palier',
    hint: 'Une remise automatique au-delà d\'un montant de panier.',
    default: true,
  },
  {
    key: 'promos',
    label: 'Codes promo',
    hint: 'Le champ « code promo » du panier. Les codes déjà créés sont conservés.',
    default: true,
  },
  {
    key: 'announcements',
    label: 'Annonces aux clients',
    hint: 'Écrire à ceux qui ont déjà commandé — nouveauté, promo, fermeture exceptionnelle.',
    default: false,
  },
  {
    key: 'mobileSeulement',
    label: 'Téléphone uniquement',
    hint: "La boutique ne s'ouvre que depuis Telegram sur Android ou iPhone. "
      + 'Sur ordinateur, un message invite à passer au téléphone. '
      + "Le panneau admin, lui, reste accessible partout — c'est sur "
      + "ordinateur qu'on gère un stock confortablement.",
    default: true,
  },
  {
    key: 'waitlist',
    label: "Liste d'attente",
    hint: 'Sur un article épuisé, le client demande à être prévenu du retour.',
    default: true,
  },
  {
    key: 'stockAlerts',
    label: 'Alertes de stock',
    hint: 'Le bot te prévient dès qu\'une commande fait passer un article sous le seuil.',
    default: true,
  },
  {
    key: 'limits',
    label: 'Garde-fous anti-abus',
    hint: 'Plafond de commandes par heure et d\'articles par commande.',
    default: true,
  },
  {
    key: 'photos',
    label: 'Photos par le bot',
    hint: "Changer la photo d'un produit en l'envoyant au bot avec son nom en légende.",
    default: true,
  },
  {
    key: 'orderHistory',
    label: '« Mes commandes »',
    hint: "L'écran où le client relit ses commandes et leur statut.",
    default: true,
  },
  {
    key: 'avis',
    label: 'Avis des clients',
    hint:
      "Les étoiles et les commentaires sur les fiches produits. Seul un client qui a " +
      'reçu la commande peut noter, une fois par commande. Coupé, les avis déjà ' +
      'donnés sont conservés mais ne s\'affichent plus.',
    default: true,
  },
  {
    key: 'favoris',
    label: 'Favoris',
    hint:
      "Le cœur sur les fiches produits, et l'onglet Favoris du profil client. " +
      'Coupé, les favoris déjà enregistrés sont conservés mais ne s\'affichent plus.',
    default: true,
  },
  {
    key: 'musique',
    label: 'Musique d\'ambiance',
    hint:
      'Une pastille discrète, en bas de la boutique, qui joue la playlist du vendeur. ' +
      "Le client doit appuyer : aucun navigateur ne démarre un son tout seul, et tant qu'il " +
      "n'a pas appuyé il ne télécharge rien. Sans morceau dans la liste, la pastille ne " +
      "s'affiche pas, interrupteur allumé ou non.",
    default: false,
  },
  {
    key: 'clientNotifications',
    label: 'Suivi envoyé au client',
    hint: 'Confirmation de commande et messages à chaque changement de statut.',
    default: true,
  },
];

/** Toutes les fonctionnalités à leur valeur par défaut. */
export function defaultFeatures() {
  return Object.fromEntries(FEATURES.map((f) => [f.key, f.default]));
}

/**
 * Nettoie un objet reçu du client.
 *
 * Les clés inconnues sont ignorées et les absentes gardent leur valeur
 * actuelle : l'écran d'admin peut n'envoyer qu'un seul interrupteur.
 */
export function normalizeFeatures(input, current = {}) {
  const base = { ...defaultFeatures(), ...pick(current) };
  return { ...base, ...pick(input) };
}

function pick(source) {
  if (!source || typeof source !== 'object') return {};
  const out = {};
  for (const { key } of FEATURES) {
    if (source[key] !== undefined) out[key] = Boolean(source[key]);
  }
  return out;
}
