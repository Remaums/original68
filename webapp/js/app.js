import { LANGUES, TEXTES, LANGUE_PAR_DEFAUT, langueProposee } from './langues.js';
import { decouperLaDescription } from './description.js';
import {
  PANIER_CLEF, prixDuFormat, prixDAppel, formatParDefaut, nettoyer, ajouter, changerQte,
  nombreDArticles, detailler, recapitulatif, plusFortePromo,
} from './panier.js';

/* ══════════════════════════════════════════════════════════════
   Original68 — logique de la Mini App
   ══════════════════════════════════════════════════════════════ */

const tg = window.Telegram?.WebApp;
const CART_KEY = 'kartoon.cart.v1';
const AGE_KEY = 'kartoon.age.ok';
const PASS_KEY = 'kartoon.pass';
/** Lignes qu'on accepte de relire : au-delà, le serveur refuse la commande. */
const CART_MAX_LINES = 50;

const state = {
  shop: { shopName: 'Original68', currency: 'EUR' },
  categories: [],
  products: [],
  statuses: {},
  category: 'all',
  query: '',           // ce que le client cherche
  sort: 'default',     // et dans quel ordre il veut voir
  gates: {},
  features: {},       // ce que la boutique propose en ce moment
  opening: { open: true },
  fulfillment: { pickup: true, delivery: false, deliveryFee: 0, freeDeliveryFrom: null, minimumOrder: 0 },
  tiers: [],          // remises automatiques par palier
  zones: [],          // zones de livraison desservies
  zone: null,         // celle qui couvre le code postal saisi
  slotsEnabled: false,
  slots: [],          // créneaux encore réservables
  slotId: '',         // celui que le client a choisi
  promo: null,        // remise en cours : { code, discount, label, source }
  lastMessage: '',    // récapitulatif de la dernière commande, pour le renvoyer
  notes: {},          // la note moyenne de chaque produit, venue du catalogue
  avisADonner: [],    // ses commandes reçues dont il n'a encore rien dit
  avisEnCours: null,  // la commande qu'il est en train de noter
  prenom: '',         // son prénom Telegram, pour lui montrer ce qu'il signerait
  favoris: new Set(), // les produits qu'il garde de côté
  coeurs: {},         // combien de clients ont mis chaque produit en favori
  farms: [],          // les producteurs : { id, label, logo }
  farm: null,         // la farm choisie sur l'accueil, ou toutes
  panier: [],         // { id, variantId, qte } — dans le téléphone, nulle part ailleurs
  promoBandeau: { actif: true, titre: '' },
  preferences: {},    // ce qu'il accepte de recevoir
  onglet: 'catalogue',     // l'écran affiché : catalogue, categories, contact, profil, produit
  retour: 'catalogue',     // l'onglet où la flèche de la fiche ramène
  profilVue: 'commandes',  // l'onglet ouvert dans le profil
  profil: null,       // la dernière réponse de /api/profil, pour repeindre sans la redemander
  avisTousVisibles: false,  // « voir tous les avis » d'une fiche
  blocked: false,     // compte privé de commande par le vendeur
  mode: 'pickup',
  captcha: null,      // épreuve en cours
  puzzle: null,       // où en est la pièce, et le geste qui l'a menée là
  startProduct: null, // produit demandé par un lien direct, à ouvrir une fois entré
  current: null, // produit ouvert dans la fiche
  currentVariant: null,
  currentQty: 1,
  bascule: 0,       // instant du prochain changement d'état de la boutique
  decompte: null,   // minuterie du bandeau
};

const $ = (id) => document.getElementById(id);

/* ── L'écran d'ouverture ─────────────────────────────────────
   Ces trois-là sont déclarés avant `init()`, et pas plus bas avec le reste
   de l'écran d'ouverture, pour deux raisons :

   - `init()` les lit dès sa première ligne. Un `const` déclaré plus bas est
     dans sa zone morte à cet instant : la boutique tombait sur une
     ReferenceError au démarrage, avant d'avoir affiché quoi que ce soit ;
   - `ouvertureDebut` doit marquer le début réel de l'ouverture. Posé plus
     bas, il valait la fin de l'évaluation du module — donc un instant déjà
     décalé de ce que voit le client. */

/* Sur une bonne connexion, le catalogue arrive en trois cents millisecondes.
   Sans plancher, l'écran d'ouverture apparaîtrait et disparaîtrait avant
   qu'on ait vu l'image — autant ne pas mettre de vidéo du tout.

   Le plancher est la durée du film, lue dans le fichier lui-même.
   Auparavant c'était un nombre écrit ici, qu'il fallait réécrire à chaque
   changement de vidéo — et qui se trompait entre deux : un film de quatorze
   secondes sous un plancher de quinze rebouclait une seconde sur la fin,
   ce qu'on venait justement de supprimer. Le film décide maintenant, et
   l'écran s'en va exactement quand il se termine.

   La valeur ci-dessous n'est qu'un secours, pour le cas où la durée reste
   inconnue : fichier absent, format refusé, réseau coupé. Elle est courte
   à dessein — si le film ne se charge pas, il n'y a rien à regarder, et
   retenir le client devant une image fixe n'est plus une ouverture. */
const OUVERTURE_SECOURS_MS = 6000;
/* Bornes de bon sens : un fichier abîmé qui annoncerait trois heures
   fermerait la boutique sans rien dire. */
const OUVERTURE_MIN = 2000;
const OUVERTURE_MAX = 40000;
let ouvertureMs = OUVERTURE_SECOURS_MS;
/* La durée est-elle arrêtée ? Tant qu'elle ne l'est pas, on ne programme pas
   la fermeture du voile : le catalogue arrive souvent avant les métadonnées
   du film — trois cents millisecondes contre quatre cents mesurées — et la
   fermeture se calait alors sur la durée de secours. Elle était programmée,
   donc plus rien ne la rattrapait, et l'écran partait à six secondes sur un
   film qui en dure quatorze. */
let ouvertureCalee = false;
const enAttenteDeCalage = [];
/* Les trois phrases de l'écran d'ouverture. Elles sont ici et non près de la
   fonction qui les déroule, pour la raison écrite juste au-dessus : `init()`
   s'exécute à la lecture du module et appelle `derouler()` dès sa quinzième
   ligne. Déclarées plus bas, elles étaient dans leur zone morte à cet
   instant — l'écran d'ouverture restait affiché pour toujours, sur une
   ReferenceError que personne ne voyait. */
const OUVERTURE_PHRASES = ['ouverture.1', 'ouverture.2', 'ouverture.3', 'ouverture.4', 'ouverture.5'];
const ouvertureDebut = Date.now();

/* ── La langue ───────────────────────────────────────────────
   Retenue chez le client et non sur le serveur : c'est un réglage
   d'affichage, il n'a pas besoin d'un aller-retour pour s'appliquer, et
   la boutique doit pouvoir s'afficher avant que quoi que ce soit ait
   répondu. Le revers est réel et assumé : changer de téléphone fait
   reposer la question. */
const LANGUE_CLEF = 'o68.langue';
let langue = LANGUE_PAR_DEFAUT;

/**
 * Le texte d'une clef, dans la langue en cours.
 *
 * Le second argument remplit les trous `{nom}` de la phrase. C'est ce qui
 * permet de traduire « ferme dans {duree} » d'un bloc : découpé en morceaux
 * recollés par le script, l'ordre des mots serait celui du français, et
 * l'espagnol comme l'anglais se retrouveraient à l'envers.
 */
function t(clef, valeurs) {
  // Le français sert de repli : une clef oubliée ailleurs s'affiche en
  // français plutôt que de laisser un « undefined » à l'écran.
  let texte = TEXTES[langue]?.[clef] ?? TEXTES[LANGUE_PAR_DEFAUT][clef] ?? clef;
  if (valeurs) {
    for (const [nom, valeur] of Object.entries(valeurs)) {
      texte = texte.split(`{${nom}}`).join(isoler(valeur));
    }
  }
  return texte;
}

/**
 * Ce qu'on glisse dans une phrase traduite ne vient jamais du dictionnaire :
 * c'est un pseudo, un nom de boutique, un nom de produit — du texte écrit
 * ailleurs, dans une autre écriture que celle de la phrase qui l'accueille.
 *
 * En arabe, « Bienvenue @amine » s'affichait « amine@ مرحباً » : l'arobase
 * n'appartient à aucune des deux écritures, le navigateur la rattache donc
 * à la phrase plutôt qu'au pseudo, et elle passe de l'autre côté du nom.
 *
 * U+2068 et U+2069 sont deux caractères invisibles qui disent « ce qui suit
 * forme un bloc, trouve son sens tout seul, et ne déteint pas sur le reste ».
 * C'est exactement ce dont un pseudo latin dans une phrase arabe a besoin.
 * Hors écriture droite-à-gauche ils ne changeraient rien, mais ils
 * apparaîtraient dans les messages qu'on prépare pour Telegram : on ne les
 * pose donc que là où ils servent.
 */
function isoler(valeur) {
  const texte = String(valeur);
  return rtl() ? `\u2068${texte}\u2069` : texte;
}

/** La langue en cours se lit-elle de droite à gauche ? */
function rtl() {
  return LANGUES.find((l) => l.code === langue)?.sens === 'rtl';
}

/** Le code de date de la langue en cours (« fr-FR », « en-GB »…). */
function locale() {
  return LANGUES.find((l) => l.code === langue)?.locale ?? 'fr-FR';
}

/**
 * Applique la langue à toute la page.
 *
 * Les textes du HTML portent `data-t` ; ceux que le script fabrique passent
 * par `t()` et sont refaits par les fonctions de rendu, qu'on rappelle ici.
 * L'attribut `lang` de la page suit aussi : il décide de la coupure des mots
 * et de ce que lit une synthèse vocale.
 */
function appliquerLaLangue(code, { retenir = false } = {}) {
  if (TEXTES[code]) langue = code;
  document.documentElement.lang = langue;
  // L'arabe se lit de droite à gauche. C'est `dir` qui retourne la page, pas
  // la feuille de style : elle est écrite en propriétés logiques, et sans cet
  // attribut « start » veut dire « gauche » partout. Reposé à chaque
  // application, parce qu'on peut revenir de l'arabe au français.
  document.documentElement.dir = rtl() ? 'rtl' : 'ltr';
  // On n'enregistre que sur un choix. Écrire à chaque application faisait
  // croire, dès la première ligne de l'écran d'ouverture, que le client avait
  // déjà choisi : le cadre d'accueil ne s'affichait plus jamais, et la
  // musique partait sans le geste qu'il devait justement recueillir.
  if (retenir) {
    try { localStorage.setItem(LANGUE_CLEF, langue); } catch { /* navigation privée */ }
    // Et au serveur, pour que le bot parle la même langue. Sans cet envoi,
    // le client choisit l'italien ici et reçoit ses messages en français :
    // il recommence, ça ne tient toujours pas, et il conclut que le réglage
    // ne marche pas. Sans attendre la réponse — c'est un réglage de confort,
    // il ne doit pas retarder d'une seconde la traduction de l'écran.
    if (tg?.initData) {
      fetch('/api/langue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg.initData },
        body: JSON.stringify({ code: langue }),
      }).catch(() => { /* hors ligne : le navigateur s'en souvient quand même */ });
    }
  }

  for (const el of document.querySelectorAll('[data-t]')) {
    el.textContent = t(el.dataset.t);
  }
  // Les rares textes qui portent du gras passent par innerHTML. Le contenu
  // vient de notre propre dictionnaire, jamais du client : c'est ce qui rend
  // l'exception acceptable, et c'est pourquoi elle reste une exception.
  for (const el of document.querySelectorAll('[data-t-html]')) {
    el.innerHTML = t(el.dataset.tHtml);
  }
  for (const el of document.querySelectorAll('[data-t-placeholder]')) {
    el.placeholder = t(el.dataset.tPlaceholder);
  }
  for (const el of document.querySelectorAll('[data-t-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.tAria));
  }
  repeindreLesTextesFabriques();
}

/**
 * Ce que le script écrit lui-même ne porte pas de `data-t` : il faut le
 * refaire.
 *
 * Chaque rendu est isolé. Cette fonction tourne aussi au tout début, avant
 * que le catalogue soit arrivé : un rendu qui compte sur des données
 * absentes ne doit pas emporter les autres avec lui, ni laisser la boutique
 * à moitié traduite.
 */
function repeindreLesTextesFabriques() {
  const refaires = [
    renderLangues, renderStatut, renderClosedBanner, renderSousTitre,
    renderTitreDuBandeau, renderChiffres, renderGrid, renderCategories,
    renderRayons, renderContact, peindreLeJuke, renderSuggestionAvis, renderIdentite,
    renderSecours, peindreLesMarches, peindreLaPastilleDeLangue,
    // Le panier et les favoris, s'ils sont à l'écran : leurs libellés sont
    // écrits par le script, pas par le HTML.
    () => { if (state.onglet === 'panier') renderPanier(); },
    () => { if (state.onglet === 'favoris') ouvrirLesFavoris(); },
    // La barre de la fiche en fait partie : `pLibelle` porte
    // `data-t="produit.ajouter"`, et la boucle des `data-t` y remettait
    // « Commander » sur un article épuisé — sur un bouton éteint, ou à la
    // place du rappel de retour. C'est elle qui décide du libellé, pas le
    // HTML, donc elle repasse après.
    majBarreDeCommande,
  ];
  for (const refaire of refaires) {
    try { refaire(); } catch { /* pas encore de données : le prochain rendu s'en chargera */ }
  }

  // Les trois vues du profil se peignent depuis une réponse du serveur : on
  // la garde au passage plutôt que de la redemander. Sans ce rappel, changer
  // de langue depuis le profil — le seul endroit où l'on peut le faire hors
  // de l'accueil — laissait juste en dessous « Tu n'as pas encore passé de
  // commande » en français.
  const profil = state.profil;
  if (profil) {
    try {
      renderCommandes(profil.commandes ?? []);
      renderFavoris(profil.favoris ?? []);
      renderAlertes(profil);
    } catch { /* une vue à moitié peinte valait mieux qu'un écran figé */ }
  }
}

/** La langue retenue, ou celle que propose le téléphone. */
function langueDeDepart() {
  let gardee = null;
  try { gardee = localStorage.getItem(LANGUE_CLEF); } catch { /* navigation privée */ }
  if (gardee && TEXTES[gardee]) return { code: gardee, dejaChoisie: true };
  return { code: langueProposee(tg?.initDataUnsafe?.user?.language_code), dejaChoisie: false };
}

/**
 * La langue que le serveur connaît de ce client, s'il en connaît une.
 *
 * Elle vaut mieux que celle du navigateur : c'est la même qu'utilise le bot,
 * et elle suit le client d'un téléphone à l'autre. Le navigateur, lui, ne
 * sait que ce qui a été choisi sur CET appareil — et rien du tout après un
 * nettoyage ou en navigation privée.
 *
 * On ne l'attend pas pour peindre le premier écran : la langue du navigateur
 * s'applique tout de suite, et celle-ci corrige s'il y a lieu. Attendre le
 * réseau pour afficher la première phrase, c'est afficher un écran vide.
 */
async function langueDuServeur() {
  if (!tg?.initData) return null;
  try {
    const res = await fetch('/api/langue', { headers: { 'X-Telegram-Init-Data': tg.initData } });
    if (!res.ok) return null;
    const etat = await res.json();
    // Seulement un choix explicite : une langue simplement devinée par le
    // serveur ne vaut pas plus que celle devinée ici, et écraserait ce que
    // le client vient peut-être de choisir sur cet appareil.
    return etat.source === 'choisie' && TEXTES[etat.code] ? etat.code : null;
  } catch {
    return null;
  }
}

let fermetureProgrammee = false;

/* ── Démarrage ───────────────────────────────────────────── */

init();

async function init() {
  if (tg) {
    tg.ready();
    tg.expand();
    const night = themeHex('--night-rgb', '#0b0d14');
    tg.setHeaderColor?.(night);
    tg.setBackgroundColor?.(night);
    tg.enableClosingConfirmation?.();
    tg.BackButton?.onClick(revenirEnArriere);
  }

  // La langue d'abord : l'écran d'ouverture parle, et il doit parler celle
  // du client dès sa première phrase. Appliquée plus tard, elle arrivait
  // après que la première ligne s'était affichée en français.
  appliquerLaLangue(langueDeDepart().code);
  // Puis, sans bloquer, ce que le serveur sait : c'est la langue que parle
  // aussi le bot, et elle suit le client d'un appareil à l'autre.
  langueDuServeur()
    .then((code) => { if (code && code !== langue) appliquerLaLangue(code); })
    .catch(() => {});

  state.startProduct = produitDemande();

  // Avant tout le reste : l'écran d'ouverture est déjà affiché, son film doit
  // partir maintenant et pas après le catalogue.
  reglerLeFilm(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  // Le plancher vaut la durée du film : on l'apprend du fichier, et c'est
  // seulement là que la jauge, les phrases et les éclairs se répartissent.
  calerLOuverture();

  bindStaticHandlers();
  gateAge();
  montrerLeSquelette();

  try {
    const res = await fetch('/api/catalog');
    if (!res.ok) {
      // Le serveur explique souvent la panne dans le corps — un dossier de
      // données mal attribué, par exemple. Le remplacer par « HTTP 503 »
      // jetterait précisément ce qui sert à la réparer.
      const dit = await res.json().catch(() => ({}));
      throw new Error(dit.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    state.shop = data.shop;
    state.categories = data.categories;
    state.products = data.products;
    state.statuses = data.statuses ?? {};
    state.gates = data.gates ?? {};
    state.features = data.features ?? {};
    state.notes = data.notes ?? {};
    state.coeurs = data.coeurs ?? {};
    state.farms = data.farms ?? [];
    state.tiers = data.discounts?.tiers ?? [];
    state.zones = data.zones ?? [];
    state.slotsEnabled = Boolean(data.slots?.enabled);
    state.promoBandeau = data.promoBandeau ?? state.promoBandeau;
    state.panier = nettoyer(lireLePanier(), state.products);
    ecrireLePanier();
    state.opening = data.opening ?? { open: true };
    state.musique = data.musique ?? { titres: [] };
    state.fulfillment = data.fulfillment ?? state.fulfillment;
    appliquerLesAnimations();
    applyFeatures();
    state.mode = state.fulfillment.pickup ? 'pickup' : 'delivery';
  } catch (err) {
    console.error(err);
    // Un toast disparaît en deux secondes et la grille reste vide : la boutique
    // avait alors l'air de n'avoir aucun produit, alors qu'elle était
    // simplement injoignable. Pour un client c'est une boutique abandonnée ;
    // pour le vendeur qui installe, c'est une fausse piste. On le dit donc en
    // clair, et on laisse de quoi réessayer.
    // Pas de lever de rideau sur une panne : la décharge annonce une
    // boutique qui s'ouvre, et ce qui s'affiche ici dit le contraire.
    retirerLeVoile({ aussitot: true, rideau: false });
    montrerPanne(err);
    return;
  }

  $('shopName').textContent = state.shop.shopName;
  document.title = `${state.shop.shopName} — ${t('titre.page')}`;
  // La mention ne vit plus que sur l'écran d'âge. Elle était répétée en pied
  // de catalogue, où elle arrivait après treize produits — donc trop tard
  // pour prévenir qui que ce soit, et juste à temps pour finir la page sur
  // un avertissement.
  $('legalNotice').textContent = t('legal.mention');

  renderClosedBanner();
  renderSousTitre();
  renderTitreDuBandeau();
  monterLeJuke();
  monterLaPastilleDeLangue();
  renderStatut();
  renderCategories();
  renderGrid();
  retirerLeVoile();
  mesurerLaBarre();
  placerLeCurseur();
  // La barre bouge avec la rotation de l'écran et avec le clavier : une
  // mesure prise une fois au lancement se périme au premier quart de tour.
  window.addEventListener('resize', () => {
    mesurerLaBarre();
    placerLeCurseur();
  });
  runGates();
}

/**
 * Tout ce qui demande d'être reconnu : commandes, avis, favoris, créneaux.
 *
 * Séparé de l'ouverture parce que ça se rejoue. La porte du bot peut s'ouvrir
 * pendant qu'on regarde l'écran — le client vient de calculer dans le chat et
 * revient — et il faut bien que la boutique se remplisse sans qu'il la
 * relance. Une fois suffit : le garde-fou évite que chaque voile refermé
 * redemande les mêmes quatre listes.
 */
let signeCharge = false;
function chargerLaBoutiqueSignee() {
  if (signeCharge) return;
  signeCharge = true;
  chargerLesAvisADonner();
  chargerLesFavoris();
  loadSlots();
  battreLePouls();
}

/* ── Le voile de chargement ──────────────────────────────── */

/**
 * Retire le voile d'ouverture.
 *
 * `hidden` plutôt qu'un retrait du DOM : la feuille de style le fait
 * disparaître en fondu, et un élément arraché ne peut pas fondre. Il ne gêne
 * plus personne une fois transparent (`pointer-events: none`).
 */

/**
 * Retire l'écran d'ouverture, en le laissant vivre ses trois secondes.
 *
 * `aussitot` sert au cas de panne : quand la boutique est injoignable, faire
 * patienter trois secondes de plus devant une vidéo avant d'annoncer la
 * mauvaise nouvelle, c'est trois secondes prises à quelqu'un qui a déjà un
 * problème. Le plancher n'existe que pour donner à voir, pas pour retenir.
 */
function retirerLeVoile({ aussitot = false, rideau = true } = {}) {
  const voile = document.getElementById('charge');
  if (!voile || voile.hidden || fermetureProgrammee) return;

  // On ne programme rien avant de savoir combien de temps dure le film :
  // programmée sur la durée de secours, la fermeture ne se rattrape plus.
  // « Aussitôt » passe outre — c'est une demande de partir maintenant, pas
  // une ouverture à jouer.
  if (!aussitot && !ouvertureCalee) {
    enAttenteDeCalage.push(() => retirerLeVoile({ aussitot, rideau }));
    return;
  }

  // Le plancher ne s'applique que s'il y a quelque chose à regarder. Sous
  // « moins de mouvement » le film ne joue pas : retenir trois secondes
  // devant une image fixe, ce n'est plus une ouverture, c'est une attente.
  const reste = ouvertureMs - (Date.now() - ouvertureDebut);
  if (!aussitot && reste > 0 && anime()) {
    fermetureProgrammee = true;
    setTimeout(() => fermerLeVoile({ rideau }), reste);
    return;
  }
  fermerLeVoile({ rideau });
}

/**
 * Lance la jauge de l'écran d'ouverture, sur la durée exacte du plancher.
 *
 * Elle part d'ici et non de la feuille de style pour que les deux horloges
 * soient la même : le plancher se compte depuis `ouvertureDebut`, qui est
 * fixé à l'évaluation de ce module, tandis qu'une animation CSS démarre au
 * parsage de la feuille — une seconde plus tôt. La barre arrivait donc au
 * bout avant que l'écran ne parte, ce qui est exactement l'image d'une
 * application bloquée.
 */
/**
 * Met le film du bandeau sous surveillance.
 *
 * Une balise vidéo en boucle continue de décoder image après image quand
 * elle est sortie de l'écran : le bandeau est en haut de la page, donc il
 * disparaît au premier défilement et personne ne le regarde pendant qu'il
 * cherche un produit plus bas. On le met en pause dès qu'il sort, on le
 * relance quand il revient.
 *
 * `preload="none"` dans le balisage va avec : le fichier est le même que
 * celui de l'écran d'ouverture, donc déjà en cache à cet instant, et il
 * n'y a aucune raison d'en redemander une copie au serveur.
 *
 * Sans IntersectionObserver — vieille WebView — on ne joue pas du tout :
 * l'affiche reste, et c'est préférable à une vidéo qui tournerait pour
 * rien jusqu'à la fermeture de la boutique.
 */
function surveillerLeBandeau() {
  const film = document.getElementById('heroFilm');
  if (!film || typeof IntersectionObserver !== 'function') return;
  const oeil = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (e.isIntersecting && anime()) film.play?.().catch(() => {});
      else film.pause?.();
    }
  }, { threshold: 0.12 });
  oeil.observe(film);
}

/**
 * Replie la recherche, et efface ce qu'elle filtrait.
 *
 * Refermer la rangée sans vider le champ laisserait le catalogue filtré
 * par un texte que plus personne ne voit : le client croirait la boutique
 * à moitié vide. Le tri, lui, reste — c'est un ordre d'affichage, pas un
 * filtre, et rien ne disparaît de l'écran à cause de lui.
 */
function replierLaRecherche() {
  const barre = $('findBar');
  if (!barre || barre.hidden) return;
  barre.hidden = true;
  $('findBtn')?.setAttribute('aria-expanded', 'false');
  if (state.query) {
    state.query = '';
    $('findInput').value = '';
    $('findClear').hidden = true;
    renderGrid();
  }
}

/**
 * Ce qu'il reste à tenir avant que le voile se lève.
 *
 * La jauge, les phrases et les éclairs se répartissent là-dessus et non sur
 * la durée totale : ils ne partent qu'une fois la durée du film connue, soit
 * quelques centaines de millisecondes après l'affichage de l'écran. Calés
 * sur le total, ils finiraient tous d'autant après le départ du voile — une
 * barre encore en train de se remplir sous un écran déjà parti.
 */
function resteDeLOuverture() {
  return Math.max(400, ouvertureMs - (Date.now() - ouvertureDebut));
}

/**
 * Cale l'ouverture sur la durée du film, puis la lance.
 *
 * La durée n'est connue qu'une fois les métadonnées arrivées. On l'attend,
 * mais pas indéfiniment : un fichier absent ou un format refusé ne doit pas
 * laisser l'écran d'ouverture sans jauge ni fin. Passé le délai, on part sur
 * la durée de secours.
 *
 * Le démarrage ne se fait qu'une fois : les métadonnées peuvent arriver
 * après le délai, et relancer alors une seconde jauge par-dessus la première
 * donnerait une barre qui recule.
 */
function calerLOuverture() {
  const film = document.getElementById('chargeFilm');
  let parti = false;

  const partir = (duree) => {
    if (parti) return;
    parti = true;
    if (Number.isFinite(duree) && duree >= OUVERTURE_MIN && duree <= OUVERTURE_MAX) {
      ouvertureMs = Math.round(duree);
    }
    ouvertureCalee = true;
    lancerLaJauge();
    derouler();
    // Ce qui attendait la durée peut repartir — la demande de fermeture du
    // voile, en premier lieu.
    while (enAttenteDeCalage.length) enAttenteDeCalage.shift()();
  };

  // Pas de film du tout : la durée de secours est la durée, rien à attendre.
  if (!film) return partir(NaN);
  // Métadonnées déjà là : rien à attendre.
  if (film && film.readyState >= 1 && Number.isFinite(film.duration)) {
    return partir(film.duration * 1000);
  }
  if (film) {
    film.addEventListener('loadedmetadata', () => partir(film.duration * 1000), { once: true });
    // Un fichier introuvable ne déclenche pas `loadedmetadata` : sans ce
    // filet, l'écran resterait sans jauge et sans phrases jusqu'à ce que le
    // catalogue arrive.
    film.addEventListener('error', () => partir(NaN), { once: true });
  }
  setTimeout(() => partir(NaN), 2000);
}

function lancerLaJauge() {
  const barre = document.querySelector('.charge__jauge span');
  if (!barre) return;
  const duree = resteDeLOuverture();
  barre.style.animation = `charge-jauge ${duree}ms linear forwards`;
  compterLePourcentage(duree);
}

/**
 * Le pourcentage sous la jauge, qui suit la même course qu'elle.
 *
 * Il ne mesure pas plus qu'elle : il dit en chiffres ce que la barre dit en
 * longueur. Il s'arrête de lui-même quand l'écran part, pour ne pas faire
 * tourner une boucle d'affichage derrière la boutique.
 */
function compterLePourcentage(duree) {
  const pct = $('chargePct');
  const libelle = $('chargeLibelle');
  if (libelle) libelle.textContent = t('ouverture.chargement');
  // La première ligne est écrite dans le HTML, en français : la langue du
  // client n'est connue qu'ici.
  const premiere = $('chargeTexte');
  if (premiere) premiere.textContent = t(OUVERTURE_PHRASES[0]);
  if (!pct) return;
  const debut = performance.now();
  const tour = (maintenant) => {
    if ($('charge')?.hidden) return;
    const part = Math.min(1, (maintenant - debut) / duree);
    pct.textContent = `${Math.round(part * 100)} %`;
    if (part < 1) requestAnimationFrame(tour);
  };
  requestAnimationFrame(tour);
}

/**
 * Ce que dit l'écran d'ouverture, en trois temps.
 *
 * Une phrase figée pendant cinq secondes ne dit rien de plus qu'une phrase
 * figée pendant une seconde : c'est le changement qui prouve que quelque
 * chose avance. Les trois se relaient sur la durée du plancher, la dernière
 * arrivant juste avant que le rideau se lève.
 *
 * Le fondu se fait en retirant la classe puis en la remettant au tour de
 * boucle suivant : ré-assigner le même texte ne relance aucune animation.
 */
function derouler() {
  const ligne = $('chargeTexte');
  if (!ligne || !anime()) return;

  const pas = resteDeLOuverture() / OUVERTURE_PHRASES.length;
  OUVERTURE_PHRASES.slice(1).forEach((clef, i) => {
    const quand = Math.round(pas * (i + 1));
    setTimeout(() => {
      // Le rideau peut être parti avant l'heure : on ne réveille pas un écran
      // qui n'est plus là pour y écrire une phrase que personne ne lira.
      if ($('charge')?.hidden) return;
      // L'étape qui s'achève reste écrite au-dessus, cochée.
      const journal = $('chargeJournal');
      if (journal && ligne.textContent.trim()) {
        const faite = document.createElement('li');
        faite.textContent = `✅ ${ligne.textContent.trim()} OK`;
        journal.append(faite);
      }
      ligne.classList.remove('charge__texte--entre');
      ligne.textContent = t(clef);
      requestAnimationFrame(() => ligne.classList.add('charge__texte--entre'));
    }, quand);
  });
}

/**
 * Deux éclairs sur l'écran d'ouverture.
 *
 * La version d'avant avait retiré l'anneau qui tournait et l'éclair qui se
 * déchargeait, au motif que deux choses en mouvement sur le même écran se
 * disputent le regard. L'argument tient toujours, et c'est pourquoi ce qu'on
 * ajoute ici ne se pose pas sur le personnage : un éclair blanchit tout
 * l'écran pendant un sixième de seconde, comme le ferait celui du film. Ce
 * n'est pas un deuxième objet à regarder, c'est le même orage.
 */
function foudroyer() {
  const ecran = $('charge');
  if (!ecran || !anime()) return;
  // Pas sur la première image : l'écran vient d'apparaître, un éclair au même
  // instant passe pour un défaut d'affichage plutôt que pour un effet.
  // La classe part dès que l'éclair est passé. Laissée en place, elle ne
  // rejoue rien mais elle traîne : le prochain qui lira cet écran dans
  // l'inspecteur croira qu'un éclair est en cours alors qu'il n'y en a pas.
  ecran.addEventListener('animationend', (ev) => {
    if (ev.animationName === 'charge-foudre') ecran.classList.remove('charge--foudre');
  });

  // Trois éclairs plutôt que deux : les fractions suivent la durée, et à
  // quinze secondes deux éclats laissaient sept secondes de calme plat entre
  // eux. Ils restent à plus de trois secondes d'écart — loin des trois flashs
  // par seconde au-delà desquels un écran devient dangereux.
  for (const quand of [
    Math.round(resteDeLOuverture() * 0.26),
    Math.round(resteDeLOuverture() * 0.55),
    Math.round(resteDeLOuverture() * 0.82),
  ]) {
    setTimeout(() => {
      if (ecran.hidden) return;
      ecran.classList.remove('charge--foudre');
      // Le tour de boucle suivant : remettre une classe qu'on vient d'ôter
      // dans la même image ne relance pas l'animation, le navigateur ne voit
      // aucun changement.
      requestAnimationFrame(() => ecran.classList.add('charge--foudre'));
    }, quand);
  }
}

/**
 * La décharge jaune du lever de rideau.
 *
 * Elle part après le voile et non avec lui : l'écran d'ouverture est au
 * premier plan et s'efface en fondu sur trois dixièmes de seconde, si bien
 * qu'une rafale lancée en même temps se jouerait derrière lui et serait à
 * moitié finie quand on la verrait. D'où le décalage, calé sur ce fondu.
 *
 * La classe est retirée à la fin : laissée en place, elle rejouerait la
 * rafale au prochain changement d'onglet, chaque fois que le navigateur
 * recalcule les animations de la couche.
 */
function decharger() {
  if (!anime()) return;
  const couche = document.querySelector('.fx');
  if (!couche) return;
  setTimeout(() => {
    couche.classList.add('fx--arrivee');
    setTimeout(() => couche.classList.remove('fx--arrivee'), 1800);
  }, 280);
}

function fermerLeVoile({ rideau = true } = {}) {
  const voile = document.getElementById('charge');
  if (voile) voile.hidden = true;
  if (rideau) decharger();
  // Le bandeau ne prend vie qu'ici. IntersectionObserver regarde la fenêtre,
  // pas ce qui est posé par-dessus : lancée au démarrage, la surveillance
  // aurait trouvé le bandeau « visible » sous l'écran d'ouverture et fait
  // décoder deux vidéos à la fois pour n'en montrer qu'une.
  surveillerLeBandeau();
  // Le voile part en fondu, donc il reste dans la page. Une vidéo en boucle
  // dans un élément transparent continue de décoder image après image : on
  // l'arrête, sinon elle tourne pour rien jusqu'à la fermeture de la
  // boutique, batterie comprise.
  reglerLeFilm(false);
  // L'accueil prend le relais du film. C'est lui qui lance la musique, parce
  // que c'est lui qui obtient le geste du client — un appui sur une langue,
  // ou sur « Entrer » pour qui a déjà choisi la sienne.
  montrerLAccueil();
}

/**
 * Lance ou arrête le film de l'écran d'ouverture.
 *
 * `play()` rend une promesse qui est rejetée quand la WebView refuse la
 * lecture — vieille version, économie de données, politique de lecture
 * automatique. Ce n'est pas une erreur à remonter : l'affiche reste à
 * l'écran et l'ouverture se passe très bien sans le film. D'où le `catch`
 * vide, qui est ici un choix et non un oubli.
 */
function reglerLeFilm(jouer) {
  const film = document.getElementById('chargeFilm');
  if (!film) return;
  if (jouer) film.play?.().catch(() => {});
  else film.pause?.();
}


/**
 * Dit que la boutique est injoignable, plutôt que de la montrer vide.
 *
 * Les deux états se ressemblent à l'écran et ne veulent pas du tout dire la
 * même chose : « il n'y a rien à vendre » contre « je n'arrive pas à joindre
 * le serveur ». Confondre les deux envoie chercher au mauvais endroit.
 */
function montrerPanne(err) {
  const zone = $('empty');
  zone.hidden = false;
  zone.replaceChildren();

  const titre = document.createElement('strong');
  titre.textContent = t('msg.injoignable');

  const texte = document.createElement('span');
  texte.textContent = t('msg.injoignableTexte');

  const detail = document.createElement('code');
  detail.className = 'empty__detail';
  detail.textContent = String(err?.message ?? err).slice(0, 120);

  const reessayer = document.createElement('button');
  reessayer.type = 'button';
  reessayer.className = 'btn btn--primary';
  reessayer.textContent = t('msg.reessayer');
  reessayer.addEventListener('click', () => {
    reessayer.disabled = true;
    reessayer.textContent = t('msg.chargement');
    // Un rechargement complet : plus sûr qu'un rattrapage partiel, puisqu'on
    // ne sait pas jusqu'où le démarrage était allé.
    location.reload();
  });

  zone.append(titre, texte, detail, reessayer);
  toast(t('msg.catalogueIndispo'));
}

/**
 * Pose des cartes vides le temps que le catalogue arrive.
 *
 * Mieux qu'un écran vide : la grille montre sa forme, l'attente paraît plus
 * courte, et l'écran ne saute pas au moment où les vraies cartes arrivent —
 * elles occupent déjà la place.
 */
function montrerLeSquelette() {
  const grille = $('grid');
  if (grille.childElementCount) return;
  grille.replaceChildren(
    ...Array.from({ length: 6 }, () => {
      const faux = document.createElement('div');
      faux.className = 'squelette';
      faux.setAttribute('aria-hidden', 'true');
      return faux;
    })
  );
}

/**
 * Suspend ou rétablit tout le mouvement de la boutique.
 *
 * Deux raisons de le couper : le vendeur a éteint la fonctionnalité, ou le
 * système du client demande moins de mouvement — un réglage qu'on ne discute
 * pas, souvent posé pour raison médicale. Le CSS fait le reste ; rien ne
 * disparaît, tout devient simplement immobile.
 */
function appliquerLesAnimations() {
  const sobre = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const coupe = state.features.animations === false || sobre;
  document.documentElement.dataset.anim = coupe ? 'off' : 'on';

  // L'emblème de la bannière est un SVG dont le grésillement vient du CSS :
  // la règle [data-anim='off'] posée juste au-dessus l'a déjà éteint, il n'y
  // a rien à faire de plus ici. Il y avait à cet endroit un échange d'adresse
  // hérité de l'autre boutique, où l'emblème était un GIF — qui ne se met pas
  // en pause et qu'il fallait donc remplacer par une image fixe. Les deux
  // branches pointaient sur le même fichier : le code ne faisait rien.

  // Le film de l'ouverture, lui, s'arrête vraiment. Il est en général déjà
  // parti quand les réglages de la boutique arrivent, mais pas toujours : un
  // catalogue lent le laisse à l'écran plusieurs secondes.
  reglerLeFilm(!coupe && !document.getElementById('charge')?.hidden);

  // Et celui du bandeau avec lui — mais on ne fait qu'arrêter ici, jamais
  // démarrer : cette fonction tourne avant le départ du voile, et c'est
  // l'observateur qui décide quand le bandeau est réellement à l'écran.
  // Lui, il consulte `anime()`, qui vient d'être mis à jour.
  if (coupe) document.getElementById('heroFilm')?.pause?.();
  return !coupe;
}

/**
 * Vrai si la boutique a le droit de bouger.
 *
 * Déclarée en fonction et non en `const` fléchée : `init()` s'exécute à la
 * lecture du module, bien avant cette ligne, et tout ce qu'il appelle en
 * chemin — l'écran d'ouverture, en particulier — tombait sur une
 * ReferenceError en consultant une constante encore dans sa zone morte. Une
 * déclaration de fonction remonte, elle ; c'est le deuxième piège du même
 * genre sur ce fichier, et celui-ci ne peut plus se refermer.
 */
function anime() {
  return document.documentElement.dataset.anim !== 'off';
}

function bindStaticHandlers() {
  $('ageYes').addEventListener('click', () => {
    try { localStorage.setItem(AGE_KEY, '1'); } catch {}
    $('agegate').hidden = true;
    haptic('light');
    runGates();
  });
  $('ageNo').addEventListener('click', () => (tg ? tg.close() : window.history.back()));

  for (const bouton of $('tabbar').querySelectorAll('.tabbar__item')) {
    bouton.addEventListener('click', () => {
      montrerLOnglet(bouton.dataset.onglet);
      haptic('light');
    });
  }
  $('pCoeur').addEventListener('click', async () => {
    if (!state.current) return;
    await basculerFavori(state.current.id);
    peindreLeCoeur($('pCoeur'), state.current.id);
    // La grille derrière la feuille porte le même cœur : sans ça, il reste
    // allumé après qu'on l'a éteint ici.
    renderGrid();
  });
  for (const onglet of $('profilOnglets').querySelectorAll('.profil__onglet')) {
    onglet.addEventListener('click', () => {
      montrerLaVue(onglet.dataset.vue);
      haptic('light');
    });
  }
  $('pRetour').addEventListener('click', () => { montrerLOnglet(state.retour); haptic('light'); });
  $('captchaSubmit').addEventListener('click', submitCaptcha);
  // Fermer la Mini App ramène le client dans la conversation du bot, là où il
  // envoie sa pièce : pas besoin de connaître le nom du bot.
  $('verifAction').addEventListener('click', () => (tg ? tg.close() : window.history.back()));
  // Le menu d'appui long sur une photo — « Enregistrer l'image », « Copier ».
  //
  // Une écoute déléguée sur le document plutôt qu'une par image : la grille
  // se repeint à chaque filtre, chaque tri et chaque changement de langue, et
  // des écoutes posées image par image seraient reposées à chaque fois, ou
  // oubliées sur celles qu'un rendu suivant fabrique.
  //
  // Les images seulement. La vidéo garde son menu : ses contrôles natifs en
  // dépendent, et les casser ne protégerait rien de plus.
  document.addEventListener('contextmenu', (e) => {
    if (e.target instanceof HTMLImageElement) e.preventDefault();
  });

  $('porteAction').addEventListener('click', sortirDeLaPorte);
  $('porteRetry').addEventListener('click', () => reprendreSiLaPorteEstOuverte({ dire: true }));
  $('suggestionAvis').addEventListener('click', () => ouvrirLAvis(state.avisADonner[0]));
  $('avisEnvoyer').addEventListener('click', envoyerLAvis);
  for (const choix of $('avisSignature').querySelectorAll('.signature__choix')) {
    choix.addEventListener('click', () => {
      state.avisEnCours.anonyme = choix.dataset.anonyme === 'oui';
      renderSignature();
      haptic('light');
    });
  }
  // La note de la fiche descend jusqu'aux avis : c'est ce qu'on attend d'une
  // note sur laquelle on peut appuyer.
  $('pNote').addEventListener('click', () => {
    $('pAvis').scrollIntoView({ behavior: anime() ? 'smooth' : 'auto', block: 'start' });
  });
  $('verifBrowse').addEventListener('click', () => {
    // Le serveur refuse la commande de toute façon : rien n'oblige à cacher
    // la boutique pendant que la pièce est examinée.
    $('verification').hidden = true;
    toast(t('msg.pieceEnAttente'));
  });
  $('findBtn').addEventListener('click', () => {
    const ouverte = !$('findBar').hidden;
    if (ouverte) replierLaRecherche();
    else {
      $('findBar').hidden = false;
      $('findBtn').setAttribute('aria-expanded', 'true');
      $('findInput').focus();
    }
    haptic('light');
  });

  $('findInput').addEventListener('input', () => {
    state.query = $('findInput').value;
    renderGrid();
  });
  $('findClear').addEventListener('click', () => {
    state.query = '';
    $('findInput').value = '';
    $('findInput').focus();
    renderGrid();
  });
  $('findSort').addEventListener('change', () => {
    state.sort = $('findSort').value;
    renderGrid();
  });
  $('pGalleryPrev').addEventListener('click', () => glisserGalerie(-1));
  $('pGalleryNext').addEventListener('click', () => glisserGalerie(1));

  $('commander').addEventListener('click', commanderCeProduit);
  $('panierBtn').addEventListener('click', () => { montrerLOnglet('panier'); haptic('light'); });
  $('panierCommander').addEventListener('click', passerLaCommande);
  $('promoApply').addEventListener('click', applyPromo);
  $('promoCode').addEventListener('keydown', (e) => e.key === 'Enter' && applyPromo());
  $('promoCode').addEventListener('input', () => {
    promoError = null;
    if (!$('promoCode').value.trim() && state.promo) {
      state.promo = null;
      showPromoStatus('', null);
      renderPanier();
    }
  });
  $('orderPostal').addEventListener('input', () => {
    state.zone = findZone($('orderPostal').value);
    renderPanier();
  });
  $('orderSlot').addEventListener('change', () => {
    state.slotId = $('orderSlot').value;
    renderPanier();
  });
  $('doneCommandes').addEventListener('click', () => {
    closeSheets();
    state.profilVue = 'commandes';
    montrerLOnglet('profil');
  });
  $('panierVider').addEventListener('click', () => {
    state.panier = [];
    ecrireLePanier();
    renderPanier();
    haptic('light');
  });
  $('panierVersBoutique').addEventListener('click', () => montrerLOnglet('catalogue'));
  $('commandeCopier').addEventListener('click', copierLeRecap);
  $('promoVoir').addEventListener('click', () => {
    choisirLeRayon('promos');
    $('gridTitre').scrollIntoView({ behavior: anime() ? 'smooth' : 'auto', block: 'start' });
  });
  $('profilContact').addEventListener('click', () => montrerLOnglet('contact'));
  $('farmRetour').addEventListener('click', () => { renderLesFarms(); haptic('light'); });
  $('sonBtn').addEventListener('click', basculerLeJuke);
  $('notifyMe').addEventListener('click', joinWaitlist);

  for (const el of document.querySelectorAll('[data-close]')) {
    el.addEventListener('click', closeSheets);
  }
  document.addEventListener('keydown', (e) => e.key === 'Escape' && revenirEnArriere());
}


/** Retire de l'interface ce que la boutique n'offre pas en ce moment. */
function applyFeatures() {
  // Le profil reste accessible même sans historique : il porte aussi les
  // favoris et les alertes, et chaque section dit elle-même si elle est éteinte.
  // Un onglet qui n'ouvre que des sections éteintes n'a rien à montrer : on
  // le retire de la barre, qui passe alors à trois colonnes toute seule.
  const profilVide =
    state.features.orderHistory === false &&
    state.features.favoris === false &&
    state.features.announcements === false;
  const ongletProfil = $('tabbar').querySelector('[data-onglet="profil"]');
  ongletProfil.hidden = profilVide;
  // Les favoris n'ont plus d'onglet : ils vivent dans Infos.
  const ongletFavoris = $('tabbar').querySelector('[data-onglet="favoris"]');
  if (ongletFavoris) ongletFavoris.hidden = state.features.favoris === false;
  const visibles = [...$('tabbar').querySelectorAll('.tabbar__item')].filter((b) => !b.hidden).length;
  $('tabbar').style.gridTemplateColumns = `repeat(${visibles}, 1fr)`;
  if (profilVide && state.onglet === 'profil') montrerLOnglet('catalogue');
  if (ongletFavoris?.hidden && state.onglet === 'favoris') montrerLOnglet('catalogue');
  // La recherche vit derrière la loupe de l'entête. Le réglage de la
  // boutique masque le bouton ; la rangée, elle, reste repliée tant qu'on
  // n'a pas appuyé dessus — et se replie si le vendeur coupe la fonction
  // pendant qu'elle est ouverte.
  // La recherche est toujours ouverte, sous l'en-tête ; le réglage de la
  // boutique la retire en entier.
  const coupee = state.features.search === false;
  $('findBar').hidden = coupee;
  if (coupee && state.query) {
    state.query = '';
    $('findInput').value = '';
  }
}

/**
 * Le bandeau d'état, avec le décompte jusqu'au prochain basculement.
 *
 * « Ouvert » tout seul ne dit rien d'utile : un client qui remplit son panier
 * veut savoir s'il a le temps de finir. Le décompte est relatif — rendu en
 * minutes par le serveur — parce que le téléphone du client peut être à
 * l'heure d'un autre fuseau, et qu'un « ferme dans 20 min » reste juste
 * partout.
 */
/**
 * Le titre du bandeau dit-il encore la vérité ?
 *
 * « Dispo maintenant » est une affirmation vérifiable, donc fausse dès que la
 * boutique ferme — treize heures par jour sur des horaires 13h–00h. Et elle
 * l'était juste au-dessus du bandeau d'état qui affichait « Boutique fermée » :
 * deux messages contraires sur le même écran, et c'est le plus gros qui
 * mentait.
 *
 * L'heure de retour vient du serveur, pas d'ici : le décompte qu'on reçoit est
 * en minutes et ne porte pas de fuseau, et l'ajouter à l'horloge du téléphone
 * donnerait l'heure de retour chez le client plutôt que chez le vendeur.
 */
function renderTitreDuBandeau() {
  const titre = $('heroTitre');
  if (!titre) return;

  if (state.opening?.open !== false) {
    titre.textContent = t('etat.dispo');
    return;
  }

  // Fermeture à la main, ou horaires coupés : le serveur ne promet aucune
  // heure, et on n'en invente pas une. Le bandeau d'état, lui, porte déjà le
  // message que le vendeur a écrit.
  titre.textContent = state.opening.retour
    ? `${t('etat.retourA')} ${state.opening.retour}`
    : t('etat.fermePourLInstant');
}

function renderStatut() {
  const bandeau = $('statutBar');

  // Sans horaires, l'état ne change pas : un bandeau qui répète « ouvert »
  // n'apprend rien et prend de la place.
  const prochain = state.opening.prochain;
  if (state.features.animations === false || state.blocked || !prochain) {
    bandeau.hidden = true;
    arreterLeDecompte();
    return;
  }

  bandeau.hidden = false;
  bandeau.classList.toggle('statut--ferme', !state.opening.open);
  $('statutTexte').textContent = t(state.opening.open ? 'etat.ouverte' : 'etat.fermee');

  // On retient l'instant du basculement plutôt que le nombre de minutes :
  // une Mini App reste ouverte des heures, et un compteur figé à l'arrivée
  // mentirait très vite.
  state.bascule = Date.now() + prochain.minutes * 60000;
  rafraichirLeDecompte();
  arreterLeDecompte();
  // Une fois par minute suffit : on n'affiche pas les secondes.
  state.decompte = setInterval(rafraichirLeDecompte, 30000);
}

function arreterLeDecompte() {
  if (state.decompte) clearInterval(state.decompte);
  state.decompte = null;
}

function rafraichirLeDecompte() {
  const reste = Math.round((state.bascule - Date.now()) / 60000);
  // Le verbe et sa durée voyagent ensemble : en anglais « closes in 2 h »,
  // en espagnol « cierra en 2 h » — l'ordre des mots n'est pas le même
  // partout, et coller un verbe traduit devant une durée traduite finirait
  // par produire des phrases que personne ne dit.
  const quand = state.opening.open ? 'etat.fermeDans' : 'etat.ouvreDans';

  if (reste <= 0) {
    // L'heure du basculement est passée : c'est au serveur de trancher, pas
    // à nous de deviner. On recharge le catalogue, qui porte l'état réel.
    $('statutCompte').textContent = '';
    arreterLeDecompte();
    refreshCatalog();
    return;
  }

  const heures = Math.floor(reste / 60);
  const minutes = reste % 60;
  const duree = heures
    ? `${heures} h${minutes ? ` ${minutes}` : ''}`
    : t('etat.minutes').replace('{n}', String(minutes));
  $('statutCompte').textContent = t(quand).replace('{duree}', duree);
}



/** Boutique fermée : on le dit, et on empêche la commande. */
function renderClosedBanner() {
  const banner = $('closedBanner');
  // Un compte bloqué passe devant l'horaire : c'est la vraie raison pour
  // laquelle ce client-là ne pourra pas commander, quelle que soit l'heure.
  if (state.blocked) {
    banner.textContent = t('etat.compteBloque');
    banner.hidden = false;
    return;
  }
  if (state.opening.open) {
    banner.hidden = true;
    return;
  }
  // Le message de fermeture appartient au vendeur : il le rend tel qu'il
  // l'a écrit, et seul le repli passe par le dictionnaire.
  banner.textContent = state.opening.message ?? t('etat.fermeeMessage');
  banner.hidden = false;
}

/* ── Vérification d'identité ─────────────────────────────── */

/**
 * Quand le vendeur l'exige, la boutique reste fermée tant que la pièce n'a
 * pas été validée. L'écran dit où on en est plutôt que de rester muet.
 */
/**
 * Ce que le serveur sait de ce client : blocage et vérification.
 *
 * Lu une fois et gardé : la porte de vérification et le bandeau de compte
 * bloqué en avaient besoin tous les deux, et deux appels pour la même
 * réponse feraient clignoter l'écran au démarrage.
 */
async function loadMe() {
  if (!tg?.initData) return null;
  try {
    const res = await fetch('/api/me', { headers: { 'X-Telegram-Init-Data': tg.initData } });
    if (!res.ok) return null;
    const me = await res.json();
    state.blocked = Boolean(me.blocked);
    renderClosedBanner();
    return me;
  } catch (err) {
    console.error(err);
    return null;
  }
}

/** @returns {boolean} vrai si le voile reste affiché. */
async function gateVerification() {
  const me = await loadMe();
  if (!state.gates.verification || !me) return false;

  const status = me.verification.status;
  if (status === 'approved') return false;

  const texts = {
    none: t('verif.texteAucune'),
    pending: t('verif.texteEnCours'),
    refused: t('verif.texteRefusee'),
  };
  const titles = {
    none: t('verif.titre'),
    pending: t('verif.titreEnCours'),
    refused: t('verif.titreRefusee'),
  };

  $('verifTitle').textContent = titles[status] ?? titles.none;
  $('verifText').textContent = texts[status] ?? texts.none;
  $('verification').hidden = false;
  return true;
}

/* ── Les quatre onglets ──────────────────────────────────── */

/**
 * Mesure la barre du bas, et le dit à la feuille de style.
 *
 * Deux choses se posent dessus : le corps de la page, qui doit s'arrêter
 * au-dessus, et la barre d'achat de la fiche produit. Une valeur écrite en
 * dur dans le CSS se trompe dès que le téléphone grossit le texte du système
 * ou que l'encoche change la marge basse — et la dernière carte du catalogue
 * finit sous les onglets, hors de portée.
 */
function mesurerLaBarre() {
  // `visualViewport` plutôt que `innerHeight` : dans la WebView de Telegram,
  // `innerHeight` compte une zone plus haute que ce qu'on voit réellement.
  // La barre se retrouvait alors placée trop haut, avec un vide sous elle —
  // et elle recouvrait la fin de la page.
  const bas = Math.round(window.visualViewport?.height ?? window.innerHeight);

  // Ce qu'on mesure, c'est la place prise depuis le bas de l'écran, pas la
  // hauteur de l'élément : depuis qu'ils flottent, il y a un vide sous eux,
  // et la hauteur seule laissait le contenu passer dans ce vide.
  // `offsetParent` ne dit rien d'un élément en `position: fixed` — il vaut
  // `null` pour tous, visibles ou non. S'en servir pour tester la visibilité
  // annulait donc les deux mesures, et les valeurs de secours prenaient la
  // main : la barre d'achat se posait trop haut et recouvrait la fin de la
  // fiche. C'est la hauteur réelle qui tranche.
  const place = (el) => {
    if (!el) return 0;
    const cadre = el.getBoundingClientRect();
    if (cadre.height <= 0) return 0;
    return Math.max(0, Math.round(bas - cadre.top));
  };

  const onglets = place($('tabbar'));
  if (onglets > 0) document.documentElement.style.setProperty('--tabbar-h', `${onglets}px`);

  // La barre d'achat de la fiche produit se mesure aussi, et pour la même
  // raison : la réserve écrite en dur sous la fiche ne tenait pas compte de
  // sa hauteur réelle, si bien que le dernier carrousel finissait dessous —
  // on voyait la vignette d'une suggestion, mais plus son nom.
  const achat = place($('pbar'));
  if (achat > 0) document.documentElement.style.setProperty('--pbar-h', `${achat}px`);
}



const ONGLETS = {
  catalogue: 'vueCatalogue',
  categories: 'vueCategories',
  farms: 'vueFarms',
  favoris: 'vueFavoris',
  panier: 'vuePanier',
  profil: 'vueProfil',
  // Le contact n'a plus d'onglet : on y entre depuis le compte.
  contact: 'vueContact',
};

/* La fiche produit est une vue de plus, mais pas un onglet : on y entre
   depuis une carte, jamais depuis la barre du bas. */
const VUES = { ...ONGLETS, produit: 'vueProduit' };

/**
 * Montre un écran, et un seul.
 *
 * Les quatre vues sont des sections voisines plutôt que quatre pages : la
 * grille garde alors sa position de défilement, ses images chargées et la
 * recherche en cours quand on va voir son profil et qu'on revient. Les
 * remonter à chaque aller-retour aurait fait clignoter tout l'écran pour
 * rien.
 *
 * Le défilement, lui, repart en haut : arriver au milieu d'un écran qu'on
 * vient d'ouvrir donne l'impression d'avoir raté le début.
 */
function montrerLOnglet(nom) {
  if (!VUES[nom]) nom = 'catalogue';
  const change = state.onglet !== nom;

  // D'où l'on vient, pour savoir où la flèche de la fiche doit ramener. On
  // ne retient qu'un onglet : revenir d'une fiche ouverte depuis une autre
  // fiche (par les suggestions du bas) doit rendre le catalogue, pas
  // remonter une pile de fiches que personne ne se rappelle avoir empilée.
  if (nom === 'produit' && state.onglet !== 'produit') state.retour = state.onglet;
  // Quitter la fiche coupe ses vidéos : une bande-son qui continue par-dessus
  // le catalogue laisse chercher d'où vient le bruit.
  if (change && state.onglet === 'produit') arreterLesVideos();

  state.onglet = nom;
  // La barre de commande occupe le bas de la fiche : la pastille monte
  // au-dessus plutôt que de disparaître dessous. Une classe explicite plutôt
  // qu'un sélecteur conditionnel en CSS — celui-ci se serait appuyé sur
  // `:has()`, que toutes les WebView ne servent pas encore.
  $('juke')?.classList.toggle('juke--haut', nom === 'produit');
  $('lpastille')?.classList.toggle('lpastille--haut', nom === 'produit');
  // Le panneau est ancré sur la pastille, qui monte ou descend selon la vue :
  // laissé ouvert, il se retrouverait décalé de la hauteur d'une barre.
  fermerLeMenu();

  for (const [clef, id] of Object.entries(VUES)) $(id).hidden = clef !== nom;
  for (const bouton of $('tabbar').querySelectorAll('.tabbar__item')) {
    bouton.setAttribute('aria-selected', String(bouton.dataset.onglet === nom));
  }
  placerLeCurseur();
  syncBackButton();

  // Chaque écran se remplit au moment où on le demande, pas au lancement :
  // le profil est un appel réseau, et les rayons un catalogue entier à
  // disposer. Les construire d'avance ralentirait l'ouverture de la boutique
  // pour deux écrans sur trois que le client n'ouvrira pas.
  // La barre d'achat ne vit plus dans la vue : c'est ici qu'on la montre et
  // qu'on la cache. Sa place change alors, et la réserve sous la fiche avec.
  $('pbar').hidden = nom !== 'produit';
  if (nom === 'produit') requestAnimationFrame(mesurerLaBarre);
  if (nom === 'categories') renderRayons();
  if (nom === 'favoris') ouvrirLesFavoris();
  if (nom === 'farms') renderLesFarms();
  if (nom === 'panier') renderPanier();
  if (nom === 'contact') renderContact();
  if (nom === 'profil') { renderContact(); ouvrirProfil(); }

  if (change) window.scrollTo({ top: 0, behavior: 'auto' });
}

/**
 * Pose le bloc de l'onglet actif, et le fait glisser vers le suivant.
 *
 * Un seul rectangle qui se déplace, et non quatre fonds qu'on allume et qu'on
 * éteint : quatre fonds ne peuvent pas glisser, et le saut d'un onglet à
 * l'autre ne dit pas d'où l'on vient. Ici le regard suit le bloc.
 *
 * Sur la fiche produit, aucun onglet n'est actif — le bloc s'efface plutôt que
 * de rester allumé sur « Filtres » pendant qu'on lit autre chose.
 */
function placerLeCurseur() {
  const curseur = $('tabbarCurseur');
  const actif = $('tabbar').querySelector('.tabbar__item[aria-selected="true"]');
  if (!curseur) return;

  if (!actif) {
    curseur.style.opacity = '0';
    return;
  }
  curseur.style.opacity = '1';
  // `offsetLeft` plutôt qu'une soustraction de positions à l'écran : les deux
  // se mesurent depuis le même bord — celui de la zone intérieure de la barre
  // — alors que retrancher les marges à la main laissait le bloc décalé de
  // l'épaisseur du filet.
  curseur.style.setProperty('--curseur-l', `${actif.offsetWidth}px`);
  curseur.style.setProperty('--curseur-x', `${actif.offsetLeft}px`);

  // Le premier placement ne glisse pas : voir le bloc traverser l'écran
  // depuis le bord gauche au lancement ferait croire à un défaut. On rend la
  // glissade au tour de boucle suivant, une fois la position posée.
  if (curseur.classList.contains('tabbar__curseur--pose')) {
    requestAnimationFrame(() => curseur.classList.remove('tabbar__curseur--pose'));
  }
}

/* ── Les rayons ──────────────────────────────────────────── */

/**
 * Le catalogue rangé par catégorie, chacune sous son intitulé.
 *
 * L'autre onglet répond à « je cherche ça » ; celui-ci répond à « montre-moi
 * ce que tu as ». Les produits sont les mêmes, et les cartes aussi — une
 * deuxième sorte de carte aurait voulu dire deux endroits à corriger le jour
 * où le prix s'affiche autrement.
 *
 * Une catégorie vide n'est pas montrée : un rayon avec zéro article dit au
 * client qu'on n'a rien, alors qu'on n'a simplement rien ici.
 */
function renderRayons() {
  const hote = $('rayons');
  const rayons = state.categories
    .filter((cat) => cat.id !== 'all')
    .map((cat) => ({ cat, produits: trier(state.products.filter((p) => p.category === cat.id)) }))
    .filter(({ produits }) => produits.length > 0);

  $('rayonsVide').hidden = rayons.length > 0;

  hote.replaceChildren(
    ...rayons.map(({ cat, produits }) => {
      const bloc = document.createElement('section');
      bloc.className = 'rayon';

      const tete = document.createElement('div');
      tete.className = 'rayon__tete';
      const nom = document.createElement('h2');
      nom.className = 'rayon__nom';
      nom.textContent = `${cat.emoji ?? ''} ${cat.label}`.trim();
      const compte = document.createElement('span');
      compte.className = 'rayon__compte';
      compte.textContent = produits.length > 1
        ? t('rayon.produits', { n: produits.length })
        : t('rayon.unProduit');
      tete.append(nom, compte);

      const grille = document.createElement('div');
      grille.className = 'rayon__grille';
      grille.append(...produits.map(productCard));

      bloc.append(tete, grille);
      return bloc;
    })
  );
}

/* ── Contact ─────────────────────────────────────────────── */

/**
 * L'écran « une question ? ».
 *
 * Il n'ouvre plus rien : il dit d'écrire sur Snapchat, et rappelle dessous
 * les horaires et le mode de retrait — précisément ce qu'on vient demander
 * quand on ne trouve pas la réponse, et qu'une réponse affichée coûte moins
 * cher qu'une réponse à écrire.
 */
function renderContact() {
  // Le pseudo du vendeur s'affichait ici — « tu écris à @… ». Il ne s'affiche
  // plus : une boutique ouverte à tous n'est pas l'endroit pour le publier.
  // L'écran ne fait plus que rappeler les horaires et le mode de retrait.
  const lignes = [];
  const ouvert = state.opening?.open !== false;
  lignes.push([ouvert ? '🟢' : '🔴', t(ouvert ? 'etat.ouverte' : 'etat.fermee'),
    // Le message de fermeture est écrit par le vendeur : on le rend tel quel,
    // comme les noms de produits. Seul le texte de repli est traduit.
    ouvert ? t('contact.onPrend') : (state.opening?.message ?? t('contact.onRouvre'))]);
  if (state.fulfillment?.pickup) lignes.push(['🤝', t('contact.retrait'), t('contact.retraitDetail')]);
  if (state.fulfillment?.delivery) lignes.push(['🛵', t('contact.livraison'), t('contact.livraisonDetail')]);
  lignes.push(['💶', t('contact.especes'), t('contact.especesDetail')]);

  const peindre = () => lignes.map(([emoji, titre, detail]) => {
      const ligne = document.createElement('div');
      ligne.className = 'contact__info';
      const icone = document.createElement('span');
      icone.setAttribute('aria-hidden', 'true');
      icone.textContent = emoji;
      const texte = document.createElement('span');
      const fort = document.createElement('b');
      fort.textContent = titre;
      texte.append(fort, document.createTextNode(` — ${detail}`));
      ligne.append(icone, texte);
      return ligne;
    });
  $('contactInfos').replaceChildren(...peindre());
  // Infos les montre aussi, en tête : c'est ce qu'on vient y chercher.
  $('infosBoutique')?.replaceChildren(...peindre());
}

/* ── La porte du bot ─────────────────────────────────────── */

/**
 * L'épreuve se passe dans la conversation, pas ici.
 *
 * Le bouton « Boutique » en bas à gauche du chat est posé pour tout le monde
 * d'un seul geste — Telegram ne sait pas le montrer aux uns et le cacher aux
 * autres. Quelqu'un qui n'a jamais écrit au bot pouvait donc entrer ici sans
 * avoir répondu au calcul. Le serveur refuse maintenant ses appels ; cet écran
 * lui dit pourquoi, et où aller.
 *
 * On ne rejoue pas le calcul dans la Mini App : deux épreuves pour une seule
 * porte, c'est une de trop, et celle du chat a l'avantage d'exister avant que
 * la boutique s'ouvre — c'est exactement ce qu'on veut garder.
 */
let sondeDeLaPorte = null;

/** @returns {boolean} vrai si le voile reste affiché. */
async function gatePorte() {
  if (!state.gates.porte || !tg?.initData) return false;
  const etat = await lireLaPorte();
  if (etat.ouverte) return false;

  peindreLaPorte(etat);
  $('porte').hidden = false;
  lancerLaSonde();
  return true;
}

/**
 * Ce que le voile raconte : la marche qui attend, et elle seule.
 *
 * Deux marches, un seul écran. Le serveur dit laquelle attend ; on remplace
 * les clefs de traduction des quatre textes et on repeint. Passer par
 * `data-t` plutôt que par `textContent` n'est pas une coquetterie : c'est ce
 * qui fait que changer de langue devant le voile — ce qui arrive, la liste
 * est sur l'écran d'accueil juste avant — retraduit la bonne marche et non
 * celle d'avant.
 */
function peindreLaPorte(etat) {
  const secours = etat.etape === 'secours';
  state.porteEtape = etat.etape ?? 'calcul';
  state.porteLien = etat.lien ?? '';

  const clefs = secours
    ? ['porte.entree', 'secours.porteTitre', 'secours.porteTexte', 'secours.porteFine',
       'secours.porteOuvrir', 'secours.porteReessayer']
    : ['porte.entree', 'porte.titre', 'porte.texte', 'porte.fine',
       'porte.ouvrir', 'porte.reessayer'];
  const cibles = ['porteEntree', 'porteTitre', 'porteTexte', 'porteFine',
    'porteAction', 'porteRetry'];
  cibles.forEach((id, rang) => {
    const el = $(id);
    if (!el) return;
    el.dataset.t = clefs[rang];
    el.textContent = t(clefs[rang]);
  });

  // Le compte des marches, s'il y en a plus d'une. Une seule, et la ligne
  // n'apprend rien : « étape 1 sur 1 » ne fait qu'ajouter un chiffre à lire.
  state.porteMarche = (etat.marches ?? 1) > 1
    ? { n: etat.marche ?? 1, total: etat.marches }
    : null;
  peindreLesMarches();
}

/**
 * « Étape 1 sur 2 », dans la langue du moment.
 *
 * À part, et rejouée à chaque changement de langue, parce que ce libellé
 * porte deux nombres : `data-t` ne sait rendre qu'une clef sans paramètre,
 * et un client qui change de langue devant le voile — la liste est sur
 * l'écran d'accueil, juste avant — lirait « Étape {n} sur {total} », en
 * toutes lettres.
 */
function peindreLesMarches() {
  const compte = $('porteMarches');
  if (!compte) return;
  const marche = state.porteMarche;
  compte.hidden = !marche;
  compte.textContent = marche ? t('porte.marches', { n: marche.n, total: marche.total }) : '';
}

/**
 * Le bouton du voile mène là où il faut aller.
 *
 * Pour le calcul, c'est la conversation du bot principal : la fermer suffit,
 * Telegram y ramène. Pour le bot de secours, c'est une AUTRE conversation —
 * fermer la boutique n'y mène pas, il faut l'ouvrir explicitement.
 */
function sortirDeLaPorte() {
  if (state.porteEtape === 'secours' && state.porteLien) {
    if (tg?.openTelegramLink) return tg.openTelegramLink(state.porteLien);
    return window.open(state.porteLien, '_blank', 'noopener');
  }
  return tg ? tg.close() : window.history.back();
}

/**
 * Demande au serveur si la porte est ouverte.
 *
 * Une panne ne vaut pas une ouverture : si la réponse ne vient pas, tout le
 * reste de l'API est injoignable de la même façon, et lever le voile ne
 * donnerait qu'une boutique où rien ne marche. On garde l'écran, avec de quoi
 * réessayer.
 */
async function lireLaPorte() {
  try {
    const res = await fetch('/api/porte', {
      headers: { 'X-Telegram-Init-Data': tg?.initData ?? '' },
    });
    if (!res.ok) return { ouverte: false };
    const etat = await res.json();
    return { ...etat, ouverte: etat.requise === false || etat.ouverte === true };
  } catch (err) {
    console.error(err);
    return { ouverte: false };
  }
}

/**
 * Guette l'instant où le calcul est fait.
 *
 * Le client répond dans le chat puis revient : s'il fallait qu'il ferme et
 * rouvre la boutique pour que l'écran change, la moitié l'abandonnerait là.
 * On regarde donc au retour d'onglet — le moment exact où ça vient d'arriver —
 * et toutes les cinq secondes tant que la page est visible, jamais quand elle
 * ne l'est pas : personne ne lit un écran caché, et la batterie non plus.
 */
function lancerLaSonde() {
  if (sondeDeLaPorte) return;
  sondeDeLaPorte = setInterval(() => {
    if (document.visibilityState === 'visible') reprendreSiLaPorteEstOuverte();
  }, 5000);
  document.addEventListener('visibilitychange', auRetourDeLaConversation);
}

function arreterLaSonde() {
  if (sondeDeLaPorte) clearInterval(sondeDeLaPorte);
  sondeDeLaPorte = null;
  document.removeEventListener('visibilitychange', auRetourDeLaConversation);
}

function auRetourDeLaConversation() {
  if (document.visibilityState === 'visible') reprendreSiLaPorteEstOuverte();
}

/**
 * Lève le voile si le calcul vient d'être fait, et remplit la boutique.
 *
 * @param {{dire?: boolean}} [options] `dire` fait répondre à un appui sur
 *   « J'ai répondu » même quand la porte est encore fermée : un bouton qui ne
 *   fait rien passe pour cassé.
 */
async function reprendreSiLaPorteEstOuverte({ dire = false } = {}) {
  if ($('porte').hidden) return true;
  const etat = await lireLaPorte();
  if (!etat.ouverte) {
    // La marche a pu changer pendant qu'il était parti : il revient du bot de
    // secours, et c'est le calcul qui l'attend maintenant. Sans ce repeignage,
    // l'écran lui redemanderait ce qu'il vient de faire.
    peindreLaPorte(etat);
    if (dire) toast(t(etat.etape === 'secours' ? 'msg.secoursEnAttente' : 'msg.calculEnAttente'));
    return false;
  }
  arreterLaSonde();
  $('porte').hidden = true;
  haptic('success');
  // Le séquenceur reprend où il s'était arrêté : l'épreuve de tuiles et la
  // vérification d'identité attendent derrière, et lui seul connaît l'ordre.
  runGates();
  return true;
}

/* ── Épreuve d'entrée ────────────────────────────────────── */

/** Rien à demander si l'épreuve est désactivée ou déjà passée aujourd'hui. */
async function gateCaptcha() {
  if (!state.gates.captcha || !tg?.initData) return false;
  if (readPass()) return false;
  await openCaptcha();
  return !$('captcha').hidden;
}

async function openCaptcha() {
  const error = $('captchaError');
  error.hidden = true;
  $('captcha').hidden = false;

  try {
    const res = await fetch('/api/captcha', {
      headers: { 'X-Telegram-Init-Data': tg?.initData ?? '' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const challenge = await res.json();

    if (!challenge.required) {
      $('captcha').hidden = true;
      return;
    }

    state.captcha = challenge;
    $('captchaSubmit').disabled = true;
    monterLePuzzle(challenge);
  } catch (err) {
    console.error(err);
    error.textContent = t('msg.verifIndispo');
    error.hidden = false;
  }
}

/**
 * Monte l'épreuve : l'image, le trou, la pièce.
 *
 * Le découpage se fait ici et non sur le serveur. Découper un JPEG côté
 * serveur demanderait une bibliothèque d'images installée sur le VPS, et une
 * épreuve d'entrée qui dépend d'un binaire absent est une boutique fermée. Le
 * navigateur, lui, sait recadrer une image d'un `background-position` négatif
 * — sans canvas, sans rien à charger.
 *
 * La contrepartie est écrite dans `server/captcha.js` : la position du trou
 * voyage jusqu'au client. C'est vrai de toutes les épreuves de ce genre — on
 * ne peut pas demander de viser sans montrer où. Ce qui est jugé, c'est le
 * geste autant que la position.
 */
function monterLePuzzle(epreuve) {
  const plateau = $('puzzlePlateau');
  const fond = $('puzzleFond');
  const trou = $('puzzleTrou');
  const piece = $('puzzlePiece');
  if (!plateau || !fond || !trou || !piece) return;

  const { largeur, hauteur, piece: cote, x, y } = epreuve;
  plateau.classList.remove('puzzle--gagne');
  plateau.style.width = `${largeur}px`;
  plateau.style.aspectRatio = `${largeur} / ${hauteur}`;
  fond.src = epreuve.image;

  for (const [el, gauche] of [[trou, x], [piece, 0]]) {
    el.style.width = `${cote}px`;
    el.style.height = `${cote}px`;
    el.style.top = `${y}px`;
    el.style.left = `${gauche}px`;
  }
  // La pièce montre le morceau d'image qui manque : c'est la même photo,
  // décalée de sa position dans le cadre.
  piece.style.backgroundImage = `url("${epreuve.image}")`;
  piece.style.backgroundSize = `${largeur}px ${hauteur}px`;
  piece.style.backgroundPosition = `${-x}px ${-y}px`;

  state.puzzle = { x: 0, max: largeur - cote, trace: [] };
  piece.style.transform = 'translateX(0px)';

  // Une seule fois : le plateau se remonte à chaque nouvelle épreuve, et
  // rebrancher à chaque fois ferait avancer la pièce de deux crans par geste.
  if (!piece.dataset.branche) {
    piece.dataset.branche = 'oui';
    brancherLaPiece(piece);
  }
}

/**
 * Le glissement, au doigt, à la souris et au clavier.
 *
 * Les événements « pointer » couvrent les trois d'un coup — pas de code
 * séparé pour le tactile et la souris, donc pas de moitié qui se met à
 * diverger. Le clavier n'est pas un extra : quelqu'un qui ne peut pas faire
 * glisser doit pouvoir entrer, et les flèches déplacent la pièce d'un pixel,
 * ou de dix avec une touche de plus.
 */
function brancherLaPiece(piece) {
  let prise = null;

  const poser = (valeur, instant = Date.now()) => {
    const p = state.puzzle;
    if (!p) return;
    p.x = Math.max(0, Math.min(p.max, Math.round(valeur)));
    piece.style.transform = `translateX(${p.x}px)`;
    // La trace sert au serveur à distinguer un geste d'un envoi direct. On
    // garde peu de points : ce qui compte est qu'il y en ait, et que ça ait
    // duré — pas la courbe exacte, qu'on ne saurait pas juger.
    if (p.trace.length < 60) p.trace.push({ t: instant, x: p.x });
    $('captchaSubmit').disabled = false;
  };

  piece.addEventListener('pointerdown', (ev) => {
    prise = { depart: ev.clientX, avant: state.puzzle?.x ?? 0 };
    state.puzzle.trace = [{ t: Date.now(), x: state.puzzle.x }];
    piece.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
  });
  piece.addEventListener('pointermove', (ev) => {
    if (!prise) return;
    poser(prise.avant + (ev.clientX - prise.depart));
  });
  for (const fin of ['pointerup', 'pointercancel']) {
    piece.addEventListener(fin, (ev) => {
      if (!prise) return;
      prise = null;
      piece.releasePointerCapture?.(ev.pointerId);
      haptic('light');
    });
  }

  piece.addEventListener('keydown', (ev) => {
    const pas = ev.shiftKey ? 10 : 1;
    if (ev.key === 'ArrowRight') poser((state.puzzle?.x ?? 0) + pas);
    else if (ev.key === 'ArrowLeft') poser((state.puzzle?.x ?? 0) - pas);
    else return;
    ev.preventDefault();
  });
}

async function submitCaptcha() {
  const button = $('captchaSubmit');
  const error = $('captchaError');
  button.disabled = true;
  error.hidden = true;

  try {
    const res = await fetch('/api/captcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData ?? '',
      },
      body: JSON.stringify({
        nonce: state.captcha.nonce,
        expiresAt: state.captcha.expiresAt,
        token: state.captcha.token,
        x: state.puzzle?.x ?? 0,
        trace: state.puzzle?.trace ?? [],
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      error.textContent = data.error ?? t('captcha.rate');
      error.hidden = false;
      haptic('light');
      // Nouvelle grille : sinon on rejoue la même jusqu'à tomber juste.
      await openCaptcha();
      return;
    }

    writePass(data.pass);
    $('captcha').hidden = true;
    haptic('success');
    // On repasse par le séquenceur plutôt que d'appeler la porte suivante :
    // lui seul connaît l'ordre, et ce qui attend derrière la dernière — une
    // fiche ouverte par un lien direct, par exemple. Le laissez-passer étant
    // écrit, les portes déjà franchies se contentent de se taire.
    await runGates();
  } catch (err) {
    console.error(err);
    error.textContent = t('msg.verifIndispo');
    error.hidden = false;
    button.disabled = false;
  }
}

function readPass() {
  try { return localStorage.getItem(PASS_KEY); } catch { return null; }
}

function writePass(pass) {
  try { localStorage.setItem(PASS_KEY, pass ?? ''); } catch {}
}

/**
 * Les portes d'entrée, une à la fois.
 *
 * Les trois écrans sont des voiles plein cadre au même niveau : les ouvrir
 * ensemble revenait à empiler la vérification par-dessus l'épreuve, qui
 * avalait alors tous les appuis — le client ne pouvait littéralement plus
 * entrer. Chacune appelle donc la suivante en se refermant.
 */
async function runGates() {
  if (await gateMobile()) return;
  if (gateAge()) return;
  if (await gatePorte()) return;

  // Passé la porte, les appels signés ont un sens, et c'est le bon moment :
  // les deux voiles qui restent empêchent de commander, pas de lire ses
  // commandes — le bouton « Regarder la boutique en attendant » le dit assez.
  chargerLaBoutiqueSignee();

  if (await gateCaptcha()) return;
  if (await gateVerification()) return;
  ouvrirProduitDemande();
}

/**
 * Le produit désigné par le lien qui a ouvert la boutique.
 *
 * Telegram remet le paramètre de `?startapp=` tel quel dans `start_param`.
 * Le `?p=` de l'URL sert de secours pour tester hors de Telegram — et pour
 * les clients qui ouvrent la boutique dans un navigateur.
 */
function produitDemande() {
  const param = tg?.initDataUnsafe?.start_param
    ?? new URLSearchParams(location.search).get('startapp')
    ?? '';
  return /^p_[A-Za-z0-9_-]+$/.test(param) ? param.slice(2) : null;
}

/**
 * Ouvre la fiche demandée, une fois les portes franchies.
 *
 * Un lien peut survivre à l'article qu'il désignait : retiré du catalogue,
 * masqué, renommé. Le client ne doit pas rester devant une boutique muette à
 * se demander si le QR a marché — on lui dit, et il reste dans le catalogue.
 */
function ouvrirProduitDemande() {
  const id = state.startProduct;
  if (!id) return;
  // Consommé une bonne fois : refermer la fiche ne doit pas la rouvrir à la
  // prochaine porte franchie.
  state.startProduct = null;

  const product = state.products.find((p) => p.id === id);
  if (!product) {
    toast(t('msg.articleParti'));
    return;
  }
  openProduct(product);
}

/** @returns {boolean} vrai si la porte reste ouverte. */
/* ── Le voile « téléphone uniquement » ───────────────────────
 *
 * CE QU'IL FAIT, ET CE QU'IL NE FAIT PAS.
 *
 * Il ferme la BOUTIQUE à qui n'ouvre pas depuis un téléphone. Il ne
 * ferme pas « le bot » : l'API de Telegram ne dit nulle part sur quel
 * appareil se trouve celui qui écrit au bot. Un message n'emporte pas
 * cette information, et aucune commande ne peut donc la lire. Seule une
 * Mini App la connaît, parce que le client Telegram la lui passe à
 * l'ouverture.
 *
 * Et elle la passe HORS de la signature : `initData` — la partie signée,
 * celle que le serveur vérifie — ne contient pas la plateforme. Elle
 * arrive à côté, en clair. Quelqu'un qui sait ouvrir les outils de
 * développement d'un navigateur peut donc se déclarer « android » et
 * entrer. Ce voile décourage, il n'interdit pas : c'est une consigne
 * d'usage, pas un verrou, et le présenter autrement serait mentir.
 *
 * On LISTE les plateformes qui passent au lieu d'énumérer celles qu'on
 * refuse : un client Telegram nouveau, ou un identifiant qu'on ne
 * connaît pas encore, doit être arrêté plutôt que laissé entrer.
 */
const TELEPHONES = new Set(['android', 'android_x', 'ios']);

/** Vrai si l'on peut raisonnablement parler d'un téléphone. */
function surUnTelephone() {
  const plateforme = String(tg?.platform ?? '').toLowerCase();
  if (plateforme) return TELEPHONES.has(plateforme);

  // Hors de Telegram, il n'y a pas de plateforme à lire. On se rabat sur
  // ce que le navigateur dit de l'appareil : un doigt plutôt qu'une
  // souris, et un écran étroit. C'est grossier, et ça ne sert qu'à ne
  // pas fermer la porte au nez de quelqu'un qui ouvre le lien depuis
  // son téléphone, hors de l'application.
  const doigt = window.matchMedia?.('(pointer: coarse)').matches === true;
  return doigt && window.innerWidth <= 820;
}

/**
 * L'administrateur passe toujours.
 *
 * Il teste sa boutique depuis son ordinateur, et se faire refuser
 * l'entrée de son propre magasin serait absurde. On ne lui demande rien :
 * une route admin répond 200 à qui en a les clés et 403 à tous les
 * autres, ce qui suffit à trancher — et c'est le serveur qui tranche,
 * sur la signature, pas le navigateur sur une valeur qu'il a écrite
 * lui-même.
 *
 * L'appel n'a lieu QUE sur un appareil refusé : un client sur téléphone
 * n'y passe jamais.
 */
async function laBoutiqueMAppartient() {
  if (!tg?.initData) return false;
  try {
    const res = await fetch('/api/admin/settings', {
      headers: { 'X-Telegram-Init-Data': tg.initData },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function gateMobile() {
  const voile = $('mobilegate');
  const laisserEntrer = () => {
    voile.hidden = true;
    document.body.classList.remove('verrouille');
    return false;
  };
  if (state.features.mobileSeulement === false || surUnTelephone()) return laisserEntrer();
  if (await laBoutiqueMAppartient()) return laisserEntrer();

  // La boutique est masquée en plus d'être recouverte : rien d'elle ne
  // reste à l'écran, et aucun de ses boutons n'est atteignable.
  //
  // Ce n'est pas un verrou, et il ne faut pas le lire comme tel. Les
  // fiches restent dans la page, et `/api/catalog` se lit sans aucune
  // signature : qui sait ouvrir les outils d'un navigateur voit le
  // catalogue de toute façon. Ce voile dit « pas ici, prends ton
  // téléphone » — c'est une consigne d'usage, et elle tient pour qui ne
  // cherche pas à la contourner.
  document.body.classList.add('verrouille');
  voile.hidden = false;
  return true;
}

function gateAge() {
  // Appelée avant le catalogue au premier affichage : sans réponse du serveur
  // on garde la porte fermée, plus prudent que de l'ouvrir par défaut.
  if (state.features.ageGate === false) {
    $('agegate').hidden = true;
    return false;
  }
  let confirmed = false;
  try { confirmed = localStorage.getItem(AGE_KEY) === '1'; } catch {}
  $('agegate').hidden = confirmed;
  return !confirmed;
}

/* ── Rendu ───────────────────────────────────────────────── */

/**
 * « Explore le catalogue » : les rayons en pastilles. « ✦ Tout » en tête,
 * puis chaque catégorie, puis « Promos » dès qu'un produit est en promo.
 * Le haut de page porte aussi les deux chiffres et les farms : ils se
 * peignent ici, avec le reste de la vitrine.
 */
function renderCategories() {
  const nav = $('cats');
  const pastilles = [
    { id: 'all', label: t('o68.tout'), signe: '✦' },
    ...state.categories.filter((cat) => cat.id !== 'all').map((cat) => ({ ...cat, signe: '◆' })),
  ];
  if (plusFortePromo(state.products) > 0) pastilles.push({ id: 'promos', label: t('vitrine.promos'), signe: '🔥' });
  nav.replaceChildren(
    ...pastilles.map((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pastille';
      btn.setAttribute('aria-pressed', String(cat.id === state.category));
      btn.textContent = `${cat.signe} ${cat.label}`;
      btn.addEventListener('click', () => choisirLeRayon(cat.id));
      return btn;
    })
  );
  $('chiffreRefs').textContent = String(state.products.length);
  $('chiffreFarms').textContent = String(state.farms.length);
  renderLePisteDesFarms();
  renderPromo();
}

const farmDe = (id) => (id ? state.farms.find((f) => f.id === id) ?? null : null);
const produitsDeLaFarm = (id) => state.products.filter((p) => p.farm === id);

/** Le logo rond d'une farm, ou ses initiales quand elle n'en a pas. */
function logoDeFarm(farm, classe = 'farm-logo') {
  const rond = document.createElement('span');
  rond.className = classe;
  rond.setAttribute('aria-hidden', 'true');
  if (farm?.logo) {
    const img = document.createElement('img');
    img.src = farm.logo;
    img.alt = '';
    img.loading = 'lazy';
    rond.append(img);
  } else {
    rond.textContent = farm
      ? farm.label.split(/\s+/).map((m) => m[0]).join('').slice(0, 2).toUpperCase()
      : '✦';
  }
  return rond;
}

function carteDeFarm(farm, { choisie = false, auClic }) {
  const carte = document.createElement('button');
  carte.type = 'button';
  carte.className = 'farm-carte';
  carte.setAttribute('aria-pressed', String(choisie));
  carte.append(logoDeFarm(farm));
  const nom = document.createElement('span');
  nom.className = 'farm-carte__nom';
  nom.textContent = farm ? farm.label : t('o68.toutesLesFarms');
  const compte = document.createElement('span');
  compte.className = 'farm-carte__compte';
  const n = farm ? produitsDeLaFarm(farm.id).length : state.products.length;
  compte.textContent = n === 1 ? t('vitrine.unArticle') : t('vitrine.articles', { n });
  carte.append(nom, compte);
  carte.addEventListener('click', auClic);
  return carte;
}

/** Le carrousel de l'accueil : « Toutes », puis chaque farm. */
function renderLePisteDesFarms() {
  const section = $('farmsSection');
  section.hidden = state.farms.length === 0;
  if (section.hidden) return;
  $('farmsCompte').textContent = t('o68.nFarms', { n: state.farms.length });
  const choisir = (id) => () => {
    state.farm = id;
    haptic('light');
    renderCategories();
    renderGrid();
    $('gridTitre').scrollIntoView({ behavior: anime() ? 'smooth' : 'auto', block: 'start' });
  };
  $('farmsPiste').replaceChildren(
    carteDeFarm(null, { choisie: !state.farm, auClic: choisir(null) }),
    ...state.farms.map((farm) => carteDeFarm(farm, { choisie: state.farm === farm.id, auClic: choisir(farm.id) }))
  );
}

/** L'onglet Farms : toutes les farms, puis la page de celle qu'on touche. */
function renderLesFarms(id = null) {
  const farm = farmDe(id);
  $('farmsListe').hidden = Boolean(farm);
  $('farmPage').hidden = !farm;
  if (!farm) {
    $('farmsCompteVue').textContent = t('o68.nFarms', { n: state.farms.length });
    $('farmsVide').hidden = state.farms.length > 0;
    $('farmsGrille').replaceChildren(
      ...state.farms.map((f) => carteDeFarm(f, { auClic: () => { haptic('light'); renderLesFarms(f.id); window.scrollTo(0, 0); } }))
    );
    return;
  }
  const produits = produitsDeLaFarm(farm.id);
  $('farmPageLogo').replaceWith(Object.assign(logoDeFarm(farm, 'farm-logo farm-logo--grand'), { id: 'farmPageLogo' }));
  $('farmPageNom').textContent = farm.label;
  $('farmPageCompte').textContent = produits.length === 1 ? t('vitrine.unArticle') : t('vitrine.articles', { n: produits.length });
  $('farmPageGrille').replaceChildren(...produits.map(productCard));
}

function choisirLeRayon(id) {
  state.category = id;
  haptic('light');
  renderCategories();
  renderGrid();
}

/**
 * Le bandeau promo. Il ne paraît que s'il y a vraiment des offres : allumé
 * sur un catalogue sans promo, « Voir les offres » ne montrerait rien.
 */
function renderPromo() {
  const bandeau = $('promoBandeau');
  if (!bandeau) return;
  const max = plusFortePromo(state.products);
  bandeau.hidden = !(state.promoBandeau?.actif !== false && max > 0);
  if (bandeau.hidden) return;
  $('promoTitre').textContent = state.promoBandeau?.titre?.trim() || t('promo.titreAuto', { n: max });
}

function renderGrid() {
  const grid = $('grid');
  const cherche = state.features.search !== false;
  const list = trier(
    state.products
      .filter((p) => state.category === 'all'
        || (state.category === 'promos' ? Number(p.remise) > 0 : p.category === state.category))
      .filter((p) => !state.farm || p.farm === state.farm)
      .filter((p) => !cherche || correspond(p, state.query))
  );

  $('findClear').hidden = !state.query;
  // La zone a peut-être servi à annoncer une panne : on la remet en simple
  // ligne de texte avant de s'en servir.
  const zone = $('empty');
  if (zone.childElementCount) zone.replaceChildren();
  zone.hidden = list.length > 0;
  // Le message d'absence doit dire de quoi il parle : « rien dans cette
  // catégorie » quand on cherche « banane » enverrait chercher au mauvais endroit.
  $('empty').textContent = state.query
    ? t('catalogue.rienNeCorrespond').replace('{mot}', state.query.trim())
    : t('catalogue.videCategorie');

  // Le titre de la grille dit ce qu'elle montre, et combien.
  const rayon = state.categories.find((c) => c.id === state.category);
  const farm = farmDe(state.farm);
  $('gridTitre').textContent = [
    farm?.label,
    state.category === 'promos' ? t('vitrine.promos') : state.category !== 'all' ? rayon?.label : null,
  ].filter(Boolean).join(' · ') || t('vitrine.tous');
  $('gridCompte').textContent = list.length === 1 ? t('vitrine.unArticle') : t('vitrine.articles', { n: list.length });

  const cartes = list.map(productCard);

  // Chaque carte porte son rang : le CSS en tire le décalage de la cascade.
  // Le rang est plafonné, sinon la trentième carte d'un gros catalogue
  // attendrait plus d'une seconde avant de paraître.
  if (anime()) {
    cartes.forEach((carte, rang) => {
      carte.style.setProperty('--rang', String(Math.min(rang, 12)));
      carte.classList.add('card--entre');
    });
  }

  arreterLesVideosDeLaGrille(grid);
  grid.replaceChildren(...cartes);
}

/**
 * Détache les vidéos de la grille qu'on s'apprête à remplacer.
 *
 * Un élément retiré du document peut continuer à charger sa source : on coupe
 * la lecture et on détache l'adresse, comme pour la galerie d'une fiche.
 */
function arreterLesVideosDeLaGrille(grid) {
  for (const video of grid.querySelectorAll('.card__video')) {
    regardSurLaGrille?.unobserve(video);
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}

/**
 * Le produit répond-il à la recherche ?
 *
 * On cherche dans le nom, l'accroche, les étiquettes et la description, sans
 * accents ni casse : personne ne tape « Néon » avec l'accent sur un clavier de
 * téléphone. Chaque mot doit se retrouver quelque part, dans n'importe quel
 * ordre — « kush banane » et « banane kush » trouvent la même chose.
 */
function correspond(produit, requete) {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  if (!mots.length) return true;

  const foin = normaliser(
    [produit.name, produit.short, produit.description, produit.badge, ...(produit.tags ?? [])].join(' ')
  );
  return mots.every((mot) => foin.includes(mot));
}

function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function trier(produits) {
  const copie = [...produits];
  switch (state.sort) {
    case 'price-asc':
      return copie.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copie.sort((a, b) => b.price - a.price);
    case 'name':
      return copie.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    case 'new':
      // Sans date, un produit passe pour ancien : mieux vaut le laisser en bas
      // que le faire remonter en tête des nouveautés.
      return copie.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    default:
      // Ordre du catalogue, mais les articles épuisés glissent en fin de liste :
      // ils ne doivent pas occuper le haut de la vitrine.
      return copie.sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)));
  }
}

/**
 * La vidéo à montrer dans la grille, s'il y en a une à montrer.
 *
 * Un produit dont la galerie ne contient que des vidéos n'avait rien à mettre
 * en vitrine : la grille gardait le dessin par défaut, et rien n'annonçait au
 * client qu'une vidéo l'attendait sur la fiche. On prend donc la première
 * vidéo — mais seulement faute de photo. Une photo posée par le vendeur est une
 * décision ; un dessin n'est qu'un pis-aller.
 */
/**
 * La photo à montrer pour un produit, quand il en a une.
 *
 * Deux endroits portent une image : le champ « photo » de la fiche, que le
 * vendeur choisit dans une liste, et la galerie, où il dépose ce qu'il
 * photographie lui-même. Seul le premier alimentait la vignette du
 * catalogue — si bien qu'un produit dont le vendeur avait importé trois
 * belles photos continuait de s'afficher avec le dessin par défaut, et il
 * fallait ouvrir la fiche pour voir la marchandise.
 *
 * L'ordre est celui de l'intention : une photo choisie dans le champ est une
 * décision, la première de la galerie en est une aussi, le dessin n'est qu'un
 * pis-aller.
 *
 * @returns {string|null} l'adresse d'une vraie photo, ou `null` s'il n'y en a
 *   aucune — auquel cas le dessin par défaut reprend sa place.
 */
/**
 * Un GIF animé arrive par deux chemins, et les deux ne se lisent pas pareil.
 *
 * Déposé au bot, Telegram le convertit en MP4 muet : c'est une balise vidéo
 * qu'il faut, et un navigateur ne décode pas un GIF dans une balise vidéo.
 * Collé par le vendeur sous forme d'adresse, c'est resté un vrai fichier GIF :
 * là c'est une image, et elle s'anime toute seule sans qu'on s'en mêle.
 *
 * Se tromper de balise donne un cadre noir dans un cas et un cadre vide dans
 * l'autre — deux pannes muettes.
 */
function estUnFichierGif(media) {
  return /\.gif($|[?#])/i.test(String(media?.url ?? ''));
}

function photoDeVitrine(product) {
  if (isPhoto(product.image)) return product.image;

  const medias = Array.isArray(product.media) ? product.media : [];
  const rang = medias.findIndex((m) => m.kind === 'photo');
  if (rang === -1) return null;
  return medias[rang].url ?? `/api/media/${product.id}/${rang}`;
}

function videoDeVitrine(product) {
  if (isPhoto(product.image)) return null;

  const medias = Array.isArray(product.media) ? product.media : [];
  if (medias.some((m) => m.kind === 'photo')) return null;

  // Un GIF passe devant une vidéo : il boucle de lui-même, sans bouton ni
  // son, et c'est précisément ce qu'on veut d'une vignette de catalogue qui
  // bouge. Une vidéo, elle, a toujours l'air d'attendre qu'on la lance.
  const rangGif = medias.findIndex((m) => m.kind === 'gif');
  const rang = rangGif === -1 ? medias.findIndex((m) => m.kind === 'video') : rangGif;
  if (rang === -1) return null;

  const media = medias[rang];
  return {
    // `image` dit à la carte de poser une balise image plutôt qu'une vidéo :
    // un vrai fichier GIF ne se décode pas dans un lecteur vidéo, et la
    // vignette serait restée noire.
    image: estUnFichierGif(media),
    url: media.url ?? `/api/media/${product.id}/${rang}`,
    poster: posterDe(product, media, rang),
  };
}

/**
 * Fait peindre à la vignette vidéo sa propre première image.
 *
 * Le défaut qu'elle corrige, et il est subtil : l'attribut `poster` ne
 * disparaît PAS quand la vidéo est chargée. Tant que la lecture n'a jamais
 * commencé, le navigateur garde le poster affiché — vérifié, une vidéo
 * entièrement décodée (`readyState` à 4) montrait toujours le dessin de
 * secours. La carte annonçait donc une vidéo et affichait un dessin.
 *
 * Un déplacement, même d'un vingtième de seconde, lève ce drapeau : le
 * navigateur remplace le poster par l'image réelle. C'est le seul geste qui
 * y parvienne sans lancer la lecture — et lancer la lecture d'une douzaine
 * de vidéos dans une grille de catalogue est hors de question.
 *
 * Le poster reste posé : il tient la place pendant le chargement, et c'est
 * bien mieux qu'un rectangle noir. Il cède dès qu'il y a mieux à montrer.
 */
function peindreLaPremiereImage(video) {
  if (!video) return;
  const avancer = () => {
    // 0.05 s et non 0 : remettre `currentTime` à la valeur qu'il a déjà
    // n'est pas un déplacement, et le navigateur garderait son poster.
    try { video.currentTime = 0.05; } catch { /* source illisible */ }
  };
  // `loadeddata` plutôt que `loadedmetadata` : à la seconde, la durée est
  // connue mais aucune image ne l'est, et le déplacement n'aurait rien à
  // peindre. L'écoute se retire d'elle-même — la grille se repeint souvent.
  if (video.readyState >= 2) avancer();
  else video.addEventListener('loadeddata', avancer, { once: true });
}

/**
 * L'image à montrer en attendant que la vidéo arrive.
 *
 * Une vidéo de plusieurs mégaoctets met le temps qu'il faut, et sans `poster`
 * le cadre reste noir pendant ce temps-là : le client croit la boutique en
 * panne. Telegram fabrique justement une vignette de quelques kilo-octets pour
 * chaque vidéo qu'on lui confie — elle arrive tout de suite. À défaut,
 * l'illustration du produit tient la place : n'importe quoi vaut mieux qu'un
 * rectangle vide.
 */
function posterDe(product, media, rang) {
  if (media.apercu || media.thumbFileId) return `/api/media/${product.id}/${rang}/apercu`;
  return product.image || '';
}

/**
 * Les vidéos de la grille ne tournent que sous les yeux du client.
 *
 * Une carte hors écran qui continue de jouer dépense des données et de la
 * batterie pour rien. L'observateur est unique et survit aux rendus : une carte
 * retirée de la grille cesse d'être observée d'elle-même.
 */
const regardSurLaGrille =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entrees) => {
          for (const entree of entrees) {
            if (entree.isIntersecting && anime()) entree.target.play().catch(() => {});
            else entree.target.pause();
          }
        },
        { threshold: 0.4 }
      )
    : null;

/**
 * Cette mention mérite-t-elle l'étoile ?
 *
 * L'étoile dit « c'est ce qui se vend le mieux ». Posée aussi sur « NOUVEAU »
 * et sur « -15 % », elle ne disait plus rien : trois mentions différentes
 * sous le même signe finissent par n'en désigner aucune. Elle est donc
 * réservée à la vedette, et les autres pastilles n'ont que leur mot.
 *
 * La reconnaissance se fait sur le libellé, faute de champ dédié : on retire
 * les accents, la casse et les espaces en trop, et on accepte le singulier
 * comme le pluriel. « Top Ventes » et « TOP VENTE » marchent donc tous les
 * deux. Le jour où le rang mérite sa propre case dans le panneau d'admin,
 * c'est cette fonction qui disparaît.
 */
function estUneVedette(badge) {
  const mot = String(badge ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return /^top ventes?$/.test(mot);
}

function productCard(product) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.setAttribute('aria-label', product.name);

  const soldOut = isSoldOut(product);
  if (soldOut) card.classList.add('card--soldout');

  const remise = Number(product.remise) || 0;
  // En haut à gauche : la promo d'abord, c'est elle qui fait acheter ; à
  // défaut, la pastille du vendeur (« Nouveau », « Top vente ») ou l'épuisé.
  const pastille = soldOut ? t('catalogue.epuise') : remise ? `-${remise}%` : product.badge;
  const video = videoDeVitrine(product);
  const note = noteDe(product);
  const photo = video ? null : photoDeVitrine(product);
  const visuel = video?.image
    ? `<img class="card__gif" src="${escapeHtml(video.url)}" alt="" loading="lazy">`
    : video
      ? `<video class="card__video" src="${escapeHtml(video.url)}" poster="${escapeHtml(video.poster)}"
               muted loop playsinline
               preload="metadata" disablepictureinpicture tabindex="-1" aria-hidden="true"></video>
         <span class="card__film" aria-hidden="true">▶</span>`
      : `<img src="${escapeHtml(photo ?? product.image)}" alt="" loading="lazy">`;

  // Au-dessus du nom : la farm, sinon le rayon.
  const rayon = farmDe(product.farm) ?? state.categories.find((c) => c.id === product.category);
  const appel = prixDAppel(product);
  const prix = `${appel.plusieurs ? `<small>${escapeHtml(t('carte.des'))}</small> ` : ''}${escapeHtml(formatPrice(appel.prix))}`;
  const avant = appel.avant ? `<s class="card__avant">${escapeHtml(formatPrice(appel.avant))}</s>` : '';

  card.innerHTML = `
    <div class="card__art${video ? ' card__art--video' : photo ? ' card__art--photo' : ''}">
      ${pastille ? `<span class="card__badge ${soldOut ? 'card__badge--out' : ''} ${remise && !soldOut ? 'card__badge--promo' : ''} ${estUneVedette(pastille) ? 'card__badge--etoile' : ''}">${escapeHtml(pastille)}</span>` : ''}
      ${visuel}
    </div>
    <div class="card__body">
      ${rayon ? `<span class="card__rayon">${escapeHtml(rayon.label)}</span>` : ''}
      <span class="card__name">${escapeHtml(product.name)}</span>
      <span class="card__short">${escapeHtml(product.short ?? '')}</span>
      <span class="card__note">${note
        ? `<span class="card__etoiles">${etoiles(note.moyenne)}</span> ${Number(note.moyenne).toFixed(1)} <small>(${note.nombre})</small>`
        : `<small>${escapeHtml(t('carte.sansAvis'))}</small>`}</span>
      <span class="card__bas">
        <span class="card__prix">${avant}<b>${prix}</b></span>
      </span>
    </div>`;

  peindreLaPremiereImage(card.querySelector('.card__video'));

  // Le cœur et son compte, sur l'image : atteignable au pouce sans ouvrir la
  // fiche. Le compte est celui de tous les clients, le sien compris.
  if (state.features.favoris !== false && tg?.initData) {
    const coeur = document.createElement('button');
    coeur.type = 'button';
    coeur.className = 'card__coeur';
    peindreLeCoeurDeCarte(coeur, product.id);
    coeur.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const avant = estFavori(product.id);
      const apres = await basculerFavori(product.id);
      if (apres !== avant) state.coeurs[product.id] = Math.max(0, (state.coeurs[product.id] ?? 0) + (apres ? 1 : -1));
      peindreLeCoeurDeCarte(coeur, product.id);
    });
    card.querySelector('.card__art').append(coeur);
  }

  // Le bouton vert : ajoute d'un appui quand il n'y a rien à choisir, et
  // ouvre la fiche quand il faut d'abord choisir un format.
  if (!soldOut) {
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'card__ajout';
    plus.setAttribute('aria-label', t('carte.ajouter'));
    plus.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6.4" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/></svg>';
    plus.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const { variantId, aChoisir } = formatParDefaut(product);
      if (aChoisir) return openProduct(product);
      ajouterAuPanier(product, variantId);
    });
    card.querySelector('.card__bas').append(plus);
  }

  const lecteur = card.querySelector('.card__video');
  if (lecteur) {
    lecteur.muted = true;
    if (regardSurLaGrille) regardSurLaGrille.observe(lecteur);
    else if (anime()) lecteur.play().catch(() => {});
  }

  card.addEventListener('click', () => openProduct(product));
  return card;
}

function peindreLeCoeurDeCarte(bouton, id) {
  peindreLeCoeur(bouton, id);
  const n = state.coeurs?.[id] ?? 0;
  bouton.innerHTML = `<span aria-hidden="true">♥</span> <b>${n}</b>`;
}

function openProduct(product) {
  state.current = product;
  // On présélectionne le premier format encore disponible plutôt que le premier tout court.
  state.currentVariant = product.variants
    ? (product.variants.find((v) => Number(v.stock ?? 0) > 0) ?? product.variants[0]).id
    : null;
  state.currentQty = 1;

  $('pName').textContent = product.name;
  peindreLaDescription(product.description);
  renderPoints(product);

  $('pTags').replaceChildren(
    ...(product.tags ?? []).map((t) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      return span;
    })
  );

  const coeur = $('pCoeur');
  coeur.hidden = state.features.favoris === false || !tg?.initData;
  if (!coeur.hidden) peindreLeCoeur(coeur, product.id);

  renderVariants();
  majBarreDeCommande();
  // Chaque fiche repart repliée : « voir tous les avis » d'un produit n'a pas à
  // décider de l'affichage du suivant.
  state.avisTousVisibles = false;
  chargerLesAvis(product);
  renderSuggestions(product);

  // Les feuilles ouvertes se referment : arriver sur une fiche avec le panier
  // encore déployé par-dessus n'aurait aucun sens.
  closeSheets();
  montrerLOnglet('produit');
  $('pRetourTexte').textContent = libelleDuRetour();

  // La galerie se monte après l'affichage, et non avant : la fermeture des
  // feuilles détache les vidéos — elle vidait donc la galerie qu'on venait
  // tout juste de construire.
  renderGalerie(product);
  // Et elle s'ouvre sur la photo du format présélectionné, quand il en a une.
  // Le report d'un tour de boucle laisse la feuille prendre sa largeur : un
  // défilement calculé sur une piste encore à zéro n'irait nulle part.
  if (state.currentVariant) {
    requestAnimationFrame(() => montrerLeMediaDuFormat(state.currentVariant));
  }
  haptic('light');
}

/**
 * L'anneau qui tourne pendant qu'une vidéo se charge, et sa durée.
 *
 * Une vidéo de plusieurs mégaoctets sur un réseau de téléphone met le temps
 * qu'elle met. La vignette tient la place, mais elle ne dit rien : le client
 * appuie sur lecture, rien ne bouge, et il croit la vidéo cassée — alors
 * qu'elle arrive. L'anneau dit qu'elle arrive.
 *
 * Quatre événements suffisent à couvrir tous les cas, et ils sont tous posés
 * avant que la source ne soit lue à fond : `canplay` et `playing` pour
 * l'effacer, `waiting` pour le remettre quand la lecture se vide en cours de
 * route, `error` pour cesser de faire attendre devant une vidéo qui ne
 * viendra pas. Une vidéo déjà en cache ne déclenche parfois aucun des deux
 * premiers : on regarde donc aussi l'état au montage.
 *
 * La durée s'affiche dès que les métadonnées arrivent — quelques kilo-octets,
 * bien avant l'image. Savoir qu'on s'engage dans neuf secondes ou dans deux
 * minutes change la décision d'appuyer.
 */
function voileDeChargement(video) {
  const voile = document.createElement('span');
  voile.className = 'vcharge';
  voile.setAttribute('aria-hidden', 'true');

  const anneau = document.createElement('span');
  anneau.className = 'vcharge__arc';
  const duree = document.createElement('span');
  duree.className = 'vcharge__duree';
  duree.hidden = true;
  voile.append(anneau, duree);

  const montrer = () => voile.classList.remove('vcharge--fini');
  const cacher = () => voile.classList.add('vcharge--fini');

  video.addEventListener('canplay', cacher);
  video.addEventListener('playing', cacher);
  video.addEventListener('waiting', montrer);
  // Une vidéo injoignable ne doit pas laisser tourner l'anneau indéfiniment :
  // le client attendrait quelque chose qui n'arrive pas.
  video.addEventListener('error', cacher);
  // Tous les conteneurs ne portent pas leur durée : un WebM produit à la
  // volée annonce volontiers `Infinity`. Dans ce cas on ne montre rien —
  // « 0:00 » sur une vidéo d'une minute est pire que pas de durée du tout.
  video.addEventListener('loadedmetadata', () => {
    const lisible = enMinutes(video.duration);
    duree.hidden = lisible === null;
    if (lisible) duree.textContent = lisible;
  });

  // HAVE_CURRENT_DATA : la vidéo était déjà en mémoire, aucun événement ne
  // viendra. Sans cette ligne, l'anneau tournait pour toujours au deuxième
  // passage sur la même fiche.
  if (video.readyState >= 2) cacher();

  return voile;
}

/** « 1:07 », ou `null` quand le fichier ne dit pas combien il dure. */
function enMinutes(secondes) {
  if (!Number.isFinite(secondes) || secondes <= 0) return null;
  const entier = Math.round(secondes);
  return `${Math.floor(entier / 60)}:${String(entier % 60).padStart(2, '0')}`;
}

/**
 * Les deux carrousels du bas de fiche : « même catégorie » et « tu vas aimer ».
 *
 * Tous les deux sortent du catalogue déjà en mémoire. Une suggestion ne vaut
 * pas un aller-retour réseau : si elle arrive après que le client a fait
 * défiler jusqu'en bas, elle arrive trop tard, et si elle le fait attendre,
 * elle lui a coûté plus qu'elle ne lui rapporte.
 *
 * « Tu vas aimer » n'est pas un moteur de recommandation : c'est ce qui
 * partage une étiquette avec la fiche ouverte, puis, à défaut, les mieux
 * notés du reste. Le dire autrement serait mentir sur ce que la boutique
 * sait de ses clients — c'est-à-dire rien.
 */
const SUGGESTIONS_MAX = 10;

function renderSuggestions(produit) {
  const autres = state.products.filter((p) => p.id !== produit.id && !isSoldOut(p));

  const memeRayon = autres.filter((p) => p.category === produit.category).slice(0, SUGGESTIONS_MAX);
  const categorie = state.categories.find((c) => c.id === produit.category);
  $('pMemeCategorieTitre').textContent = categorie
    ? t('produit.memeCategorieAvec', { cat: categorie.label })
    : t('produit.memeCategorie');
  remplirLaPiste('pMemeCategorie', 'pMemeCategoriePiste', memeRayon);

  const etiquettes = new Set((produit.tags ?? []).map((t) => String(t).toLowerCase()));
  const parEtiquette = autres.filter(
    (p) => p.category !== produit.category &&
      (p.tags ?? []).some((t) => etiquettes.has(String(t).toLowerCase()))
  );
  const complement = autres
    .filter((p) => p.category !== produit.category && !parEtiquette.includes(p))
    .sort((a, b) => (state.notes[b.id]?.moyenne ?? 0) - (state.notes[a.id]?.moyenne ?? 0));
  remplirLaPiste('pAimerAussi', 'pAimerAussiPiste', [...parEtiquette, ...complement].slice(0, SUGGESTIONS_MAX));
}

/** Une piste, ou rien du tout : un carrousel vide est un titre qui ment. */
function remplirLaPiste(sectionId, pisteId, produits) {
  $(sectionId).hidden = produits.length === 0;
  if (!produits.length) return $(pisteId).replaceChildren();
  $(pisteId).replaceChildren(...produits.map(carteSuggeree));
}

/**
 * La vignette d'un produit, pour les listes qui ne sont pas la grille.
 *
 * Trois endroits la dessinaient chacun à sa façon : la grille, la piste de
 * suggestions, la liste des favoris. La grille a appris à montrer la vidéo
 * d'un produit qui n'a que ça ; les deux autres posaient une `<img>`, et une
 * image ne peut pas montrer une vidéo. Le vendeur a vu ses dessins de
 * secours revenir dans les suggestions le lendemain de la correction.
 *
 * D'où cette fonction. Elle rend l'élément qui convient — `<video>` quand
 * c'est une vidéo, `<img>` sinon — et c'est elle qu'on appelle désormais.
 *
 * La grille garde son propre montage : elle porte en plus une pastille
 * « ▶ », un cœur et une classe d'état, et la refondre ici la rendrait
 * illisible pour gagner trois lignes.
 */
function vignetteDuProduit(produit, classe) {
  const video = videoDeVitrine(produit);

  // Un vrai fichier GIF ne se décode pas dans un lecteur vidéo : c'est une
  // image, et elle s'anime toute seule.
  if (video && !video.image) {
    const lecteur = document.createElement('video');
    lecteur.className = classe;
    lecteur.src = video.url;
    if (video.poster) lecteur.poster = video.poster;
    // Muette, sans contrôles, hors du parcours au clavier : ce n'est pas un
    // lecteur, c'est une vignette. La carte entière reste le bouton.
    lecteur.muted = true;
    lecteur.playsInline = true;
    lecteur.preload = 'metadata';
    lecteur.setAttribute('disablepictureinpicture', '');
    lecteur.tabIndex = -1;
    lecteur.setAttribute('aria-hidden', 'true');
    peindreLaPremiereImage(lecteur);
    return lecteur;
  }

  const image = document.createElement('img');
  image.className = classe;
  image.src = (video?.image ? video.url : photoDeVitrine(produit)) ?? produit.image ?? '';
  image.alt = '';
  image.loading = 'lazy';
  return image;
}

/**
 * La vignette d'une suggestion : plus petite qu'une carte de la grille.
 *
 * Elle ne reprend pas `productCard` : une carte de grille porte un cœur, une
 * pastille, une accroche sur deux lignes et un bouton « + ». Posée dans un
 * carrousel de 120 px, elle devient illisible, et le « + » se touche par
 * accident quand on fait glisser la piste.
 */
function carteSuggeree(produit) {
  const carte = document.createElement('button');
  carte.type = 'button';
  carte.className = 'suggestion';
  carte.setAttribute('aria-label', produit.name);

  const vignette = document.createElement('span');
  vignette.className = 'suggestion__art';
  // Photo, vidéo, dessin — dans cet ordre. Une piste de suggestions faite de
  // dessins par défaut ne donne envie d'ouvrir aucune des fiches.
  vignette.append(vignetteDuProduit(produit, ''));

  const nom = document.createElement('span');
  nom.className = 'suggestion__nom';
  nom.textContent = produit.name;

  // Pas de prix ici non plus. La grille n'en montre plus ; le montrer dans
  // le carrousel le ferait disparaître d'un écran pour revenir trois écrans
  // plus loin, et un prix d'entrée sorti de son format ne veut rien dire —
  // c'est toute la raison pour laquelle il a quitté la grille.
  carte.append(vignette, nom);
  carte.addEventListener('click', () => {
    openProduct(produit);
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  return carte;
}

/**
 * Monte la galerie du produit, ou retombe sur l'illustration unique.
 *
 * Le défilement est celui du navigateur, aimanté par CSS : le glissement du
 * doigt reste celui du système, donc fluide, et il continue de marcher si le
 * script échoue. Le JavaScript ne fait que les points, les flèches, et
 * l'arrêt des vidéos.
 */
function renderGalerie(product) {
  const art = $('pImage').closest('.pdetail__art');
  const galerie = $('pGallery');
  const piste = $('pGalleryTrack');
  const points = $('pGalleryDots');

  arreterLesVideos();
  piste.replaceChildren();
  points.replaceChildren();

  const medias = Array.isArray(product.media) ? product.media : [];
  if (!medias.length) {
    // Pas de galerie : l'illustration d'origine reprend sa place.
    galerie.hidden = true;
    const photo = photoDeVitrine(product);
    $('pImage').src = photo ?? product.image;
    $('pImage').alt = product.name;
    art.classList.toggle('pdetail__art--photo', Boolean(photo));
    return;
  }

  galerie.hidden = false;
  art.classList.remove('pdetail__art--photo');

  medias.forEach((media, rang) => {
    const case_ = document.createElement('div');
    case_.className = 'galerie__media';

    if (media.kind === 'gif' && estUnFichierGif(media)) {
      // Un vrai fichier GIF : une image, qui boucle d'elle-même. Rien à
      // démarrer, rien à mettre en pause — et c'est aussi sa limite, un GIF
      // en balise image ne sait pas s'arrêter quand la boutique est en mode
      // sobre. On l'accepte : couper l'animation demanderait de redessiner
      // chaque image dans un canevas, pour une fonction que personne n'a
      // demandée.
      const image = document.createElement('img');
      image.className = 'galerie__gif';
      image.src = media.url;
      image.alt = media.legende || `${product.name} — animation`;
      image.loading = rang === 0 ? 'eager' : 'lazy';
      case_.append(image);

      const pastille = document.createElement('span');
      pastille.className = 'galerie__type';
      pastille.textContent = 'GIF';
      case_.append(pastille);
    } else if (media.kind === 'gif') {
      // Un GIF passé par Telegram est revenu en MP4 muet : c'est une vidéo,
      // mais on ne lui donne ni contrôles ni bouton de lecture. Des poignées
      // sur une boucle de deux secondes n'ouvrent rien.
      const boucle = document.createElement('video');
      boucle.className = 'galerie__gif';
      boucle.src = media.url ?? `/api/media/${product.id}/${rang}`;
      const apercu = posterDe(product, media, rang);
      if (apercu) boucle.poster = apercu;
      boucle.muted = true;
      boucle.loop = true;
      boucle.playsInline = true;
      boucle.preload = 'metadata';
      boucle.setAttribute('disablepictureinpicture', '');
      boucle.tabIndex = -1;
      // Une boutique en mode sobre garde l'image fixe : c'est exactement ce
      // que demande quelqu'un qui a coupé les animations.
      if (anime()) boucle.autoplay = true;
      case_.append(boucle);
      // En mode sobre le GIF ne part pas : sans lecture, le poster reste, et
      // c'est le dessin de secours qu'on regarde. Le déplacement le lève.
      peindreLaPremiereImage(boucle);

      const pastille = document.createElement('span');
      pastille.className = 'galerie__type';
      pastille.textContent = 'GIF';
      case_.append(pastille);
    } else if (media.kind === 'video') {
      const video = document.createElement('video');
      video.src = media.url ?? `/api/media/${product.id}/${rang}`;
      // La vignette d'abord : la fiche montre quelque chose dès son ouverture,
      // sans attendre le premier octet de la vidéo.
      const apercu = posterDe(product, media, rang);
      if (apercu) video.poster = apercu;
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      // Muette au départ. Le commentaire qui tenait ici promettait « ni son
      // surprise » sans que rien dans le code ne l'obtienne : la vidéo
      // partait à plein volume par-dessus la musique d'ambiance, et le
      // client se retrouvait avec deux sons à couper au lieu d'un.
      //
      // Les contrôles natifs portent le haut-parleur : qui veut le son
      // l'a d'un geste, et c'est le bon sens de la chose — on n'impose pas
      // le silence, on ne l'impose simplement plus à l'envers.
      video.muted = true;

      // S'il rallume le son de la vidéo, l'ambiance s'arrête : deux sources
      // à la fois ne s'écoutent pas, et c'est la vidéo qu'il vient de
      // choisir. `arreterLeJuke` met en pause sans rien retenir, contrairement
      // à la pastille — son choix d'avoir de la musique n'est pas effacé par
      // un geste qui parlait d'autre chose, et elle repart d'un appui.
      video.addEventListener('volumechange', () => {
        if (!video.muted && video.volume > 0 && juke.voulue) arreterLeJuke();
      });

      case_.append(video);
      // La fiche montre la vidéo elle-même, pas l'illustration de secours :
      // le même défaut que sur la grille, et la même levée.
      peindreLaPremiereImage(video);

      const pastille = document.createElement('span');
      pastille.className = 'galerie__type';
      pastille.textContent = t('media.video');
      case_.append(pastille);

      case_.append(voileDeChargement(video));
    } else {
      const img = document.createElement('img');
      img.src = media.url ?? `/api/media/${product.id}/${rang}`;
      img.alt = media.legende || `${product.name} — visuel ${rang + 1}`;
      img.loading = rang === 0 ? 'eager' : 'lazy';
      case_.append(img);
    }

    // Le nom du format, sur le média qui lui est rattaché : le client qui fait
    // défiler la galerie sait ce qu'il regarde sans avoir à comparer avec les
    // boutons de format, et celui qui a choisi son format se reconnaît.
    const format = (product.variants ?? []).find((v) => v.id === media.variantId);
    if (format) {
      const etiquette = document.createElement('span');
      etiquette.className = 'galerie__format';
      etiquette.textContent = format.label;
      case_.append(etiquette);
    }

    piste.append(case_);

    const point = document.createElement('span');
    point.className = 'galerie__point';
    point.setAttribute('role', 'tab');
    point.setAttribute('aria-selected', String(rang === 0));
    points.append(point);
  });

  const plusieurs = medias.length > 1;
  points.hidden = !plusieurs;
  $('pGalleryPrev').hidden = !plusieurs;
  $('pGalleryNext').hidden = !plusieurs;

  piste.scrollLeft = 0;
  if (plusieurs) suivreLeDefilement(piste, points);
}

/** Allume le point du média affiché, sans écouter en continu. */
function suivreLeDefilement(piste, points) {
  let attente = null;
  piste.onscroll = () => {
    if (attente) return;
    attente = setTimeout(() => {
      attente = null;
      const rang = Math.round(piste.scrollLeft / Math.max(1, piste.clientWidth));
      [...points.children].forEach((p, i) => p.setAttribute('aria-selected', String(i === rang)));
    }, 90);
  };
}

/**
 * Amène la galerie sur la photo du format choisi.
 *
 * Silencieux quand ce format n'a pas de photo à lui : déplacer la galerie vers
 * un média au hasard serait pire que ne rien faire, et beaucoup de produits
 * n'auront jamais qu'une photo pour tous leurs formats.
 */
function montrerLeMediaDuFormat(variantId) {
  const medias = state.current?.media ?? [];
  const rang = medias.findIndex((m) => m.variantId === variantId);
  if (rang < 0) return;

  const piste = $('pGalleryTrack');
  if (!piste || piste.clientWidth === 0) return;
  // Une vidéo qui jouait pendant qu'on change de format continuerait à parler
  // par-dessus la photo qu'on vient d'amener.
  arreterLesVideos();
  piste.scrollTo({ left: rang * piste.clientWidth, behavior: anime() ? 'smooth' : 'auto' });
}

/** Déplace la galerie d'un média. */
function glisserGalerie(pas) {
  const piste = $('pGalleryTrack');
  piste.scrollBy({ left: pas * piste.clientWidth, behavior: 'smooth' });
}

/**
 * Coupe toute vidéo en cours.
 *
 * Sans ça, fermer la fiche laissait le son continuer par-dessus le catalogue :
 * le client entend une voix sans savoir d'où elle vient, et cherche le bouton
 * pour l'arrêter.
 */
function arreterLesVideos() {
  for (const video of document.querySelectorAll('#pGalleryTrack video')) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}

/**
 * Les caractéristiques, en puces.
 *
 * Elles ne remplacent pas la description : celle-ci raconte, celles-là se
 * lisent en diagonale. Un client qui compare deux variétés parcourt six
 * points ; il ne lit pas deux paragraphes l'un après l'autre.
 *
 * Rien à afficher, rien d'affiché : une liste vide sous le titre laisserait
 * un blanc qu'on prendrait pour un écran mal chargé.
 */
function renderPoints(product) {
  const liste = $('pPoints');
  const points = Array.isArray(product.points) ? product.points.filter(Boolean) : [];
  liste.hidden = points.length === 0;
  liste.replaceChildren(
    ...points.map((texte) => {
      const item = document.createElement('li');
      item.textContent = texte;
      return item;
    })
  );
}

function renderVariants() {
  const box = $('pVariants');
  const product = state.current;
  if (!product?.variants) {
    box.replaceChildren();
    $('pVariantsTitre').hidden = true;
    return;
  }
  $('pVariantsTitre').hidden = false;
  box.replaceChildren(
    ...product.variants.map((v) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'variant';
      btn.setAttribute('aria-pressed', String(v.id === state.currentVariant));
      btn.disabled = Number(v.stock ?? 0) <= 0;

      // Deux lignes montées en éléments plutôt qu'en HTML recollé : le libellé
      // vient du vendeur, et une chaîne concaténée redevient du balisage à la
      // première apostrophe mal placée.
      const poids = document.createElement('span');
      poids.className = 'variant__poids';
      poids.textContent = v.label;
      const prix = document.createElement('span');
      prix.className = 'variant__prix';
      const { prix: paye, avant } = prixDuFormat(product, v.id);
      if (btn.disabled) prix.textContent = t('produit.epuiseMinuscule');
      else {
        prix.textContent = formatPrice(paye);
        if (avant) {
          const barre = document.createElement('s');
          barre.className = 'variant__avant';
          barre.textContent = formatPrice(avant);
          prix.prepend(barre, ' ');
        }
      }
      btn.append(poids, prix);

      btn.addEventListener('click', () => {
        state.currentVariant = v.id;
        renderVariants();
        majBarreDeCommande();
        // La galerie suit le format choisi : c'est tout l'intérêt de rattacher
        // une photo à une variété. Sans ce saut, le client choisit « Bubble
        // Gum » et continue de regarder la photo de la Banana Kush.
        montrerLeMediaDuFormat(v.id);
        haptic('light');
      });
      return btn;
    })
  );
}

/**
 * Met la barre de commande à jour pour le format choisi.
 *
 * Elle s'appelait `setQty` et réglait un compteur de quantité. Le compteur
 * est parti avec le panier — une quantité se dit en deux mots dans la
 * conversation — mais tout le reste de ce que faisait la fonction est
 * toujours nécessaire : décider entre commander et se faire prévenir, et
 * écrire le prix du format sur le bouton.
 */
function majBarreDeCommande() {
  const product = state.current;
  // Appelée aussi au changement de langue, parfois sans fiche ouverte : sans
  // produit il n'y a ni stock à lire ni bouton à choisir.
  if (!product) return;
  const available = remainingFor(product, state.currentVariant);
  state.currentQty = 1;

  // Un seul bouton à la fois dans la barre : « Commander » quand il y a du
  // stock, le rappel de retour quand il n'y en a plus. Les deux ne se
  // montrent jamais ensemble.
  const bouton = $('commander');
  const notify = $('notifyMe');
  const epuise = available <= 0;

  if (epuise) {
    // Un bouton « Commander » éteint ne servait à rien : il disait seulement
    // qu'on ne peut pas. À sa place, quelque chose à faire — être prévenu du
    // retour. Sauf si la liste d'attente est coupée : là il n'y a rien à
    // promettre, et le bouton éteint dit au moins pourquoi.
    const sansListe = state.features.waitlist === false;
    bouton.hidden = !sansListe;
    notify.hidden = sansListe;

    bouton.disabled = true;
    bouton.classList.add('btn--eteint');
    $('pLibelle').textContent = t('produit.epuise');
    $('pPrice').textContent = '';
    // Le séparateur se vide plutôt que de se masquer : `hidden` sur un élément
    // dont la feuille de style force l'affichage ne fait rien, et « Épuisé · »
    // restait à l'écran avec son point tout seul.
    $('pSepare').textContent = '';

    if (!sansListe) refreshWaitlistButton();
    return;
  }

  bouton.hidden = false;
  notify.hidden = true;
  bouton.disabled = false;
  bouton.classList.remove('btn--eteint');
  $('pLibelle').textContent = t('produit.ajouter');
  $('pPrice').textContent = formatPrice(unitPrice(product, state.currentVariant));
  $('pSepare').textContent = ' · ';
}

/* ── La musique d'ambiance ───────────────────────────────── */

/* Le choix du client survit à la visite. On retient une préférence, pas une
   position de lecture : reprendre un morceau à la seconde près supposerait
   qu'il se souvienne de ce qu'il écoutait, ce qui n'arrive pas quand deux
   jours ont passé. */
const JUKE_CLEF = 'o68.musique';

const juke = {
  liste: [],
  index: 0,
  /* L'empreinte de la playlist du vendeur au moment où on l'a mélangée. Elle
     sert à ne PAS remélanger pour rien : `monterLeJuke` est rappelé à chaque
     rechargement du catalogue, et remélanger là ferait changer de morceau en
     pleine écoute — `index` désignerait soudain autre chose. */
  empreinte: null,
  /* Le client a-t-il demandé la musique ? Distinct de « ça joue » : un
     morceau qui se charge n'est pas encore un morceau qui joue, et la
     pastille doit montrer l'intention dès l'appui. */
  voulue: false,
  minuteurTitre: null,
};

/**
 * La playlist du client : celle du vendeur, dans un ordre tiré au sort.
 *
 * Le vendeur range ses morceaux dans l'ordre qui lui plaît, et cet ordre
 * reste le sien dans le panneau. Mais un client qui revient trois fois dans
 * la semaine entendait trois fois le même morceau d'accueil : une playlist
 * qui commence toujours pareil ne s'entend plus au troisième passage. On
 * tire donc un ordre par visite.
 *
 * Une visite, pas un rechargement. Le catalogue se recharge à chaque
 * changement d'état de la boutique — une ouverture, un stock, un avis — et
 * `monterLeJuke` repasse ici à chaque fois. Remélanger alors ferait sauter
 * le morceau en cours, puisque `index` pointerait sur un autre titre. D'où
 * l'empreinte : tant que le vendeur n'a pas touché à sa liste, on rend la
 * permutation déjà tirée. Qu'il ajoute ou retire un morceau, et on retire.
 *
 * Le tirage est un Fisher-Yates, qui donne chacune des permutations avec la
 * même probabilité. Le « mélange » naïf — trier sur `Math.random() - 0.5` —
 * n'en est pas un : le résultat dépend de l'algorithme de tri, et les
 * premiers de la liste y restent devant bien plus souvent qu'ils ne
 * devraient. Sur une playlist de boutique, ça s'entend.
 */
function melangerLaPlaylist(titres) {
  // Ce qui identifie une liste : ses morceaux ET leur ordre. Le vendeur qui
  // réordonne sa playlist demande bien un nouveau tirage.
  const empreinte = titres.map((m) => m.url ?? m.titre ?? '').join('\u0000');
  if (juke.empreinte === empreinte && juke.liste.length === titres.length) return juke.liste;
  juke.empreinte = empreinte;

  const melange = [...titres];
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [melange[i], melange[j]] = [melange[j], melange[i]];
  }
  return melange;
}

/**
 * Monte le lecteur, si le vendeur a une playlist et l'a allumée.
 *
 * Rien ne démarre ici. Aucun navigateur ni WebView ne joue un son sans geste
 * du client, et c'est tant mieux : personne n'ouvre une boutique en
 * s'attendant à de la musique. La pastille est le geste.
 */
function monterLeJuke() {
  const bouton = $('juke');
  const son = $('jukeSon');
  if (!bouton || !son) return;

  juke.liste = melangerLaPlaylist(state.musique?.titres ?? []);
  // Sans morceau, pas de pastille — même interrupteur allumé. Un bouton qui
  // ne joue rien est pire qu'un bouton absent.
  if (!juke.liste.length) {
    bouton.hidden = true;
    $('sonBtn').hidden = true;
    arreterLeJuke();
    return;
  }
  bouton.hidden = false;
  $('sonBtn').hidden = false;

  // Une seule fois : cette fonction est rappelée à chaque rechargement du
  // catalogue, et empiler les écouteurs ferait avancer la playlist de deux
  // morceaux à la fin du premier.
  if (!juke.branche) {
    juke.branche = true;
    bouton.addEventListener('click', basculerLeMenu);
    $('jukeLecture').addEventListener('click', basculerLeJuke);
    $('jukePrec').addEventListener('click', () => changerDeMorceau(-1));
    $('jukeSuiv').addEventListener('click', () => changerDeMorceau(1));

    // Un appui ailleurs referme le panneau. Il est posé sur la phase de
    // capture : sans elle, un appui sur une carte ouvrirait la fiche ET
    // laisserait le panneau ouvert par-dessus.
    document.addEventListener('click', (ev) => {
      if ($('jukeMenu')?.hidden) return;
      if (ev.target.closest('#jukeMenu') || ev.target.closest('#juke')) return;
      fermerLeMenu();
    }, true);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !$('jukeMenu')?.hidden) fermerLeMenu();
    });
    son.addEventListener('ended', () => jouerLeMorceau(juke.index + 1));
    // Un morceau introuvable ne doit pas arrêter la playlist : on passe au
    // suivant. Sans ça, un `file_id` périmé gèle le lecteur sans rien dire.
    son.addEventListener('error', () => {
      if (!juke.voulue) return;
      if (juke.liste.length > 1) jouerLeMorceau(juke.index + 1);
      else arreterLeJuke();
    });
  }

  peindreLeJuke();

}

/**
 * Le choix de la langue dans le profil.
 *
 * Les mêmes boutons que sur l'écran d'accueil, au même endroit du code :
 * deux listes de drapeaux écrites séparément finiraient par diverger, et
 * c'est le genre d'écart qu'on ne remarque qu'une fois une langue ajoutée
 * d'un côté seulement.
 */
/**
 * Le choix de la langue, en liste native.
 *
 * C'était une rangée de drapeaux, un bouton par langue. À trois elle tenait ;
 * à neuf elle poussait la carte du cadre d'accueil plus large que l'écran —
 * mesuré à 330 px sur un téléphone de 320 — et le texte se retrouvait coupé
 * des deux côtés. Une grille qui passe à la ligne réglait la largeur mais
 * prenait 244 px de haut, ce qui faisait sortir le bouton d'entrée de
 * l'écran : un cadre plus haut que l'écran cache ce qui sert à en sortir.
 *
 * Une liste native tient sur une ligne quel que soit le nombre de langues.
 * Elle a un autre mérite, moins visible : sur iPhone c'est le système qui
 * l'ouvre, en molette, celle que le client connaît déjà de tous ses autres
 * réglages. Et le nom de chaque langue est écrit — un drapeau désigne un
 * pays, pas une langue, et qui ne reconnaît pas 🇲🇦 pour l'arabe resterait
 * sans rien à lire.
 *
 * Les noms ne sont pas traduits : « Deutsch » s'écrit « Deutsch » dans
 * toutes les langues de la boutique. La liste n'a donc pas à être refaite
 * quand on change de langue — seule sa valeur suit.
 */
function monterLaListeDeLangues(hote, apresChoix) {
  const liste = document.createElement('select');
  liste.className = 'langue-liste';
  // Le titre au-dessus sert d'étiquette. Sans lui, une synthèse vocale
  // n'annonce que « liste » et la valeur, sans dire de quoi il s'agit.
  const titre = hote.previousElementSibling;
  if (titre?.id) liste.setAttribute('aria-labelledby', titre.id);
  else liste.setAttribute('aria-label', t('profil.langue'));
  liste.replaceChildren(
    ...LANGUES.map((l) => {
      const o = document.createElement('option');
      o.value = l.code;
      // Deux espaces après le drapeau : collé, l'émoji et la première lettre
      // se touchent dans le menu du système, qui n'applique pas nos styles.
      o.textContent = `${l.drapeau}  ${l.nom}`;
      return o;
    })
  );
  liste.value = langue;
  liste.addEventListener('change', () => {
    appliquerLaLangue(liste.value, { retenir: true });
    apresChoix?.(liste.value);
    haptic('light');
  });
  hote.replaceChildren(liste);
  return liste;
}

/**
 * La pastille de langue, flottante et toujours là.
 *
 * Le choix ne vivait qu'à deux endroits : le cadre d'accueil, qui ne
 * s'affiche qu'une fois, et le profil, à deux touches de là. Un client qui
 * laisse passer le premier et ne pense pas au second reste dans une langue
 * qu'il n'a pas choisie — huit langues que personne ne sait atteindre ne
 * valent pas mieux qu'une seule.
 *
 * C'est le `<select>` transparent posé sur le drapeau qui reçoit l'appui,
 * et le système ouvre sa propre liste : aucune WebView ne laisse déplier une
 * liste native par script de façon fiable, et une liste refaite à la main
 * perdrait la molette que le client connaît de tous ses autres réglages.
 */
function monterLaPastilleDeLangue() {
  const liste = $('lpastilleListe');
  if (!liste || liste.options.length) return;
  liste.replaceChildren(
    ...LANGUES.map((l) => {
      const o = document.createElement('option');
      o.value = l.code;
      // Le nom est écrit, comme dans les deux autres listes : un drapeau
      // désigne un pays, pas une langue, et qui ne reconnaît pas 🇲🇦 pour
      // l'arabe resterait devant une pastille qu'il n'ose pas toucher.
      o.textContent = `${l.drapeau}  ${l.nom}`;
      return o;
    })
  );
  liste.addEventListener('change', () => {
    appliquerLaLangue(liste.value, { retenir: true });
    haptic('light');
  });
  peindreLaPastilleDeLangue();
}

/** Le drapeau du moment, et la place de la pastille sous celle de la musique. */
function peindreLaPastilleDeLangue() {
  const hote = $('lpastille');
  const liste = $('lpastilleListe');
  if (!hote || !liste) return;

  // Une seule langue : une pastille qui n'offre aucun choix n'est qu'un
  // bouton de plus à contourner du pouce.
  hote.hidden = LANGUES.length < 2;
  liste.value = langue;
  const drapeau = $('lpastilleDrapeau');
  if (drapeau) drapeau.textContent = LANGUES.find((l) => l.code === langue)?.drapeau ?? '🌐';

  // La musique occupe le bas : la langue se range au-dessus. Sans elle, elle
  // prend la place du bas — une pastille seule flottant à mi-hauteur, avec un
  // trou dessous, se lit comme un bouton qui a perdu son voisin.
  hote.classList.toggle('lpastille--empilee', $('juke')?.hidden === false);
}

function renderLangues() {
  const zone = $('profilLangues');
  if (!zone) return;
  // Construite une fois, puis seulement remise à jour : la refaire à chaque
  // changement de langue ferait perdre le focus au client en plein choix.
  const liste = zone.querySelector('select') ?? monterLaListeDeLangues(zone);
  liste.value = langue;
}

/* ── L'accueil ───────────────────────────────────────────── */

/**
 * La pastille d'horaire du cadre d'accueil, d'après l'état réel.
 *
 * Elle annonçait « 7/7 · 13H-00H » quoi qu'il arrive. Un client qui ouvre la
 * boutique à trois heures du matin lisait donc les horaires d'ouverture sur
 * un cadre qui ne disait pas un mot du fait que c'était fermé — et découvrait
 * la fermeture une fois entré, par le bandeau du catalogue.
 *
 * Le serveur sait tout cela : il envoie `open`, et l'heure de retour quand
 * elle est connue. On dit la même chose que le bandeau du catalogue, au même
 * moment, avec les mêmes mots.
 *
 * Fermeture à la main ou horaires coupés : le serveur ne promet aucune heure,
 * et on n'en invente pas une.
 */
function ecrireLHoraire() {
  const pastille = $('bienvenueHoraires');
  if (!pastille) return;
  const hote = pastille.closest('.bienvenue__info');
  const ouvert = state.opening?.open !== false;

  pastille.textContent = ouvert
    ? t('accueil.horaires')
    : state.opening?.retour
      ? `${t('etat.retourA')} ${state.opening.retour}`
      : t('etat.fermePourLInstant');

  // La couleur double le texte, elle ne le remplace pas : « De retour à 13h »
  // se lit sans distinguer le rouge du jaune.
  if (hote) {
    hote.classList.toggle('bienvenue__info--ferme', !ouvert);
  }
}

/**
 * Le cadre qui suit le film : qui on est, à qui on parle, les horaires.
 *
 * Il paraît à chaque visite — c'est l'enseigne de la boutique, et une
 * enseigne qu'on ne voit qu'une fois ne sert à rien. La question de la
 * langue, elle, ne se pose qu'une fois : reposée à chaque visite, elle
 * deviendrait un péage. Qui a déjà répondu ne voit que le message, et
 * retrouve le réglage dans son profil.
 *
 * Son rôle technique compte autant que son rôle d'accueil : l'appui sur une
 * langue — ou, pour un habitué, sur « Entrer » — est un geste du client DANS
 * la page, et c'est exactement ce que le navigateur réclame pour autoriser
 * un son. La musique démarre là, et elle démarre pour de bon : avant, le
 * client qui revenait n'avait droit qu'à une musique « si le navigateur
 * voulait bien ».
 */
function montrerLAccueil() {
  const cadre = $('bienvenue');
  if (!cadre) return false;

  const { code, dejaChoisie } = langueDeDepart();
  appliquerLaLangue(code);

  // Le cadre s'affiche à chaque visite : c'est l'enseigne de la boutique, et
  // une enseigne qu'on ne voit qu'une fois ne sert à rien. Mais la question
  // de la langue, elle, ne se pose qu'une fois — reposée à chaque fois, elle
  // deviendrait un péage. Déjà répondu : on cache les drapeaux et le client
  // n'a plus qu'à entrer.
  //
  // L'effet de bord est heureux : le bouton « Entrer » est un geste fait
  // DANS la page, ce qui est exactement ce que le navigateur exige pour
  // laisser partir un son. Le client qui revient avait droit, avant, à une
  // musique qui démarrait « si le navigateur voulait bien ».
  $('bienvenueLangues').hidden = dejaChoisie;

  const prenom = tg?.initDataUnsafe?.user?.first_name;
  const pseudo = tg?.initDataUnsafe?.user?.username;
  // « @pseudo » quand il existe, le prénom sinon : c'est ainsi que Telegram
  // le nomme, et c'est ce que le client reconnaît de lui-même.
  const nom = pseudo ? `@${pseudo}` : (prenom ?? '');
  // Un seul endroit qui écrit le cadre : il est réécrit à chaque drapeau
  // touché, et deux listes à tenir à jour en deviendraient une qui oublie.
  const ecrireLeCadre = () => {
    $('bienvenueSalut').textContent = nom
      ? `${t('accueil.bienvenue')} ${isoler(nom)}`
      : t('accueil.bienvenue');
    // `innerHTML` et non `textContent` : la phrase porte du gras, et c'est le
    // seul texte du cadre qui en porte. Le balisage vient de notre
    // dictionnaire — jamais du client — mais le nom de la boutique, lui,
    // vient des réglages : il est échappé avant d'entrer dans la phrase.
    // Un vendeur qui appellerait sa boutique « Club <b>67</b> » verrait
    // sinon son nom interprété plutôt qu'affiché.
    $('bienvenueTexte').innerHTML = t('accueil.texte', {
      boutique: escapeHtml(state.shop?.shopName ?? ''),
    }).trim();
    ecrireLHoraire();
    $('bienvenueService').textContent = t('accueil.service');
    $('bienvenueLegende').textContent = t('accueil.langue');
    $('bienvenueEntrer').textContent = t('accueil.entrer');
  };
  ecrireLeCadre();

  let choisie = code;
  const liste = monterLaListeDeLangues($('bienvenueChoix'), (code2) => {
    choisie = code2;
    // On réécrit le cadre lui-même : il est le premier à devoir parler la
    // langue qu'on vient de choisir, sinon le client change de langue et voit
    // la précédente lui répondre.
    ecrireLeCadre();
    // Le geste est donné : la musique peut partir, et elle partira.
    lancerLaMusiqueALArrivee();
  });
  // `ecrireLeCadre` ne touche pas à la liste — les noms de langues ne se
  // traduisent pas — mais il faut que sa valeur parte sur la bonne.
  liste.value = choisie;

  $('bienvenueEntrer').addEventListener('click', () => {
    // Entrer sans avoir touché aux drapeaux, c'est accepter celui qui était
    // proposé : on le retient, sinon la question reviendrait à chaque visite.
    appliquerLaLangue(choisie, { retenir: true });
    cadre.hidden = true;
    // Au cas où il serait entré sans toucher à la langue : ce bouton aussi
    // est un geste, et c'est la dernière occasion de lancer la musique
    // pendant que le navigateur y consent encore.
    lancerLaMusiqueALArrivee();
    haptic('light');
  }, { once: true });

  cadre.hidden = false;
  return true;
}

/**
 * La musique démarre en arrivant sur le catalogue — quand le navigateur
 * l'autorise.
 *
 * Il l'autorise s'il a vu un geste du client dans la page : un appui sur la
 * porte d'âge, sur l'épreuve d'entrée, sur « j'ai répondu ». L'appui qui a
 * ouvert la Mini App, lui, appartient à Telegram et pas à cette page — il ne
 * compte pas. Une boutique sans aucune porte peut donc se voir refuser la
 * lecture, et ce n'est pas rattrapable : c'est la règle des navigateurs, pas
 * un réglage.
 *
 * D'où la seule forme honnête : on essaie, et on retombe debout. Refusé, on
 * ne laisse pas une pastille allumée sur un silence — elle bat une fois pour
 * dire qu'il y a quelque chose à écouter, et un appui suffit.
 *
 * Un client qui a coupé la musique ne la retrouve pas au prochain passage :
 * couper, c'est dire non, et le redemander à chaque visite serait le genre
 * d'insistance qui fait fermer une boutique.
 */
function lancerLaMusiqueALArrivee() {
  if (!juke.liste.length || juke.voulue || juke.demarrageTente) return;
  // Le catalogue se recharge à chaque changement d'état de la boutique : sans
  // ce garde-fou, chaque rechargement relancerait la playlist au premier
  // morceau, par-dessus celui qui joue.
  juke.demarrageTente = true;
  // Le haut de la liste — qui n'est plus le premier morceau du vendeur mais
  // celui que le tirage de cette visite a mis devant. Repartir de zéro reste
  // juste : on veut le début de la playlist du client, pas l'endroit où il
  // en était avant un rechargement.
  juke.index = 0;

  let choixPasse = null;
  try { choixPasse = localStorage.getItem(JUKE_CLEF); } catch { /* navigation privée */ }
  if (choixPasse === 'non') return;

  const son = $('jukeSon');
  if (!son) return;

  juke.voulue = true;
  const morceau = juke.liste[juke.index];
  son.src = morceau.url;
  son.play().then(
    () => {
      montrerLeTitre(morceau.titre);
      peindreLeJuke();
    },
    () => {
      // Refus : on efface toute trace de la tentative, y compris la source,
      // sinon le navigateur continue de télécharger un morceau que personne
      // n'entendra.
      juke.voulue = false;
      son.removeAttribute('src');
      son.load();
      peindreLeJuke();
      inviterALaMusique();
    }
  );
  peindreLeJuke();
}

/** La pastille bat, sans un son : il y a de la musique, elle attend un appui. */
function inviterALaMusique() {
  const bouton = $('juke');
  if (!bouton || juke.rappelFait || !anime()) return;
  juke.rappelFait = true;
  bouton.classList.add('juke--rappel');
  setTimeout(() => bouton.classList.remove('juke--rappel'), 2600);
}

/**
 * Ouvre ou referme le panneau du lecteur.
 *
 * Rien ne démarre ici : le panneau s'ouvre en silence. Le geste qui autorise
 * la lecture, aux yeux du navigateur comme à ceux du client, c'est l'appui
 * sur « lecture » — pas l'appui sur la pastille.
 */
function basculerLeMenu() {
  const menu = $('jukeMenu');
  if (!menu) return;
  if (menu.hidden) {
    // Le titre flottant n'a plus lieu d'être : le panneau le dit en grand.
    masquerLeTitre();
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('juke__menu--ouvert'));
    $('juke')?.setAttribute('aria-expanded', 'true');
    peindreLeJuke();
    // Le premier geste au clavier tombe sur la commande principale.
    $('jukeLecture')?.focus({ preventScroll: true });
  } else {
    fermerLeMenu();
  }
  haptic('light');
}

function fermerLeMenu() {
  const menu = $('jukeMenu');
  if (!menu || menu.hidden) return;
  menu.classList.remove('juke__menu--ouvert');
  $('juke')?.setAttribute('aria-expanded', 'false');
  // On attend la fin du repli avant de le retirer du calque : caché
  // aussitôt, il disparaîtrait d'un coup au lieu de se refermer.
  setTimeout(() => { menu.hidden = true; }, 200);
}

/**
 * Le morceau d'avant ou celui d'après.
 *
 * Si rien ne joue, on change quand même de morceau — mais sans lancer la
 * lecture : le client explore sa playlist, il la démarrera quand il voudra.
 * L'appel vient d'un appui, donc lancer serait autorisé ; ce n'est pas une
 * raison pour le faire à sa place.
 */
function changerDeMorceau(sens) {
  if (!juke.liste.length) return;
  if (juke.voulue) {
    jouerLeMorceau(juke.index + sens);
  } else {
    juke.index = ((juke.index + sens) % juke.liste.length + juke.liste.length) % juke.liste.length;
    peindreLeJuke();
  }
  haptic('light');
}

/** L'état de la pastille : au repos, ou en train de jouer. */
function peindreLeJuke() {
  const bouton = $('juke');
  if (!bouton) return;
  bouton.classList.toggle('juke--joue', juke.voulue);
  bouton.setAttribute('aria-label', t('juke.ouvrir'));
  const son = $('sonBtn');
  if (son) {
    son.setAttribute('aria-pressed', String(juke.voulue));
    son.firstElementChild.textContent = juke.voulue ? '🔊' : '🔈';
  }

  // Le panneau porte le même état : c'est là qu'on lit ce qui joue et qu'on
  // agit dessus, la pastille ne fait plus que l'ouvrir.
  const lecture = $('jukeLecture');
  if (lecture) {
    lecture.classList.toggle('juke--joue', juke.voulue);
    lecture.setAttribute('aria-label', t(juke.voulue ? 'juke.pause' : 'juke.lecture'));
  }
  const morceau = juke.liste[juke.index];
  const titre = $('jukeMenuTitre');
  if (titre) titre.textContent = morceau?.titre ?? '—';
  const rang = $('jukeMenuRang');
  if (rang) {
    rang.textContent = juke.liste.length
      ? `${juke.index + 1} / ${juke.liste.length}`
      : '';
  }
  // Un seul morceau : « précédent » et « suivant » ramèneraient au même, et
  // un bouton qui ne fait rien vaut moins qu'un bouton éteint.
  const seul = juke.liste.length < 2;
  for (const id of ['jukePrec', 'jukeSuiv']) {
    const b = $(id);
    if (b) b.disabled = seul;
  }
}

function basculerLeJuke() {
  if (juke.voulue) {
    arreterLeJuke();
    try { localStorage.setItem(JUKE_CLEF, 'non'); } catch { /* navigation privée */ }
  } else {
    juke.voulue = true;
    try { localStorage.setItem(JUKE_CLEF, 'oui'); } catch { /* navigation privée */ }
    jouerLeMorceau(juke.index);
  }
  peindreLeJuke();
  haptic('light');
}

function arreterLeJuke() {
  const son = $('jukeSon');
  juke.voulue = false;
  if (son) {
    son.pause();
    // On vide la source : sans ça, le navigateur continue de télécharger le
    // morceau en cours après la mise en pause, et le client paie une
    // ambiance qu'il vient justement de couper.
    son.removeAttribute('src');
    son.load();
  }
  masquerLeTitre();
  peindreLeJuke();
}

function jouerLeMorceau(n) {
  const son = $('jukeSon');
  if (!son || !juke.liste.length) return;

  // La playlist tourne en rond : après le dernier, le premier.
  juke.index = ((n % juke.liste.length) + juke.liste.length) % juke.liste.length;
  const morceau = juke.liste[juke.index];

  son.src = morceau.url;
  son.play().then(
    () => montrerLeTitre(morceau.titre),
    () => {
      // Refus du navigateur : la lecture n'a pas été demandée par un geste,
      // ou la WebView l'interdit. On repasse au repos plutôt que de laisser
      // une pastille allumée sur un silence.
      juke.voulue = false;
      peindreLeJuke();
    }
  );
  peindreLeJuke();
}

/** Le titre s'annonce quelques secondes, puis rend l'écran au catalogue. */
function montrerLeTitre(titre) {
  const ligne = $('jukeTitre');
  if (!ligne) return;
  // Panneau ouvert, il affiche déjà le titre en grand : la pastille flottante
  // ferait doublon, et par-dessus le panneau en plus.
  if (!$('jukeMenu')?.hidden) return;
  ligne.textContent = titre;
  ligne.hidden = false;
  requestAnimationFrame(() => ligne.classList.add('juke__titre--vu'));
  clearTimeout(juke.minuteurTitre);
  juke.minuteurTitre = setTimeout(masquerLeTitre, 3400);
}

function masquerLeTitre() {
  const ligne = $('jukeTitre');
  if (!ligne) return;
  clearTimeout(juke.minuteurTitre);
  ligne.classList.remove('juke__titre--vu');
  // On attend la fin du fondu avant de retirer l'élément du calque : caché
  // aussitôt, il disparaîtrait d'un coup au lieu de s'effacer.
  setTimeout(() => { ligne.hidden = true; }, 260);
}

/** Relit le catalogue pour que les stocks affichés soient ceux du serveur. */
async function refreshCatalog() {
  try {
    const res = await fetch('/api/catalog');
    if (!res.ok) return;
    const data = await res.json();
    state.products = data.products;
    // Les notes bougent aussi : un avis déposé à l'instant doit se voir sur la
    // grille sans qu'on ait à rouvrir la boutique.
    state.notes = data.notes ?? {};
    renderGrid();
  } catch {
    /* on garde l'affichage précédent plutôt que de vider la boutique */
  }
}

/**
 * Le seul bouton de la fiche, et la seule chose qu'il fait.
 *
 * Il n'y a pas de panier dans cette boutique et rien n'est enregistré ici :
 * l'application sert à choisir — voir les produits, comparer les formats,
 * lire les avis. Le bouton ouvre le panneau qui dit où commander, et rien
 * de plus. Il n'ouvre aucune conversation, ne quitte pas la boutique, et
 * n'écrit à personne.
 */
function commanderCeProduit() {
  const produit = state.current;
  if (!produit) return;
  ajouterAuPanier(produit, state.currentVariant);
}

/* ── Le panier ───────────────────────────────────────────── */

function lireLePanier() {
  try { return JSON.parse(localStorage.getItem(PANIER_CLEF) ?? '[]'); } catch { return []; }
}

function ecrireLePanier() {
  try { localStorage.setItem(PANIER_CLEF, JSON.stringify(state.panier)); } catch { /* navigation privée */ }
  peindreLesCompteurs();
}

/** La pastille de l'en-tête et celle de l'onglet disent la même chose. */
function peindreLesCompteurs() {
  const n = nombreDArticles(state.panier);
  for (const id of ['panierCompte', 'panierPastille']) {
    const el = $(id);
    if (!el) continue;
    el.hidden = n === 0;
    el.textContent = String(n);
  }
}

function ajouterAuPanier(produit, variantId) {
  const { lignes, ajoutes } = ajouter(state.panier, produit, variantId, 1);
  if (!ajoutes) {
    toast(t('panier.plusDeStock'));
    haptic('error');
    return;
  }
  state.panier = lignes;
  ecrireLePanier();
  toast(t('panier.ajoute'));
  haptic('success');
}

function renderPanier() {
  state.panier = nettoyer(state.panier, state.products);
  ecrireLePanier();
  const chiffre = detailler(state.panier, state.products);
  const vide = chiffre.detail.length === 0;
  $('panierVide').hidden = !vide;
  $('panierPied').hidden = vide;
  $('panierForm').hidden = vide;

  $('panierListe').replaceChildren(
    ...chiffre.detail.map((d, index) => {
      const ligne = document.createElement('div');
      ligne.className = 'pligne';
      const image = photoDeVitrine(d.produit) ?? d.produit.image;
      ligne.innerHTML = `
        <img class="pligne__image" src="${escapeHtml(image)}" alt="" loading="lazy">
        <div class="pligne__texte">
          <b class="pligne__nom">${escapeHtml(d.produit.name)}</b>
          ${d.variante ? `<span class="pligne__format">${escapeHtml(d.variante.label)}</span>` : ''}
          <span class="pligne__prix">${d.avant ? `<s>${escapeHtml(formatPrice(d.avant))}</s> ` : ''}${escapeHtml(formatPrice(d.prix))}</span>
        </div>
        <div class="pligne__qte">
          <button type="button" class="pligne__btn" data-pas="-1" aria-label="${escapeHtml(t('panier.moins'))}">−</button>
          <span class="pligne__n">${d.qte}</span>
          <button type="button" class="pligne__btn" data-pas="1" aria-label="${escapeHtml(t('panier.plus'))}">+</button>
        </div>
        <b class="pligne__total">${escapeHtml(formatPrice(d.total))}</b>
        <button type="button" class="pligne__retirer" aria-label="${escapeHtml(t('panier.retirer'))}">✕</button>`;
      for (const b of ligne.querySelectorAll('[data-pas]')) {
        b.addEventListener('click', () => {
          const voulu = d.qte + Number(b.dataset.pas);
          const avant = nombreDArticles(state.panier);
          state.panier = changerQte(state.panier, index, voulu, state.products);
          if (voulu > d.qte && nombreDArticles(state.panier) === avant) toast(t('panier.plusDeStock'));
          haptic('light');
          renderPanier();
          revalidatePromo();
        });
      }
      ligne.querySelector('.pligne__retirer').addEventListener('click', () => {
        state.panier = changerQte(state.panier, index, 0, state.products);
        haptic('light');
        renderPanier();
      });
      return ligne;
    })
  );

  $('panierEconomie').hidden = chiffre.economie <= 0;
  $('panierEconomie').textContent = t('panier.economie', { montant: formatPrice(chiffre.economie) });
  if (!vide) renderLaCommande(chiffre.total);
}

/**
 * Le formulaire et le total, comme sur Napoli : mode, adresse, zone,
 * créneau, code promo, frais de livraison et minimum. Tout est recalculé
 * par le serveur à l'envoi ; ce qui est fait ici sert à le dire avant.
 */
function renderLaCommande(sousTotal) {
  const livraison = state.mode === 'delivery';
  const fee = deliveryFeeFor(sousTotal);
  const remise = currentDiscount(sousTotal);
  const { minimum, franco } = conditions(sousTotal);
  const manque = Math.max(0, minimum - sousTotal);

  renderModes();
  $('addressField').hidden = !livraison;
  $('slotField').hidden = !state.slotsEnabled;
  $('slotFieldLabel').textContent = t(livraison ? 'commande.creneauLivraison' : 'commande.creneauRetrait');
  $('contactLabel').textContent = t(livraison ? 'commande.telephoneLivraison' : 'commande.telephone');
  $('promoField').hidden = state.features.promos === false;
  renderZoneStatus();

  if (promoError) showPromoStatus(promoError, false);
  else if (remise.discount && remise.label) {
    showPromoStatus(remise.source === 'tier'
      ? t('commande.remiseAuto', { label: remise.label, montant: formatPrice(remise.discount) })
      : t('commande.codeApplique', { code: remise.code, montant: formatPrice(remise.discount) }), true);
  } else if (!state.promo && !$('promoCode').value.trim()) showPromoStatus('', null);

  const lignes = [[t('commande.sousTotal'), formatPrice(sousTotal)]];
  if (remise.discount) lignes.push([t('commande.remise'), `−${formatPrice(remise.discount)}`]);
  if (livraison) lignes.push([t('commande.fraisLivraison'), fee ? formatPrice(fee) : t('commande.offerte')]);
  $('panierCalcul').replaceChildren(...lignes.flatMap(([nom, valeur]) => [
    Object.assign(document.createElement('dt'), { textContent: nom }),
    Object.assign(document.createElement('dd'), { textContent: valeur }),
  ]));
  $('panierTotal').textContent = formatPrice(sousTotal - remise.discount + fee);

  const hint = $('cartHint');
  if (manque > 0) {
    hint.textContent = t('commande.minimum', { montant: formatPrice(minimum), reste: formatPrice(manque) });
  } else if (livraison && fee && franco !== null) {
    hint.textContent = t('commande.franco', { montant: formatPrice(franco), reste: formatPrice(franco - sousTotal) });
  } else hint.textContent = '';
  hint.hidden = !hint.textContent;

  // On bloque plutôt que de laisser partir une commande que le serveur
  // refusera : le client verrait un aller-retour pour rien.
  const zoneManquante = livraison && state.features.zones !== false && state.zones.length > 0 && !state.zone;
  const creneauManquant = state.slotsEnabled && !state.slotId;
  const bouton = $('panierCommander');
  bouton.disabled = state.blocked || !state.opening.open || manque > 0 || zoneManquante || creneauManquant;
  bouton.textContent = state.blocked ? t('commande.impossible')
    : !state.opening.open ? t('commande.fermee')
      : creneauManquant && !zoneManquante && manque === 0 ? t('commande.choisisCreneau')
        : t('panier.commander');
}

/* ── Retrait ou livraison, zones et créneaux ─────────────── */

function renderModes() {
  const { pickup, delivery } = state.fulfillment;
  if (!pickup && state.mode === 'pickup') state.mode = 'delivery';
  if (!delivery && state.mode === 'delivery') state.mode = 'pickup';
  $('modeField').hidden = !(pickup && delivery);
  if (!(pickup && delivery)) return;

  const fee = deliveryFeeIfDelivering(sousTotalDuPanier());
  const options = [
    ['pickup', t('commande.retrait'), t('commande.surPlace')],
    ['delivery', t('commande.livraison'), fee ? formatPrice(fee) : t('commande.offerte')],
  ];
  $('modes').replaceChildren(
    ...options.map(([valeur, libelle, detail]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mode';
      btn.setAttribute('aria-pressed', String(state.mode === valeur));
      btn.innerHTML = `${escapeHtml(libelle)}<small>${escapeHtml(detail)}</small>`;
      btn.addEventListener('click', () => {
        state.mode = valeur;
        haptic('light');
        renderPanier();
      });
      return btn;
    })
  );
}

const sousTotalDuPanier = () => detailler(state.panier, state.products).total;

/** La zone qui couvre ce code postal, ou null si personne ne le dessert. */
function findZone(postalCode) {
  const code = String(postalCode ?? '').trim();
  if (!/^\d{2,6}$/.test(code) || state.features.zones === false) return null;
  return state.zones.find((zone) => zone.postalCodes.includes(code)) ?? null;
}

/** Les zones remplacent les conditions générales là où elles en ont. */
function conditions() {
  const { deliveryFee, freeDeliveryFrom, minimumOrder } = state.fulfillment;
  const zone = state.zone;
  return {
    fee: zone ? zone.fee : deliveryFee,
    franco: zone ? zone.freeFrom ?? freeDeliveryFrom : freeDeliveryFrom,
    minimum: zone ? zone.minimumOrder ?? minimumOrder : minimumOrder,
  };
}

function deliveryFeeIfDelivering(sousTotal) {
  if (!state.fulfillment.delivery) return 0;
  const { fee, franco } = conditions(sousTotal);
  return franco !== null && sousTotal >= franco ? 0 : fee;
}

/** Frais réellement dus : le mode retrait les annule. */
function deliveryFeeFor(sousTotal) {
  return state.mode === 'delivery' ? deliveryFeeIfDelivering(sousTotal) : 0;
}

/** Dit tout de suite si on descend jusque chez lui, et à quelles conditions. */
function renderZoneStatus() {
  const el = $('zoneStatus');
  const code = $('orderPostal').value.trim();
  if (!code || !state.zones.length || state.features.zones === false) {
    el.hidden = true;
    return;
  }
  if (!state.zone) {
    el.textContent = t('commande.pasLivre', { code });
    el.hidden = false;
    el.classList.add('promo__status--ko');
    el.classList.remove('promo__status--ok');
    return;
  }
  const details = [
    state.zone.fee ? t('commande.zoneFrais', { montant: formatPrice(state.zone.fee) }) : t('commande.zoneOfferte'),
    state.zone.minimumOrder ? t('commande.zoneMin', { montant: formatPrice(state.zone.minimumOrder) }) : null,
  ].filter(Boolean);
  el.textContent = `${state.zone.name} · ${details.join(' · ')}`;
  el.hidden = false;
  el.classList.add('promo__status--ok');
  el.classList.remove('promo__status--ko');
}

/** Les créneaux encore réservables. Silencieux en cas d'échec : le serveur
 *  revalide de toute façon. */
async function loadSlots() {
  if (!state.slotsEnabled) return;
  try {
    const res = await fetch('/api/slots');
    if (!res.ok) return;
    const data = await res.json();
    state.slots = data.slots ?? [];
    if (!state.slots.some((s) => s.id === state.slotId && !s.full)) state.slotId = '';
    renderSlots();
  } catch {
    /* réseau capricieux : on garde ce qu'on a */
  }
}

function renderSlots() {
  const select = $('orderSlot');
  select.replaceChildren(
    Object.assign(document.createElement('option'), {
      value: '', disabled: true,
      textContent: t(state.slots.length ? 'commande.choisisCreneau' : 'commande.aucunCreneau'),
    }),
    ...state.slots.map((slot) => Object.assign(document.createElement('option'), {
      value: slot.id,
      disabled: slot.full,
      textContent: slot.full
        ? `${slot.label} — ${t('commande.complet')}`
        : slot.left <= 2 ? `${slot.label} — ${t('commande.places', { n: slot.left })}` : slot.label,
    }))
  );
  select.value = state.slotId;
  if (!select.value) select.selectedIndex = 0;
}

/* ── Remises : paliers et codes ──────────────────────────── */

/** Le palier du panier, recopié ici pour l'affichage ; le serveur fait foi. */
function tierDiscountFor(sousTotal) {
  const palier = (state.features.tiers === false ? [] : state.tiers)
    .filter((p) => sousTotal >= p.from)
    .sort((a, b) => b.from - a.from)[0];
  if (!palier) return { discount: 0, label: null };
  return {
    discount: Math.round((sousTotal * palier.percent) / 100),
    label: `−${palier.percent} % ${t('carte.des')} ${formatPrice(palier.from)}`,
  };
}

/** La remise appliquée : le code saisi ou le palier, le meilleur des deux. */
function currentDiscount(sousTotal) {
  const palier = tierDiscountFor(sousTotal);
  if (state.promo && state.promo.discount >= palier.discount) return state.promo;
  return palier.discount > 0 ? { ...palier, code: null, source: 'tier' } : { discount: 0, label: null };
}

/** Dernier refus de code, gardé jusqu'à la prochaine saisie. */
let promoError = null;

const lignesPourLeServeur = () =>
  state.panier.map((l) => ({ id: l.id, variantId: l.variantId, quantity: l.qte }));

async function applyPromo() {
  const code = $('promoCode').value.trim();
  if (!code) {
    state.promo = null;
    promoError = null;
    showPromoStatus('', null);
    renderPanier();
    return;
  }
  if (!state.panier.length) return showPromoStatus(t('commande.ajouteDabord'), false);

  const bouton = $('promoApply');
  bouton.disabled = true;
  promoError = null;
  try {
    const result = await previewPromo(code);
    state.promo = result.code ? result : null;
    showPromoStatus(result.code
      ? t('commande.codeApplique', { code: result.code, montant: formatPrice(result.discount) })
      : t('commande.palierMieux', { label: result.label ?? '' }), true);
    haptic('success');
  } catch (err) {
    state.promo = null;
    promoError = err.message;
  } finally {
    bouton.disabled = false;
    renderPanier();
  }
}

async function previewPromo(code) {
  const res = await fetch('/api/promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg?.initData ?? '' },
    body: JSON.stringify({ code, items: lignesPourLeServeur() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? t('commande.codeRefuse'));
  return data;
}

function showPromoStatus(message, ok) {
  const el = $('promoStatus');
  el.textContent = message;
  el.hidden = !message;
  el.classList.toggle('promo__status--ok', ok === true);
  el.classList.toggle('promo__status--ko', ok === false);
}

/** Le panier a bougé sous un code posé : on le revalide au calme. */
let promoTimer;
function revalidatePromo() {
  if (!state.promo) return;
  clearTimeout(promoTimer);
  promoTimer = setTimeout(async () => {
    const code = state.promo?.code;
    if (!code || !state.panier.length) {
      state.promo = null;
      showPromoStatus('', null);
      return renderPanier();
    }
    try {
      const result = await previewPromo(code);
      state.promo = result.code ? result : null;
    } catch (err) {
      state.promo = null;
      promoError = err.message;
    }
    renderPanier();
  }, 400);
}

/* ── L'envoi de la commande ──────────────────────────────── */

function adresseSaisie() {
  const propre = (id) => $(id).value.replace(/\s+/g, ' ').trim();
  return {
    street: propre('orderStreet'),
    complement: propre('orderComplement'),
    postalCode: propre('orderPostal'),
    city: propre('orderCity'),
  };
}

/** Les mêmes règles que le serveur, pour dire tout de suite quel champ remplir. */
function adresseIncomplete(adresse) {
  if (adresse.street.length < 5) return { champ: 'orderStreet', texte: t('commande.manqueRue') };
  if (!/^\d{2,6}$/.test(adresse.postalCode)) return { champ: 'orderPostal', texte: t('commande.manqueCP') };
  if (adresse.city.length < 2) return { champ: 'orderCity', texte: t('commande.manqueVille') };
  return null;
}

/**
 * Envoie la commande au serveur, comme Napoli : elle reçoit une référence,
 * le vendeur est prévenu dans Telegram avec ses boutons de statut, le stock
 * est réservé, et le client la retrouve dans « Mes commandes ».
 *
 * Un refus du serveur est un refus. Seul un serveur injoignable fait
 * retomber sur l'ancien chemin : le récapitulatif à envoyer sur Snapchat.
 */
async function passerLaCommande() {
  const chiffre = detailler(state.panier, state.products);
  if (!chiffre.detail.length) return;

  const note = $('orderNote').value.trim();
  const contact = $('orderContact').value.trim();
  const adresse = adresseSaisie();
  if (state.mode === 'delivery') {
    const manque = adresseIncomplete(adresse);
    if (manque) {
      toast(manque.texte);
      $(manque.champ).focus();
      return;
    }
  }

  const bouton = $('panierCommander');
  bouton.disabled = true;
  bouton.textContent = t('commande.preparation');
  const creneau = state.slots.find((s) => s.id === state.slotId) ?? null;

  let commande = null;
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData ?? '',
        'X-Shop-Pass': readPass() ?? '',
      },
      body: JSON.stringify({
        items: lignesPourLeServeur(),
        mode: state.mode,
        promoCode: state.promo?.code ?? null,
        postalCode: adresse.postalCode || null,
        slotId: state.slotId || null,
        address: state.mode === 'delivery' ? adresse : null,
        contact,
        note,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'VERIFICATION_REQUISE') {
        await gateVerification();
        return renderPanier();
      }
      if (data.error === 'CAPTCHA_REQUIS') {
        writePass('');
        await openCaptcha();
        return renderPanier();
      }
      // Quelque chose a bougé : un dernier article parti, un créneau rempli.
      await Promise.all([refreshCatalog(), loadSlots()]);
      toast(data.error ?? t('commande.refusee'));
      haptic('error');
      return renderPanier();
    }
    commande = data;
  } catch (err) {
    console.warn('Enregistrement de la commande impossible :', err);
    renderPanier();
    return commanderLePanier();
  }

  haptic('success');
  montrerLaCommandeFaite(commande, creneau);
  state.panier = [];
  state.promo = null;
  promoError = null;
  $('promoCode').value = '';
  $('orderNote').value = '';
  state.slotId = '';
  ecrireLePanier();
  renderPanier();
  loadSlots();
  chargerLesAvisADonner();
  refreshCatalog();
}

/** L'accusé de réception, avec ce que le serveur a vraiment enregistré. */
function montrerLaCommandeFaite(commande, creneau) {
  $('doneRef').textContent = commande.reference;
  $('doneText').textContent = t(state.features.clientNotifications === false ? 'done.texteSans' : 'done.texte');
  const lignes = [
    ...(commande.items ?? []).map((l) => `${l.quantity} × ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ''}`),
    commande.mode === 'delivery'
      ? `${t('done.livraison')}${commande.zone ? ` — ${commande.zone.name}` : ''}`
      : t('done.retrait'),
    commande.slot?.label || creneau?.label ? `🕒 ${commande.slot?.label ?? creneau.label}` : null,
    commande.discount ? `${t('commande.remise')}${commande.promoCode ? ` ${commande.promoCode}` : ''} : −${formatPrice(commande.discount)}` : null,
    commande.deliveryFee ? `${t('commande.fraisLivraison')} : ${formatPrice(commande.deliveryFee)}` : null,
  ].filter(Boolean);
  const total = document.createElement('li');
  total.append(Object.assign(document.createElement('b'), { textContent: `${t('panier.total')} : ${formatPrice(commande.total)}` }));
  $('doneLines').replaceChildren(
    ...lignes.map((texte) => Object.assign(document.createElement('li'), { textContent: texte })),
    total
  );
  openSheet('doneSheet');
}

/** Le récapitulatif, à copier et à envoyer sur Snapchat. */
function texteDuPanier() {
  return recapitulatif(detailler(state.panier, state.products), {
    boutique: state.shop?.shopName ?? '',
    titre: t('panier.recapTitre'),
    totalMot: t('panier.total'),
    formatPrix: formatPrice,
  });
}

function commanderLePanier() {
  if (!state.panier.length) return;
  $('commandeRecap').textContent = texteDuPanier();
  $('commandeRecapZone').hidden = false;
  $('commandeCopier').hidden = false;
  montrerOuCommander();
  haptic('light');
}

async function copierLeRecap() {
  const texte = $('commandeRecap').textContent;
  try {
    await navigator.clipboard.writeText(texte);
    toast(t('panier.copie'));
    haptic('success');
  } catch {
    // Une WebView sans presse-papiers : on sélectionne le texte, le client
    // n'a plus qu'à copier lui-même.
    const zone = document.createRange();
    zone.selectNodeContents($('commandeRecap'));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(zone);
    toast(t('panier.copieImpossible'));
  }
}

/**
 * Dit COMMENT commander : sur Snapchat. Le compte du vendeur ne s'affiche
 * pas dans une boutique ouverte à tous, il se donne ailleurs. Le panier
 * reste derrière : le client referme et retrouve ce qu'il avait choisi.
 */
function montrerOuCommander() {
  openSheet('commandeSheet');
}

/* ── Les favoris, en onglet ──────────────────────────────── */

async function ouvrirLesFavoris() {
  const grille = $('favorisGrille');
  const peindre = () => {
    const produits = state.products.filter((p) => estFavori(p.id));
    grille.replaceChildren(...produits.map(productCard));
    $('favorisVide').hidden = produits.length > 0;
    $('favorisVide').textContent = tg?.initData ? t('favoris.vide') : t('commandes.depuisTelegram');
  };
  peindre();
}

/* ── Liste d'attente ─────────────────────────────────────── */

/**
 * Le bouton dit si le client est déjà inscrit pour cet article.
 *
 * L'inscription vit côté serveur, par format : le même produit peut être
 * attendu en 5 g et disponible en 1 g. Sans signature Telegram on ne demande
 * rien — le bouton reste sur « préviens-moi », et le serveur refusera.
 */
async function refreshWaitlistButton() {
  const notify = $('notifyMe');
  const libelle = $('notifyLibelle');
  notify.disabled = false;
  libelle.textContent = t('produit.prevenir');
  if (!tg?.initData || !state.current) return;

  try {
    const params = new URLSearchParams({ id: state.current.id });
    if (state.currentVariant) params.set('variantId', state.currentVariant);
    const res = await fetch(`/api/waitlist?${params}`, {
      headers: { 'X-Telegram-Init-Data': tg.initData },
    });
    if (!res.ok) return;
    if ((await res.json()).subscribed) {
      notify.disabled = true;
      libelle.textContent = t('produit.prevenu');
    }
  } catch (err) {
    console.warn(err);
  }
}

/** S'inscrire au retour du format ouvert. */
async function joinWaitlist() {
  const notify = $('notifyMe');
  const libelle = $('notifyLibelle');
  if (!state.current) return;
  notify.disabled = true;

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData ?? '',
      },
      body: JSON.stringify({ id: state.current.id, variantId: state.currentVariant }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast(data.error ?? t('alerte.impossible'));
      notify.disabled = false;
      return;
    }

    libelle.textContent = t('produit.prevenu');
    toast(t('alerte.inscrit'));
    haptic('success');
  } catch (err) {
    console.error(err);
    toast(t('alerte.impossible'));
    notify.disabled = false;
  }
}

/* ── Mes commandes ───────────────────────────────────────── */

/**
 * L'historique vit côté serveur : c'est l'identifiant Telegram signé qui
 * décide de ce qu'on affiche, jamais le panier local.
 */
function orderCard(order) {
  const status = state.statuses[order.status] ?? { label: order.status, emoji: '•' };
  const date = new Date(order.createdAt).toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const card = document.createElement('article');
  card.className = 'order';
  card.innerHTML = `
    <div class="order__head">
      <span class="order__ref">${escapeHtml(order.reference)}</span>
      <span class="order__status order__status--${escapeHtml(order.status)}">${status.emoji} ${escapeHtml(status.label)}</span>
    </div>
    <p class="order__date">${escapeHtml(date)}</p>
    <ul class="order__items">
      ${order.items
        .map(
          (i) =>
            `<li>${i.quantity} × ${escapeHtml(i.name)}${
              i.variantLabel ? ` <small>${escapeHtml(i.variantLabel)}</small>` : ''
            }</li>`
        )
        .join('')}
    </ul>
    <p class="order__total">${formatPrice(order.total)}</p>`;
  return card;
}

/**
 * La description du vendeur, telle qu'il l'a écrite.
 *
 * Elle partait dans un `textContent`, qui écrase les retours à la ligne. Le
 * vendeur écrivait un titre, une étiquette et un paragraphe ; le client
 * lisait « Arômes et Saveurs Profil aromatique : Très fruité… », trois
 * morceaux recollés en une phrase qui n'en est pas une.
 *
 * Le découpage vit dans `description.js`, sans DOM, pour être vérifiable
 * sans navigateur. Ici on ne fait que poser les éléments — chacun reçoit son
 * texte en `textContent`, jamais en `innerHTML`. Ce texte vient de l'espace
 * admin, donc d'une main de confiance ; mais « de confiance aujourd'hui »
 * n'est pas une propriété du code.
 *
 * Rien n'est traduit ici : ce que le vendeur écrit reste dans sa langue,
 * comme les noms de produits.
 */
function peindreLaDescription(texte) {
  const hote = $('pDesc');
  if (!hote) return;
  hote.replaceChildren();

  for (const bloc of decouperLaDescription(texte)) {
    if (bloc.type === 'points') {
      const liste = document.createElement('ul');
      liste.className = 'pdetail__points';
      for (const item of bloc.items) {
        const point = document.createElement('li');
        point.textContent = item;
        liste.append(point);
      }
      hote.append(liste);
    } else {
      const para = document.createElement('p');
      para.className = 'pdetail__ligne';
      para.textContent = bloc.texte;
      hote.append(para);
    }
  }
}

/* ── Panneaux ────────────────────────────────────────────── */

/**
 * Montre ou cache la flèche de Telegram selon ce qui est ouvert.
 *
 * Deux choses la méritent maintenant — une feuille, et la fiche produit — et
 * elles s'ouvrent et se ferment par des chemins différents. Chacune la
 * réglant de son côté, elle restait affichée sur le catalogue après qu'on
 * avait refermé une feuille depuis une fiche : un bouton retour qui ne
 * revient nulle part.
 */
function syncBackButton() {
  const feuille = [...document.querySelectorAll('.sheet')].some((f) => !f.hidden);
  const fiche = state.onglet === 'produit';
  if (feuille || fiche) tg?.BackButton?.show();
  else tg?.BackButton?.hide();
}

/** « Retour au catalogue », « Retour aux catégories »… — dire où l'on retombe. */
function libelleDuRetour() {
  return {
    catalogue: t('retour.catalogue'),
    categories: t('retour.categories'),
    farms: t('retour.simple'),
    favoris: t('retour.simple'),
    panier: t('retour.simple'),
    contact: t('retour.simple'),
    profil: t('retour.profil'),
  }[state.retour] ?? t('retour.simple');
}

/** La flèche de Telegram, et celle de la fiche, font la même chose. */
function revenirEnArriere() {
  const feuille = [...document.querySelectorAll('.sheet')].some((f) => !f.hidden);
  if (feuille) return closeSheets();
  if (state.onglet === 'produit') return montrerLOnglet(state.retour);
}

function openSheet(id) {
  closeSheets();
  $(id).hidden = false;
  document.body.style.overflow = 'hidden';
  // La pastille de langue flotte au-dessus des voiles d'entrée — c'est voulu,
  // c'est là qu'un client perdu en a besoin. Au-dessus d'un panneau qu'on
  // lit, elle se pose en travers du texte : elle s'efface le temps qu'il
  // soit ouvert.
  document.body.classList.add('feuille-ouverte');
  syncBackButton();
  syncMainButton();
  // Les places partent pendant qu'on remplit son panier : on rafraîchit à
  // l'ouverture plutôt que de servir la liste chargée au démarrage.
}

function closeSheets() {
  // Une vidéo laissée en lecture continuerait de parler par-dessus le
  // catalogue, sans que le client sache d'où vient le son.
  // Les vidéos ne sont plus ici : la galerie vit dans la page de la fiche,
  // et c'est en la quittant qu'on les arrête. Fermer le panier par-dessus une
  // fiche ne doit pas couper la vidéo qu'on regardait derrière.
  for (const sheet of document.querySelectorAll('.sheet')) sheet.hidden = true;
  document.body.style.overflow = '';
  document.body.classList.remove('feuille-ouverte');
  syncBackButton();
  syncMainButton();
}

/**
 * Le bouton natif de Telegram.
 *
 * Il affichait le total du panier et y menait. Sans panier il n'a plus rien
 * à annoncer : le geste d'achat vit dans la fiche produit, et un bouton
 * système qui doublerait celui de la page dirait deux fois la même chose à
 * deux endroits. On le cache, sans quoi il resterait affiché avec le texte
 * de la session précédente.
 */
function syncMainButton() {
  tg?.MainButton?.hide();
}

/* ── Utilitaires ─────────────────────────────────────────── */

/**
 * Une illustration SVG flotte au milieu de son halo ; une photo, elle, doit
 * remplir le cadre. On distingue les deux sur l'extension du fichier.
 */
function isPhoto(src) {
  return !/\.svg($|[?#])/i.test(String(src ?? ''));
}

/** Telegram n'accepte que des couleurs hexadécimales : on convertit les
 *  jetons « R G B » du thème pour que la barre native suive la palette. */
function themeHex(token, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token);
  const parts = raw.match(/\d+/g);
  if (!parts || parts.length < 3) return fallback;
  return `#${parts.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}

/** Stock disponible pour un produit, ou pour une de ses variantes. */
function stockOf(product, variantId = null) {
  if (product.variants?.length) {
    const variant = product.variants.find((v) => v.id === variantId);
    return variant ? Number(variant.stock ?? 0) : 0;
  }
  return Number(product.stock ?? 0);
}

/** Un produit est épuisé quand aucune de ses variantes n'est disponible. */
function isSoldOut(product) {
  return product.variants?.length
    ? product.variants.every((v) => Number(v.stock ?? 0) <= 0)
    : stockOf(product) <= 0;
}

/**
 * Ce qu'il reste en stock.
 *
 * La fonction retranchait ce que le panier tenait déjà en réserve. Sans
 * panier, rien n'est réservé côté client : le stock affiché est celui du
 * serveur, tel quel.
 */
function remainingFor(product, variantId) {
  return Math.max(0, stockOf(product, variantId));
}

function unitPrice(product, variantId) {
  if (!product) return 0;
  return prixDuFormat(product, variantId).prix;
}

function formatPrice(cents) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: state.shop.currency || 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

function haptic(type) {
  const h = tg?.HapticFeedback;
  if (!h) return;
  if (type === 'success') h.notificationOccurred?.('success');
  else h.impactOccurred?.(type);
}

/* ── Avis ────────────────────────────────────────────────── */

/**
 * Cinq étoiles, pleines jusqu'à la note.
 *
 * La demi-étoile est volontairement absente : une moyenne de 4,3 s'écrit à
 * côté en chiffres, et un demi-glyphe rend la ligne illisible sur la carte d'un
 * catalogue à deux colonnes.
 */
function etoiles(note) {
  const pleines = Math.round(Number(note) || 0);
  return '★'.repeat(pleines) + '☆'.repeat(Math.max(0, 5 - pleines));
}

/** La note d'un produit, telle que le catalogue l'a envoyée. */
function noteDe(product) {
  return state.notes?.[product?.id] ?? null;
}

/**
 * La suggestion d'avis, en haut du catalogue.
 *
 * Elle ne s'adresse qu'à qui a reçu quelque chose sans rien en dire. Un client
 * qui n'a rien à noter ne doit jamais la voir — une boutique qui réclame un
 * avis à quelqu'un qui n'a rien acheté se fait fermer l'application.
 */
async function chargerLesAvisADonner() {
  const banniere = $('suggestionAvis');
  banniere.hidden = true;
  state.avisADonner = [];
  if (!tg?.initData || state.features.avis === false) return;

  // Son prénom vient de Telegram : l'écran d'avis lui montre ainsi ce qu'il
  // signerait exactement, plutôt qu'un « avec mon prénom » abstrait.
  state.prenom = tg.initDataUnsafe?.user?.first_name ?? '';

  try {
    const res = await fetch('/api/avis', { headers: { 'X-Telegram-Init-Data': tg.initData } });
    if (!res.ok) return;
    state.avisADonner = (await res.json()).aDonner ?? [];
    renderSuggestionAvis();
  } catch {
    /* pas de suggestion : la boutique marche très bien sans */
  }
}

function renderSuggestionAvis() {
  const banniere = $('suggestionAvis');
  const [commande] = state.avisADonner;
  if (!commande) return void (banniere.hidden = true);

  const noms = commande.produits.map((p) => p.nom);
  const reste = noms.length - 2;
  const detail = noms.length > 2
    ? t(reste > 1 ? 'liste.etAutres' : 'liste.etAutre',
      { liste: noms.slice(0, 2).join(', '), n: reste })
    : noms.join(', ');

  // Noter et ajouter un mot ne sont pas le même geste : demander « ton avis »
  // à quelqu'un qui vient de mettre cinq étoiles donne l'impression de n'avoir
  // rien vu.
  banniere.querySelector('b').textContent = t(commande.deja ? 'avis.ajouteUnMot' : 'avis.commentCetait');
  $('suggestionAvisDetail').textContent =
    t(commande.deja ? 'avis.tuAsNote' : 'avis.tonAvisSur', { quoi: detail });
  banniere.hidden = false;
}

/**
 * Ouvre l'écran d'avis sur une commande.
 *
 * Une étoile par produit, et un seul champ de texte : le client a reçu une
 * commande, pas trois formulaires. Un produit qu'il ne veut pas noter, il le
 * laisse à zéro et on ne l'envoie pas.
 */
function ouvrirLAvis(commande) {
  if (!commande) return;

  // Ce qu'il avait déjà mis — une étoile touchée dans la conversation du bot,
  // par exemple. Rouvrir sur cinq étoiles vides lui ferait croire que son geste
  // s'est perdu, et il repartirait sans ajouter le mot qu'on lui demande.
  const deja = commande.deja ?? null;
  state.avisEnCours = {
    reference: commande.reference,
    notes: { ...(deja?.notes ?? {}) },
    anonyme: Boolean(deja?.anonyme),
  };

  const noms = commande.produits.map((p) => p.nom).join(', ');
  $('avisIntro').textContent = deja
    ? t('avis.dejaNote', { quoi: noms })
    : t('avis.commandeRef', { ref: commande.reference, quoi: noms });
  $('avisTexte').value = '';

  $('avisProduits').replaceChildren(
    ...commande.produits.map((produit) => ligneDeNotation(produit, state.avisEnCours.notes[produit.id] ?? 0))
  );

  $('avisSigneNom').textContent = state.prenom
    ? t('avis.avecPrenom', { prenom: state.prenom })
    : t('avis.signe');
  renderSignature();

  $('avisEnvoyer').disabled = false;
  $('avisEnvoyer').textContent = t('avis.envoyer');
  openSheet('avisSheet');
  haptic('light');
}

/**
 * Signé ou anonyme, à chaque avis.
 *
 * Le choix se repose à chaque fois plutôt que de se retenir une fois pour
 * toutes : on ne dit pas la même chose sous son prénom selon ce qu'on achète,
 * et un réglage oublié dans un menu publierait un nom que personne n'a voulu.
 */
function renderSignature() {
  for (const choix of $('avisSignature').querySelectorAll('.signature__choix')) {
    const anonyme = choix.dataset.anonyme === 'oui';
    choix.setAttribute('aria-pressed', String(anonyme === state.avisEnCours.anonyme));
  }
}

/** Un produit, cinq boutons. Toucher une étoile note jusqu'à elle. */
function ligneDeNotation(produit, depart = 0) {
  const ligne = document.createElement('div');
  ligne.className = 'notation';
  ligne.innerHTML =
    `<span class="notation__nom">${escapeHtml(produit.nom)}` +
    `${produit.variante ? ` <small>${escapeHtml(produit.variante)}</small>` : ''}</span>` +
    '<div class="notation__etoiles" role="group"></div>';

  const boite = ligne.querySelector('.notation__etoiles');
  const boutons = [];

  const peindre = (jusqua) => {
    boutons.forEach((b, rang) => b.classList.toggle('est-pleine', rang < jusqua));
  };
  // Peint après la boucle : les boutons n'existent pas encore ici.
  queueMicrotask(() => peindre(depart));

  for (let note = 1; note <= 5; note += 1) {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'notation__etoile';
    bouton.textContent = '★';
    bouton.setAttribute('aria-label', t(note > 1 ? 'avis.desEtoiles' : 'avis.uneEtoile', { n: note }));
    bouton.addEventListener('click', () => {
      state.avisEnCours.notes[produit.id] = note;
      peindre(note);
      haptic('light');
    });
    boutons.push(bouton);
    boite.append(bouton);
  }

  return ligne;
}

async function envoyerLAvis() {
  const bouton = $('avisEnvoyer');
  const encours = state.avisEnCours;
  if (!encours) return;

  const notes = encours.notes;
  if (!Object.keys(notes).length) {
    toast(t('avis.toucheUneEtoile'));
    haptic('warning');
    return;
  }

  bouton.disabled = true;
  bouton.textContent = t('avis.envoi');
  try {
    const res = await fetch('/api/avis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData ?? '',
      },
      body: JSON.stringify({
        reference: encours.reference,
        notes,
        texte: $('avisTexte').value,
        anonyme: encours.anonyme,
      }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? t('avis.refuse'));

    closeSheets();
    toast(t('avis.merci'));
    haptic('success');
    // La commande notée sort de la file : la bannière propose la suivante, ou
    // disparaît. Et le catalogue reprend les moyennes, que cet avis vient de
    // faire bouger.
    state.avisADonner = state.avisADonner.filter((c) => c.reference !== encours.reference);
    state.avisEnCours = null;
    renderSuggestionAvis();
    refreshCatalog();
  } catch (err) {
    toast(err.message);
    haptic('error');
  }
  bouton.disabled = false;
  bouton.textContent = t('avis.envoyer');
}

/**
 * Les avis d'un produit, dans sa fiche.
 *
 * Chargés à l'ouverture de la fiche et pas avec le catalogue : la moyenne tient
 * dans un nombre et voyage avec la grille, les commentaires sont du texte qu'on
 * ne télécharge que pour le produit qu'on regarde.
 */
async function chargerLesAvis(product) {
  const section = $('pAvis');
  const lien = $('pNote');
  const resume = noteDe(product);

  // La note est déjà connue : on l'affiche sans attendre le réseau.
  if (resume) {
    lien.innerHTML =
      `<span class="note__etoiles">${etoiles(resume.moyenne)}</span>` +
      `<span class="note__chiffre">${resume.moyenne.toFixed(1).replace('.', ',')}</span>` +
      `<span class="note__nombre">${resume.nombre} avis</span>`;
    lien.hidden = false;
  } else {
    lien.hidden = true;
  }

  section.hidden = true;
  if (state.features.avis === false) return;

  try {
    const res = await fetch(`/api/avis/${encodeURIComponent(product.id)}`);
    if (!res.ok) return;
    const data = await res.json();
    // La fiche a pu changer pendant l'aller-retour : on n'écrit pas les avis
    // d'un produit dans la fiche d'un autre.
    if (state.current?.id !== product.id) return;
    renderAvis(data);
  } catch {
    /* les avis ne sont pas la boutique : leur absence ne bloque rien */
  }
}

function renderAvis({ avis, resume }) {
  const section = $('pAvis');
  if (!avis?.length) return void (section.hidden = true);

  $('pAvisTitre').textContent = t('avis.compte', { n: resume?.nombre ?? avis.length });
  $('pAvisBarres').replaceChildren(resume ? barresDeNotes(resume) : document.createComment(''));

  // Trois avis visibles, le reste sur demande : une fiche produit n'est pas un
  // forum, et le bouton « Ajouter » doit rester à portée de pouce.
  const visibles = state.avisTousVisibles ? avis : avis.slice(0, 3);
  $('pAvisListe').replaceChildren(...visibles.map(carteDAvis));

  const plus = $('pAvisPlus');
  plus.hidden = state.avisTousVisibles || avis.length <= 3;
  plus.textContent = t('avis.voirLesN', { n: avis.length });
  plus.onclick = () => {
    state.avisTousVisibles = true;
    renderAvis({ avis, resume });
  };

  section.hidden = false;
}

/**
 * La répartition des notes, en barres.
 *
 * Elle dit ce que la moyenne cache : 4,0 obtenu avec dix « 4 » et 4,0 obtenu
 * avec cinq « 5 » et cinq « 3 » ne racontent pas la même boutique.
 */
function barresDeNotes(resume) {
  const bloc = document.createElement('div');
  const maximum = Math.max(...resume.repartition, 1);

  bloc.innerHTML = [5, 4, 3, 2, 1]
    .map((note) => {
      const combien = resume.repartition[note - 1];
      const part = Math.round((combien / maximum) * 100);
      return (
        '<div class="avis__barre">' +
        `<span class="avis__barre-note">${note}★</span>` +
        `<span class="avis__barre-piste"><span class="avis__barre-plein" style="width:${part}%"></span></span>` +
        `<span class="avis__barre-nombre">${combien}</span>` +
        '</div>'
      );
    })
    .join('');

  return bloc;
}

function carteDAvis(avis) {
  const li = document.createElement('li');
  li.className = 'avis__item';
  li.innerHTML =
    '<div class="avis__tete">' +
    `<span class="avis__etoiles">${etoiles(avis.note)}</span>` +
    `<span class="avis__qui">${escapeHtml(avis.prenom ?? 'Client')}</span>` +
    `<span class="avis__quand">${escapeHtml(dateCourte(avis.createdAt))}</span>` +
    '</div>' +
    (avis.texte ? `<p class="avis__texte">${escapeHtml(avis.texte)}</p>` : '') +
    (avis.reponse
      ? '<div class="avis__reponse">' +
        `<b>${escapeHtml(t('avis.reponseBoutique'))}</b><p>${escapeHtml(avis.reponse.texte)}</p></div>`
      : '');
  return li;
}

function dateCourte(iso) {
  const quand = new Date(iso);
  if (!Number.isFinite(quand.getTime())) return '';
  return quand.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Profil ──────────────────────────────────────────────── */

/**
 * Ouvre le profil, et charge tout d'un coup.
 *
 * Commandes, favoris et alertes arrivent dans la même réponse : trois
 * allers-retours pour ouvrir un écran, c'est trois occasions de l'afficher à
 * moitié rempli sur un réseau de téléphone.
 */
async function ouvrirProfil() {
  // La vue est déjà à l'écran quand on arrive par la barre du bas ; l'appel
  // reste pour les autres chemins — le cœur d'un favori qu'on retire, par
  // exemple, qui recharge la liste en repassant par ici.
  if (state.onglet !== 'profil') return montrerLOnglet('profil');
  montrerLaVue(state.profilVue);

  renderIdentite();
  renderChiffres();
  $('ordersEmpty').hidden = false;
  $('ordersEmpty').textContent = t('msg.chargement');

  if (!tg?.initData) {
    $('ordersEmpty').textContent = t('commandes.depuisTelegram');
    return;
  }

  try {
    const res = await fetch('/api/profil', { headers: { 'X-Telegram-Init-Data': tg.initData } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const profil = await res.json();

    state.favoris = new Set(profil.favoris.map((p) => p.id));
    state.preferences = profil.preferences;
    // Gardée pour un changement de langue : repeindre ne doit pas coûter un
    // aller-retour réseau, ni risquer d'arriver après le prochain rendu.
    state.profil = profil;

    renderCommandes(profil.commandes);
    renderFavoris(profil.favoris);
    renderAlertes(profil);
    chargerLeSecours();
    renderPastilleProfil();
    renderChiffres(profil.commandes?.length);
    // La grille porte les mêmes cœurs : les repeindre ici évite qu'un favori
    // retiré depuis le profil reste allumé derrière la feuille.
    renderGrid();
  } catch (err) {
    console.error(err);
    $('ordersEmpty').textContent = t('commandes.profilIndispo');
  }
}

/** Une vue à la fois : les trois d'un bloc feraient défiler trois écrans. */
function montrerLaVue(vue) {
  state.profilVue = vue;
  for (const onglet of $('profilOnglets').querySelectorAll('.profil__onglet')) {
    onglet.setAttribute('aria-selected', String(onglet.dataset.vue === vue));
  }
  for (const section of document.querySelectorAll('.profil__vue')) {
    section.hidden = section.dataset.vue !== vue;
  }
}

function renderCommandes(commandes) {
  const liste = $('ordersList');
  const vide = $('ordersEmpty');
  liste.replaceChildren();

  if (state.features.orderHistory === false) {
    vide.hidden = false;
    vide.textContent = t('commandes.desactivees');
    return;
  }
  if (!commandes.length) {
    vide.hidden = false;
    vide.textContent = t('commandes.vide');
    return;
  }
  vide.hidden = true;
  liste.replaceChildren(...commandes.map(orderCard));
}

/**
 * Les favoris, en cartes qu'on peut rouvrir.
 *
 * Une carte mène à la fiche produit, pas au panier : un favori est une envie,
 * pas une commande. Le raccourci « ajouter » ferait acheter un format et une
 * quantité que personne n'a choisis.
 */
function renderFavoris(favoris) {
  const liste = $('favorisList');
  const vide = $('favorisEmpty');
  const compte = $('favorisCompte');

  compte.hidden = !favoris.length;
  compte.textContent = String(favoris.length);

  if (state.features.favoris === false) {
    liste.replaceChildren();
    vide.hidden = false;
    vide.textContent = t('favoris.desactives');
    return;
  }
  if (!favoris.length) {
    liste.replaceChildren();
    vide.hidden = false;
    vide.textContent = t('favoris.vide');
    return;
  }

  vide.hidden = true;
  liste.replaceChildren(
    ...favoris.map((produit) => {
      const carte = document.createElement('article');
      carte.className = 'favori';
      const epuise = isSoldOut(produit);

      carte.innerHTML =
        '<div class="favori__corps">' +
        `<span class="favori__nom">${escapeHtml(produit.name)}</span>` +
        // Les favoris étaient la dernière liste à afficher « dès 20 € ». Le
        // prix d'entrée sorti de son format ne veut rien dire, et le laisser
        // ici seul aurait rendu le seul écran où il subsiste le seul auquel
        // on ne peut pas se fier.
        (epuise ? `<span class="favori__etat">${escapeHtml(t('favori.epuiseAlerte'))}</span>` : '') +
        '</div>' +
        `<button class="favori__coeur" type="button" aria-label="${escapeHtml(t('favori.retirer'))}">♥</button>`;

      // La vignette est posée devant le corps plutôt qu'écrite dans le
      // gabarit : selon le produit c'est une image ou une vidéo, et un
      // gabarit de chaîne ne sait fabriquer qu'une des deux.
      const vignette = vignetteDuProduit(produit, 'favori__image');
      carte.prepend(vignette);
      vignette.addEventListener('click', () => openProduct(produit));
      carte.querySelector('.favori__corps').addEventListener('click', () => openProduct(produit));
      carte.querySelector('.favori__coeur').addEventListener('click', async (ev) => {
        ev.stopPropagation();
        await basculerFavori(produit.id);
        // On recharge la liste plutôt que de retirer la carte à la main : le
        // compteur, le vide et la grille doivent bouger ensemble.
        ouvrirProfil();
      });
      return carte;
    })
  );
}

/**
 * Les interrupteurs d'alertes.
 *
 * Construits depuis ce que le serveur déclare, pas depuis une liste recopiée
 * ici : ajouter un canal côté serveur doit suffire à le voir apparaître.
 */
/**
 * La porte de secours, telle que le client doit la voir.
 *
 * Elle ne raconte pas une panne qui n'a pas eu lieu. Le texte dit une chose
 * simple et vraie : il y a une seconde conversation, écris-lui une fois, et
 * tu resteras joignable. Personne n'a besoin de savoir qu'un bot de vente se
 * fait fermer — le client a besoin d'avoir fait le geste avant.
 *
 * Une fois enregistrée, la carte reste : elle change de ton, pas de place.
 * La faire disparaître priverait le client de la seule façon de vérifier
 * qu'il est couvert, et c'est exactement la question qu'il se posera le
 * jour où il en aura besoin.
 */
function renderSecours() {
  const zone = $('profilSecours');
  if (!zone) return;
  const etat = state.secours;
  zone.hidden = !etat?.disponible;
  if (!etat?.disponible) return;

  zone.classList.toggle('profil__secours--fait', Boolean(etat.inscrit));
  $('secoursTexte').textContent = etat.inscrit ? t('secours.faitAide') : t('secours.texte');
  const lien = $('secoursLien');
  lien.textContent = etat.inscrit ? t('secours.fait') : t('secours.ouvrir');
  lien.href = etat.lien;
}

/**
 * Va chercher l'état du secours, et ne fait rien de bruyant s'il n'y arrive
 * pas : une carte absente vaut mieux qu'un message d'erreur pour un réglage
 * dont le client n'a jamais entendu parler.
 */
async function chargerLeSecours() {
  try {
    const res = await fetch('/api/secours', {
      headers: { 'X-Telegram-Init-Data': tg?.initData ?? '' },
    });
    if (!res.ok) return;
    state.secours = await res.json();
  } catch {
    state.secours = null;
  }
  renderSecours();

  // Le client part écrire au bot de secours, puis revient. Sans cette
  // relecture au retour, la carte lui redemanderait de faire ce qu'il vient
  // de faire — et il le referait, en doutant que ça ait marché. On ne pose
  // l'écoute qu'une fois, et seulement tant qu'il reste quelque chose à
  // constater.
  if (state.secours?.disponible && !state.secours.inscrit && !retourEcoute) {
    retourEcoute = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !state.secours?.inscrit) {
        chargerLeSecours().catch(() => {});
      }
    });
  }
}

/** L'écoute du retour ne se pose qu'une fois, quoi qu'il arrive ensuite. */
let retourEcoute = false;

function renderAlertes({ canaux, preferences, desabonne }) {
  $('profilStop').hidden = !desabonne;

  $('alertesList').replaceChildren(
    ...canaux.map((canal) => {
      const ligne = document.createElement('button');
      ligne.type = 'button';
      ligne.className = 'alerte';
      ligne.setAttribute('role', 'switch');
      ligne.setAttribute('aria-checked', String(preferences[canal.clef] !== false));
      // Le serveur dit quels canaux existent, le dictionnaire comment ils se
      // lisent. Son libellé reste le repli : un canal ajouté demain
      // s'affichera en français plutôt que de sortir vide.
      const libelle = TEXTES[langue]?.[`alertes.${canal.clef}`] ?? canal.label;
      const aide = TEXTES[langue]?.[`alertes.${canal.clef}Aide`] ?? canal.hint;
      ligne.innerHTML =
        '<span class="alerte__texte">' +
        `<b>${escapeHtml(libelle)}</b>` +
        `<small>${escapeHtml(aide)}</small>` +
        '</span>' +
        '<span class="alerte__bouton" aria-hidden="true"></span>';

      ligne.addEventListener('click', () => basculerAlerte(canal.clef, ligne));
      return ligne;
    })
  );
}

async function basculerAlerte(clef, ligne) {
  const avant = ligne.getAttribute('aria-checked') === 'true';
  // On bascule tout de suite : un interrupteur qui attend le réseau avant de
  // bouger donne l'impression de ne pas avoir été touché, et on appuie deux fois.
  ligne.setAttribute('aria-checked', String(!avant));
  haptic('light');

  try {
    const res = await fetch('/api/profil/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg?.initData ?? '' },
      body: JSON.stringify({ [clef]: !avant }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.preferences = await res.json();
    ligne.setAttribute('aria-checked', String(state.preferences[clef] !== false));
  } catch {
    // Le serveur n'a pas suivi : on remet l'interrupteur où il était, sinon
    // l'écran promet un réglage qui n'existe pas.
    ligne.setAttribute('aria-checked', String(avant));
    toast(t('msg.reglageRefuse'));
    haptic('error');
  }
}

/* ── Favoris ─────────────────────────────────────────────── */

/** Charge les identifiants seuls : de quoi peindre les cœurs de la grille. */
async function chargerLesFavoris() {
  state.favoris = new Set();
  if (!tg?.initData || state.features.favoris === false) return;
  try {
    const res = await fetch('/api/favoris', { headers: { 'X-Telegram-Init-Data': tg.initData } });
    if (!res.ok) return;
    const data = await res.json();
    state.favoris = new Set(data.favoris);
    renderPastilleProfil();
    renderGrid();
  } catch {
    /* pas de favoris : la boutique marche très bien sans */
  }
}

const estFavori = (id) => state.favoris?.has(id) ?? false;

/**
 * Met ou retire un favori, et rend le nouvel état.
 *
 * L'écran est peint avant la réponse du serveur — un cœur qui attend le réseau
 * paraît cassé — mais il est remis en place si le serveur refuse.
 */
async function basculerFavori(productId) {
  const avant = estFavori(productId);
  if (avant) state.favoris.delete(productId);
  else state.favoris.add(productId);
  renderPastilleProfil();
  haptic('light');

  try {
    const res = await fetch('/api/favoris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg?.initData ?? '' },
      body: JSON.stringify({ id: productId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);

    const { favori } = await res.json();
    if (favori) state.favoris.add(productId);
    else state.favoris.delete(productId);
  } catch (err) {
    if (avant) state.favoris.add(productId);
    else state.favoris.delete(productId);
    toast(err.message);
    haptic('error');
  }

  renderPastilleProfil();
  return estFavori(productId);
}

/**
 * Les quatre compteurs en haut du profil.
 *
 * Aucun n'est un chiffre qu'il faudrait aller chercher : le panier et les
 * favoris sont déjà en mémoire, le catalogue aussi, et le nombre de commandes
 * arrive avec le profil. Un compteur qui coûterait un appel réseau de plus
 * n'aurait pas sa place ici — on ouvre cet écran pour ses commandes, pas pour
 * son nombre de commandes.
 *
 * @param {number} [commandes] le compte venu du serveur ; sinon on garde
 *   celui qu'on affichait déjà, plutôt que de repasser à zéro le temps du
 *   chargement.
 */
let commandesConnues = null;
function renderChiffres(commandes) {
  if (Number.isFinite(commandes)) commandesConnues = commandes;

  const lignes = [
    ['commandes', commandesConnues ?? '—', t('profil.commandes')],
    ['favoris', state.favoris?.size ?? 0, t('profil.favoris')],
    ['produits', state.products.length, t('profil.produits')],
  ];

  $('profilChiffres').replaceChildren(
    ...lignes.map(([clef, valeur, label]) => {
      const colonne = document.createElement('div');
      // « plein » teinte le nombre : un panier vide et un panier à trois
      // articles ne doivent pas se ressembler dans un bandeau de quatre
      // chiffres qu'on parcourt d'un regard.
      const plein = Number(valeur) > 0;
      colonne.className = `chiffre chiffre--${clef}${plein ? ' chiffre--plein' : ''}`;
      const nombre = document.createElement('b');
      nombre.className = 'chiffre__valeur';
      nombre.textContent = String(valeur);
      const nom = document.createElement('span');
      nom.className = 'chiffre__label';
      nom.textContent = label;
      colonne.append(nombre, nom);
      return colonne;
    })
  );
}

/**
 * La ligne sous l'enseigne : ouvert ou fermé, et la taille du catalogue.
 *
 * Deux informations qu'on cherche en arrivant, et qui occupaient jusqu'ici
 * un bandeau à part poussant le catalogue vers le bas. Sous le nom, elles ne
 * coûtent pas une ligne d'écran — et elles suivent l'en-tête, qui reste
 * collé en haut pendant qu'on fait défiler.
 */
function renderSousTitre() {
  const ligne = $('shopSous');
  if (!ligne) return;
  const ouvert = state.opening?.open !== false;
  const etat = document.createElement('b');
  etat.textContent = t(ouvert ? 'etat.ouvertCourt' : 'etat.fermeCourt');
  etat.classList.toggle('est-ferme', !ouvert);
  const combien = state.products.length;
  ligne.replaceChildren(
    etat,
    document.createTextNode(combien
      ? ` · ${combien > 1 ? t('rayon.produits', { n: combien }) : t('rayon.unProduit')}`
      : '')
  );
}

/**
 * Le nom, l'initiale et la ligne « client de … » en tête du profil.
 *
 * À part, et non dans `ouvrirProfil`, parce que le sélecteur de langue est
 * juste en dessous : changer de langue ne recharge pas le profil, et cette
 * ligne restait dans la langue d'avant, à trois centimètres du drapeau qu'on
 * venait de toucher.
 */
function renderIdentite() {
  const nom = $('profilNom');
  if (!nom) return;
  nom.textContent = state.prenom ? state.prenom : t('profil.titre');
  $('profilVignette').textContent = (state.prenom || '?').trim().charAt(0).toUpperCase();
  $('profilQui').textContent = state.prenom
    ? t('profil.client', { boutique: state.shop?.shopName ?? '' }).trim()
    : '';
}

/** Le compteur sur l'icône du profil : il dit qu'il y a quelque chose à y voir. */
function renderPastilleProfil() {
  const pastille = $('favorisPastille');
  const combien = state.favoris?.size ?? 0;
  pastille.hidden = combien === 0;
  pastille.textContent = String(combien);
}

/** Le cœur d'une fiche produit, avec son état. */
function peindreLeCoeur(bouton, id) {
  const actif = estFavori(id);
  bouton.classList.toggle('est-favori', actif);
  bouton.setAttribute('aria-pressed', String(actif));
  bouton.setAttribute('aria-label', t(actif ? 'favori.retirer' : 'favori.mettre'));
}

/* ── Présence ────────────────────────────────────────────── */

/**
 * Dit au serveur qu'on est toujours là.
 *
 * Sans ce battement, quelqu'un qui lit une fiche produit pendant cinq minutes
 * disparaîtrait de la liste des présents : le serveur ne compte que les appels,
 * et lire n'en fait aucun.
 *
 * Deux précautions qui comptent sur un téléphone :
 *
 * - **rien ne bat quand la page n'est pas visible.** Une boutique laissée
 *   ouverte dans un onglet de fond ne doit ni consommer de données ni faire
 *   croire au vendeur qu'un client la regarde ;
 * - **le premier geste au retour**, pour que revenir sur la boutique se voie
 *   tout de suite et pas à la minute suivante.
 */
function battreLePouls() {
  if (!tg?.initData) return;

  const battre = () => {
    if (document.visibilityState !== 'visible') return;
    fetch('/api/presence', {
      method: 'POST',
      headers: { 'X-Telegram-Init-Data': tg.initData },
      // La réponse ne nous intéresse pas, et une coupure de réseau n'a aucune
      // raison de remonter : ce n'est qu'un signe de vie.
      keepalive: true,
    }).catch(() => {});
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') battre();
  });
  setInterval(battre, 60000);
}
