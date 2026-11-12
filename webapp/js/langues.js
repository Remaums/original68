/**
 * Les textes de la boutique, en trois langues.
 *
 * Un seul fichier plutôt qu'un par langue : à cette taille, trois fichiers
 * obligeraient à ouvrir trois onglets pour vérifier qu'une clef existe
 * partout, et c'est exactement l'oubli qui produit un « undefined » à
 * l'écran. Côte à côte, une traduction manquante se voit.
 *
 * Le français est la langue de référence : c'est celle qui est écrite en
 * premier, et celle qui sert de repli quand une clef manque ailleurs. Un
 * texte non traduit s'affiche donc en français plutôt que de disparaître.
 *
 * Ce que ce fichier ne traduit pas, et ne traduira pas : les noms et les
 * descriptions des produits. Ils sont écrits par le vendeur, dans sa langue,
 * et une machine qui traduirait « Plasma Static — Banana Kush » rendrait un
 * service à personne.
 */

/**
 * `locale` n'est pas le code de la langue : une date écrite pour « en » seul
 * sortirait à l'américaine (« Mar 3 »), là où la boutique vend en Europe.
 * C'est la seule chose que ce fichier dise du format des nombres et des dates.
 */
export const LANGUES = [
  { code: 'fr', nom: 'Français', drapeau: '🇫🇷', locale: 'fr-FR' },
  { code: 'en', nom: 'English', drapeau: '🇬🇧', locale: 'en-GB' },
  { code: 'de', nom: 'Deutsch', drapeau: '🇩🇪', locale: 'de-DE' },
  { code: 'es', nom: 'Español', drapeau: '🇪🇸', locale: 'es-ES' },
  { code: 'it', nom: 'Italiano', drapeau: '🇮🇹', locale: 'it-IT' },
  { code: 'nl', nom: 'Nederlands', drapeau: '🇳🇱', locale: 'nl-NL' },
  { code: 'pt', nom: 'Português', drapeau: '🇵🇹', locale: 'pt-PT' },
  // Le drapeau marocain plutôt qu'un autre : une langue n'est pas un pays, et
  // aucun drapeau ne représente l'arabe. Celui-ci est le plus proche de la
  // clientèle de la boutique — c'est un pis-aller, pas une affirmation.
  { code: 'ar', nom: 'العربية', drapeau: '🇲🇦', locale: 'ar-MA', sens: 'rtl' },
];

export const TEXTES = {
  fr: {
    /* ── L'accueil ── */
    'accueil.bienvenue': 'Bienvenue',
    // `{boutique}` et non le nom écrit en dur : il vient des réglages, et
    // le jour où le vendeur renomme sa boutique, trois traductions
    // garderaient l'ancien sans que personne pense à venir les corriger.
    'accueil.texte':
      '{boutique} est là pour vous faire découvrir <strong>de nouvelles variétés</strong> ainsi ' +
      'que des nouvelles gammes, renouvelées toute l\'année. <strong>Qualité garantie</strong> sur ' +
      'chaque produit du catalogue.',
    'accueil.horaires': '7/7 · 13H-00H',
    'accueil.service': 'Meet-up & Livraison',
    'accueil.botApp':
      'Tout se passe dans l\'app : catalogue en images, fiches produits, et ta commande déjà ' +
      'écrite.',
    'accueil.langue': 'Choisis ta langue',
    'accueil.entrer': 'Entrer dans la boutique',

    /* ── La porte du bot ── */
    'porte.entree': 'Entrée',
    'porte.marches': 'Étape {n} sur {total}',
    'porte.titre': "Un calcul, et c'est ouvert",
    'porte.texte':
      "Retourne dans la conversation du bot : il t'y pose une petite addition. " +
      "Réponds-y, puis reviens — la boutique s'ouvre toute seule.",
    'porte.fine':
      "C'est demandé une seule fois, pour éviter les faux comptes. " +
      "Aucune information supplémentaire ne t'est demandée.",
    'porte.ouvrir': 'Ouvrir la conversation',
    'porte.reessayer': "J'ai répondu — réessayer",

    /* ── La porte d'âge ── */
    'age.titre': 'Stop !',
    'age.texte':
      'Cette boutique est réservée aux personnes majeures. ' +
      'Tu confirmes avoir <strong>18&nbsp;ans ou plus</strong>&nbsp;?',
    'age.oui': "Oui, j'ai 18 ans",
    'age.non': 'Non',

    /* ── L'épreuve de tuiles ── */
    'tuiles.entete': 'Vérification',
    'tuiles.consigne': 'Remets la pièce à sa place',
    'tuiles.aide': 'Fais-la glisser du doigt — ou avec les flèches du clavier.',
    'tuiles.pieceAria': 'La pièce à replacer',
    'tuiles.texte': "Une seconde, le temps de vérifier que tu n'es pas un robot.",
    'tuiles.valider': 'Valider',

    /* ── La vérification de pièce ── */
    'verif.entete': 'Accès contrôlé',
    'verif.titre': 'Vérification requise',
    'verif.fine':
      "La boutique n'enregistre pas ton document : il reste dans la conversation " +
      'Telegram, et tu peux le supprimer une fois la vérification faite.',
    'verif.ouvrir': 'Ouvrir la conversation',
    'verif.attendre': 'Regarder la boutique en attendant',

    /* ── Le bandeau ── */
    'hero.horaires': 'Ouvert 7/7 · 13h – 00h',
    'hero.service': 'Meetup & Livraison',

    /* ── Le tri ── */
    'tri.defaut': 'Tri : par défaut',
    'tri.nouveautes': "Nouveautés d'abord",
    'tri.prixCroissant': 'Prix croissant',
    'tri.prixDecroissant': 'Prix décroissant',
    'tri.alphabetique': 'Ordre alphabétique',

    /* ── Les rappels ── */
    'catalogue.videTotal': 'Le catalogue est vide pour le moment.',

    /* ── Les avis ── */
    'avis.titre': 'Avis',
    'avis.voirTous': 'Voir tous les avis',
    'avis.commentCetait': "Comment c'était ?",
    'avis.tonAvis': 'Ton avis',
    'avis.unMot': 'Un mot, si tu veux',
    'avis.facultatif': 'facultatif',
    'avis.signe': 'Avec mon prénom',
    'avis.signeAide': 'Un avis signé inspire plus confiance.',
    'avis.anonyme': 'Anonyme',
    'avis.anonymeAide': "Ton avis s'affiche sans nom.",
    'avis.plusTard': 'Plus tard',
    'avis.envoyer': 'Envoyer',

    /* ── La navigation ── */
    'catalogue.rienNeCorrespond': 'Rien ne correspond à « {mot} ».',
    'catalogue.videCategorie': 'Rien dans cette catégorie pour le moment.',
    'produit.epuiseMinuscule': 'épuisé',

    'etat.fermeDans': 'ferme dans {duree}',
    'etat.ouvreDans': 'ouvre dans {duree}',
    'etat.minutes': '{n} min',

    'onglet.catalogue': 'Catalogue',
    'onglet.categories': 'Catégories',
    'onglet.contact': 'Contact',
    'onglet.profil': 'Profil',

    /* ── Le catalogue ── */
    'catalogue.rechercher': 'Rechercher un produit',
    'catalogue.epuise': 'ÉPUISÉ',
    'catalogue.retour': 'Retour au catalogue',

    /* ── La fiche produit ── */
    'produit.format': 'Choisis ton format',
    'produit.commander': 'Commander',
    'produit.epuise': 'Épuisé',
    'produit.prevenir': '🔔 Préviens-moi du retour',
    'produit.prevenu': '🔔 Tu seras prévenu',
    'alerte.inscrit': "On t'écrit dès que ça revient.",
    'alerte.impossible': 'Inscription impossible pour le moment.',
    'produit.memeCategorie': 'Même catégorie',
    'produit.aimerAussi': 'Tu vas aimer aussi',

    /* ── Le contact ── */
    'contact.titre': 'Une question ?',
    'contact.texte':
      "Un doute sur un produit, une commande qui traîne, une demande particulière : "
      + 'écris-nous sur Snapchat, on répond là-bas.',

    /* ── Le profil ── */
    'profil.titre': 'Mon profil',
    'profil.commandes': 'Commandes',
    'profil.favoris': 'Favoris',
    'profil.produits': 'Produits',
    'profil.alertes': 'Alertes',
    'profil.langue': 'Langue',
    'profil.langueAide': "Les textes de la boutique. Les produits gardent la langue du vendeur.",
    'profil.alertesIntro':
      "Ce que la boutique peut t'envoyer dans cette conversation. "
      + 'Tu coupes et rallumes quand tu veux.',
    'profil.stop':
      "⚠️ Tu as envoyé <b>/stop</b> au bot : rien ne t'arrivera tant que tu n'auras pas "
      + 'écrit <b>/annonces</b> pour rouvrir la porte.',

    /* ── L'état de la boutique ── */
    'etat.ouverte': 'Boutique ouverte',
    'etat.fermee': 'Boutique fermée',
    'etat.dispo': 'Dispo maintenant',
    'etat.retourA': 'De retour à',
    'etat.fermePourLInstant': "Fermé pour l'instant",

    /* ── L'ouverture ── */
    /* ── Ce que le script dit lui-même ── */
    'msg.chargement': 'Chargement…',
    'msg.injoignable': 'Boutique momentanément injoignable',
    'msg.injoignableTexte':
      "Le catalogue n'a pas pu être chargé. Ce n'est pas que la boutique est vide : "
      + 'le serveur ne répond pas comme il faut.',
    'msg.reessayer': 'Réessayer',
    'msg.catalogueIndispo': 'Catalogue indisponible, réessaie dans un instant.',
    'msg.pieceEnAttente': 'Tu pourras commander une fois ta pièce validée.',
    'msg.calculEnAttente': 'Pas encore — réponds au calcul dans la conversation.',
    'msg.articleParti': "Cet article n'est plus au catalogue. Voici le reste de la boutique.",
    'msg.verifIndispo': 'Vérification indisponible. Réessaie dans un instant.',
    'msg.reglageRefuse': 'Réglage non enregistré, réessaie.',

    /* ── L'alerte de retour ── */

    /* ── Les rayons ── */
    'rayon.unProduit': '1 produit',
    'rayon.produits': '{n} produits',

    /* ── Le contact, en détail ── */
    'contact.onPrend': 'On prend les commandes.',
    'contact.onRouvre': 'On rouvre bientôt.',
    'contact.retrait': 'Retrait sur place',
    'contact.retraitDetail': 'Rendez-vous convenu dans la conversation.',
    'contact.livraison': 'Livraison',
    'contact.livraisonDetail': 'Adresse demandée au moment de la commande.',
    'contact.especes': 'Paiement en espèces',
    'contact.especesDetail': 'À la remise, rien à avancer.',

    /* ── Les favoris ── */
    'favori.mettre': 'Mettre en favori',
    'favori.retirer': 'Retirer des favoris',
    'favori.epuiseAlerte': "Épuisé — active l'alerte de retour",
    'favoris.desactives': 'Les favoris ne sont pas activés sur cette boutique.',
    'favoris.vide': 'Touche le ♥ sur un produit pour le garder ici.',

    /* ── Les commandes ── */
    'commandes.desactivees': "L'historique des commandes n'est pas activé sur cette boutique.",
    'commandes.vide': "Tu n'as pas encore passé de commande.",
    'commandes.depuisTelegram': 'Ouvre la boutique depuis Telegram pour retrouver tes commandes.',
    'commandes.profilIndispo': 'Profil indisponible pour le moment.',
    'profil.client': 'Client {boutique}',

    /* ── Les avis, suite ── */
    'avis.compte': 'Avis ({n})',
    'avis.voirLesN': 'Voir les {n} avis',
    'avis.uneEtoile': '{n} étoile',
    'avis.desEtoiles': '{n} étoiles',
    'avis.toucheUneEtoile': 'Touche au moins une étoile.',
    'avis.merci': 'Merci pour ton avis !',
    'avis.envoi': 'Envoi…',
    'avis.refuse': 'Avis refusé.',
    'avis.tonAvisSur': 'Ton avis sur {quoi}',
    'avis.reponseBoutique': 'Réponse de la boutique',

    /* ── La musique ── */
    'juke.ouvrir': 'Ouvrir le lecteur de musique',

    /* ── Les médias ── */
    'media.video': '▶ Vidéo',

    /* ── La mention légale, l'accès, la vérification ── */
    'legal.mention':
      'Produits réservés aux personnes majeures. Vérifie la législation en vigueur '
      + 'chez toi avant toute commande : la disponibilité de ces produits dépend de ta juridiction.',
    'titre.page': 'Boutique',
    'etat.compteBloque':
      "Ce compte ne peut pas passer commande. Écris-nous dans la conversation si c'est une erreur.",
    'etat.fermeeMessage': 'La boutique est fermée pour le moment.',
    'etat.ouvertCourt': 'Ouvert',
    'etat.fermeCourt': 'Fermé',
    'verif.texteAucune':
      "Pour commander ici, une pièce d'identité doit être validée. Envoie-la en photo "
      + 'dans la conversation du bot : le vendeur la regarde et te répond.',
    'verif.texteEnCours':
      'Ta pièce est en cours de vérification. Tu recevras la réponse dans la conversation du bot.',
    'verif.texteRefusee':
      "La vérification a été refusée. Écris-nous dans la conversation si tu penses que c'est une erreur.",
    'verif.titreEnCours': 'En cours de vérification',
    'verif.titreRefusee': 'Vérification refusée',
    'captcha.rate': 'Raté. Essaie encore.',

    /* ── Les suggestions ── */
    'produit.memeCategorieAvec': 'Même catégorie · {cat}',

    /* ── Ce qu'on écrit au vendeur ── */
    'snap.titre': 'Pour commander',
    'snap.texte': 'Les commandes se prennent sur Snapchat : envoie-nous un message là-bas. La boutique, elle, sert à choisir.',
    'snap.compris': 'J\'ai compris',
    'msg.article': 'Article',

    /* ── Le retour ── */
    'retour.simple': 'Retour',
    'retour.catalogue': 'Retour au catalogue',
    'retour.categories': 'Retour aux catégories',
    'retour.profil': 'Retour au profil',

    /* ── Les listes de noms ── */
    'liste.etAutre': '{liste} et {n} autre',
    'liste.etAutres': '{liste} et {n} autres',

    /* ── L'écran d'avis ── */
    'avis.ajouteUnMot': 'Ajoute un mot',
    'avis.tuAsNote': 'Tu as noté {quoi}',
    'avis.dejaNote': 'Tu as déjà noté {quoi}. Ajoute un mot, si tu veux.',
    'avis.commandeRef': 'Commande {ref} — {quoi}',
    'avis.avecPrenom': 'Avec « {prenom} »',

    /* ── Ce que lit une synthèse vocale ── */
    'aria.effacer': 'Effacer la recherche',
    'aria.trier': 'Trier les produits',
    'aria.fermer': 'Fermer',
    'aria.fiche': 'Fiche produit',
    'aria.navigation': 'Navigation',
    'aria.medias': 'Médias',
    'aria.mediaPrec': 'Média précédent',
    'aria.mediaSuiv': 'Média suivant',
    'aria.signer': 'Signer ton avis',

    /* ── Le lecteur ── */
    'juke.menu': 'Lecteur de musique',
    'juke.lecture': 'Lecture',
    'juke.pause': 'Pause',
    'juke.precedent': 'Morceau précédent',
    'juke.suivant': 'Morceau suivant',

    /* ── Ce qui reste privé dans un avis ── */
    'avis.noteVie':
      'Dans les deux cas, ni ton pseudo Telegram, ni ton numéro, ni ton adresse '
      + "ne sont publiés. Le vendeur, lui, voit toujours quelle commande a été notée.",

    /* ── Les canaux d'alerte ──
       Le serveur dit QUELS canaux existent ; le dictionnaire dit comment ils
       se lisent. Les libellés du serveur servent encore au bot, qui parle
       français : les traduire là-bas changerait aussi ses messages. */
    'alertes.nouveautes': 'Nouveaux produits',
    'alertes.nouveautesAide': 'Un message quand un article arrive au catalogue.',
    'alertes.promos': 'Promos et codes',
    'alertes.promosAide': 'Un message quand une remise ou un code promo démarre.',

    'ouverture.1': 'Ouverture de la boutique…',
    'ouverture.2': 'On branche le courant…',
    'ouverture.3': 'On allume les néons…',
    'ouverture.4': 'On sort la marchandise…',
    'ouverture.5': 'Prêt.',
    'ouverture.chargement': 'Chargement…',
    'onglet.accueil': "Accueil",
    'onglet.boutique': "Boutique",
    'onglet.favoris': "Favoris",
    'onglet.panier': "Panier",
    'onglet.compte': "Compte",
    'vitrine.bienvenue': "Bienvenue",
    'vitrine.tous': "Tous les produits",
    'vitrine.articles': "{n} articles",
    'vitrine.unArticle': "1 article",
    'vitrine.promos': "Promos",
    'promo.voir': "Voir les offres",
    'promo.titreAuto': "PROMO FLASH — jusqu'à -{n} %",
    'carte.des': "dès",
    'carte.ajouter': "Ajouter au panier",
    'carte.sansAvis': "Pas encore d'avis",
    'produit.ajouter': "Ajouter au panier",
    'panier.ajoute': "Ajouté au panier",
    'panier.plusDeStock': "Plus de stock disponible pour ce format",
    'panier.titre': "Mon panier",
    'panier.vide': "Ton panier est vide.",
    'panier.voirBoutique': "Voir la boutique",
    'panier.total': "Total",
    'panier.economie': "Tu économises {montant}",
    'panier.commander': "Commander",
    'panier.vider': "Vider le panier",
    'panier.copier': "Copier le récapitulatif",
    'panier.copie': "Récapitulatif copié",
    'panier.copieImpossible': "Copie impossible : sélectionne le texte et copie-le",
    'panier.recapTitre': "Ma commande",
    'panier.recapAide': "Copie ce récapitulatif et envoie-le-nous sur Snapchat.",
    'panier.retirer': "Retirer",
    'panier.moins': "Un de moins",
    'panier.plus': "Un de plus",
    'favoris.titre': "Mes favoris",
    'favoris.vide': "Aucun favori pour l'instant : touche le cœur d'un produit pour le garder ici.",
    'son.basculer': "Musique",
    'panier.ouvrir': "Ouvrir le panier",
    'profil.contact': "Une question ? Contact",
    'commande.mode': "Comment tu récupères",
    'commande.retrait': "🏠 Retrait",
    'commande.surPlace': "sur place",
    'commande.livraison': "🛵 Livraison",
    'commande.offerte': "offerte",
    'commande.adresse': "Adresse de livraison",
    'commande.rue': "Rue et numéro",
    'commande.complement': "Bâtiment, étage, code d'entrée (optionnel)",
    'commande.codePostal': "Code postal",
    'commande.ville': "Ville",
    'commande.creneauRetrait': "Créneau de retrait",
    'commande.creneauLivraison': "Créneau de livraison",
    'commande.choisisCreneau': "Choisis un créneau",
    'commande.aucunCreneau': "Aucun créneau disponible",
    'commande.complet': "complet",
    'commande.places': "{n} places",
    'commande.telephone': "Téléphone (optionnel)",
    'commande.telephoneLivraison': "Téléphone (pour te prévenir à l'arrivée)",
    'commande.telephoneAide': "Pour te joindre",
    'commande.code': "Code promo",
    'commande.codeAide': "Si tu en as un",
    'commande.appliquer': "Appliquer",
    'commande.codeApplique': "Code {code} appliqué : −{montant}",
    'commande.palierMieux': "Ta remise automatique ({label}) est plus avantageuse : on la garde.",
    'commande.remiseAuto': "Remise automatique {label} : −{montant}",
    'commande.codeRefuse': "Code refusé.",
    'commande.ajouteDabord': "Ajoute d'abord un article.",
    'commande.note': "Un mot pour la commande ? (optionnel)",
    'commande.noteAide': "Point de retrait, code de la porte, question…",
    'commande.sousTotal': "Sous-total",
    'commande.remise': "Remise",
    'commande.fraisLivraison': "Livraison",
    'commande.minimum': "Commande minimum {montant} : il manque {reste}.",
    'commande.franco': "Livraison offerte à partir de {montant} : il manque {reste}.",
    'commande.pasLivre': "On ne livre pas encore le {code}. Le retrait sur place reste possible.",
    'commande.zoneFrais': "{montant} de livraison",
    'commande.zoneOfferte': "livraison offerte",
    'commande.zoneMin': "minimum {montant}",
    'commande.preparation': "Préparation…",
    'commande.fermee': "Boutique fermée",
    'commande.impossible': "Commande impossible",
    'commande.ajuste': "Ajuste ton panier",
    'commande.refusee': "Commande refusée.",
    'commande.manqueRue': "Indique la rue et le numéro.",
    'commande.manqueCP': "Indique ton code postal.",
    'commande.manqueVille': "Indique la ville.",
    'commande.stockManque': "{nom} : il n'en reste que {n}. Ajuste la quantité.",
    'done.titre': "Commande enregistrée",
    'done.texte': "On a reçu ta commande, le vendeur est prévenu. La confirmation arrive dans la conversation du bot.",
    'done.texteSans': "On a reçu ta commande, le vendeur est prévenu. Il revient vers toi très vite.",
    'done.mesCommandes': "Mes commandes",
    'done.continuer': "Continuer mes achats",
    'done.especes': "💶 Paiement en espèces, à la remise.",
    'done.retrait': "🏠 Retrait sur place",
    'done.livraison': "🛵 Livraison",
    'o68.badge': "Sélection par farms",
    'o68.devise': "La sélection · Les farms · Les références",
    'o68.references': "Références",
    'o68.farms': "Farms",
    'o68.original': "Original",
    'o68.explore': "Explore le catalogue",
    'o68.lesFarms': "Les farms",
    'o68.tout': "Tout",
    'o68.toutesLesFarms': "Toutes les farms",
    'o68.nFarms': "{n} farms",
    'o68.aucuneFarm': "Les farms arrivent bientôt.",
    'onglet.farms': "Farms",
    'onglet.infos': "Infos",

    'secours.titre': 'Porte de secours',
    'secours.texte':
      'Un second bot ouvre la même boutique. Écris-lui une fois : si cette conversation venait à ' +
      'disparaître, c\'est là que tu recevrais la nouvelle adresse.',
    'secours.ouvrir': 'Enregistrer la porte de secours',
    'secours.fait': 'Porte de secours enregistrée',
    'secours.faitAide': 'Tu es joignable là-bas. Rien d\'autre à faire.',

    'secours.porteTitre': 'Un message, et c\'est ouvert',
    'secours.porteTexte':
      'Cette boutique a un second bot, au cas où celui-ci disparaîtrait. Envoie-lui /start, puis ' +
      'reviens — la boutique s\'ouvre toute seule.',
    'secours.porteFine':
      'C\'est demandé une seule fois. Sans ce message, Telegram ne nous laissera jamais te donner ' +
      'la nouvelle adresse le jour où cette conversation s\'arrêtera.',
    'secours.porteOuvrir': 'Ouvrir le bot de secours',
    'secours.porteReessayer': 'J\'ai écrit — réessayer',
    'msg.secoursEnAttente': 'Pas encore — envoie /start au bot de secours.',
  },

  en: {
    'accueil.bienvenue': 'Welcome',
    'accueil.texte':
      '{boutique} is here to show you <strong>new strains</strong> and new ranges, refreshed all ' +
      'year round. <strong>Quality guaranteed</strong> on every product in the catalogue.',
    'accueil.horaires': '7/7 · 1PM-12AM',
    'accueil.service': 'Meet-up & Delivery',
    'accueil.botApp':
      'Everything happens in the app: catalogue in pictures, product sheets, and your order ' +
      'already written.',
    'accueil.langue': 'Choose your language',
    'accueil.entrer': 'Enter the shop',

    'porte.entree': 'Entry',
    'porte.marches': 'Step {n} of {total}',
    'porte.titre': 'One sum, and you’re in',
    'porte.texte':
      'Go back to the bot chat: it will give you a small sum. ' +
      'Answer it, then come back — the shop opens by itself.',
    'porte.fine':
      'Asked only once, to keep fake accounts out. ' +
      'Nothing else is asked of you.',
    'porte.ouvrir': 'Open the chat',
    'porte.reessayer': 'I answered — try again',

    'age.titre': 'Stop!',
    'age.texte':
      'This shop is for adults only. ' +
      'Do you confirm you are <strong>18&nbsp;or older</strong>&nbsp;?',
    'age.oui': 'Yes, I am 18',
    'age.non': 'No',

    'tuiles.entete': 'Check',
    'tuiles.consigne': 'Put the missing piece back',
    'tuiles.aide': 'Slide it with your finger — or use the arrow keys.',
    'tuiles.pieceAria': 'The missing piece',
    'tuiles.texte': 'One moment, just checking you are not a robot.',
    'tuiles.valider': 'Confirm',

    'verif.entete': 'Restricted access',
    'verif.titre': 'Verification required',
    'verif.fine':
      'The shop does not store your document: it stays in the Telegram chat, ' +
      'and you can delete it once the check is done.',
    'verif.ouvrir': 'Open the chat',
    'verif.attendre': 'Browse the shop meanwhile',

    'hero.horaires': 'Open 7/7 · 1pm – midnight',
    'hero.service': 'Meetup & Delivery',

    'tri.defaut': 'Sort: default',
    'tri.nouveautes': 'Newest first',
    'tri.prixCroissant': 'Price, low to high',
    'tri.prixDecroissant': 'Price, high to low',
    'tri.alphabetique': 'Alphabetical',

    'catalogue.videTotal': 'The catalogue is empty for now.',

    'avis.titre': 'Reviews',
    'avis.voirTous': 'See all reviews',
    'avis.commentCetait': 'How was it?',
    'avis.tonAvis': 'Your review',
    'avis.unMot': 'A word, if you like',
    'avis.facultatif': 'optional',
    'avis.signe': 'With my first name',
    'avis.signeAide': 'A signed review inspires more trust.',
    'avis.anonyme': 'Anonymous',
    'avis.anonymeAide': 'Your review appears without a name.',
    'avis.plusTard': 'Later',
    'avis.envoyer': 'Send',

    'catalogue.rienNeCorrespond': 'Nothing matches “{mot}”.',
    'catalogue.videCategorie': 'Nothing in this category for now.',
    'produit.epuiseMinuscule': 'sold out',

    'etat.fermeDans': 'closes in {duree}',
    'etat.ouvreDans': 'opens in {duree}',
    'etat.minutes': '{n} min',

    'onglet.catalogue': 'Catalogue',
    'onglet.categories': 'Categories',
    'onglet.contact': 'Contact',
    'onglet.profil': 'Profile',

    'catalogue.rechercher': 'Search for a product',
    'catalogue.epuise': 'SOLD OUT',
    'catalogue.retour': 'Back to catalogue',

    'produit.format': 'Choose your size',
    'produit.commander': 'Order',
    'produit.epuise': 'Sold out',
    'produit.prevenir': '🔔 Tell me when it’s back',
    'produit.prevenu': '🔔 You’ll be told',
    'alerte.inscrit': "We'll write as soon as it's back.",
    'alerte.impossible': "Can't sign you up right now.",
    'produit.memeCategorie': 'Same category',
    'produit.aimerAussi': 'You might also like',

    'contact.titre': 'A question?',
    'contact.texte':
      'Unsure about a product, an order taking its time, a special request: '
      + 'write to us on Snapchat, that is where we answer.',

    'profil.titre': 'My profile',
    'profil.commandes': 'Orders',
    'profil.favoris': 'Favourites',
    'profil.produits': 'Products',
    'profil.alertes': 'Alerts',
    'profil.langue': 'Language',
    'profil.langueAide': "The shop’s own text. Products stay in the seller’s language.",
    'profil.alertesIntro':
      'What the shop may send you in this chat. '
      + 'Turn it off and back on whenever you like.',
    'profil.stop':
      '⚠️ You sent <b>/stop</b> to the bot: nothing will reach you until you write '
      + '<b>/annonces</b> to open the door again.',

    'etat.ouverte': 'Shop open',
    'etat.fermee': 'Shop closed',
    'etat.dispo': 'Open now',
    'etat.retourA': 'Back at',
    'etat.fermePourLInstant': 'Closed for now',

    /* ── Ce que le script dit lui-même ── */
    'msg.chargement': 'Loading…',
    'msg.injoignable': 'Shop temporarily unreachable',
    'msg.injoignableTexte':
      "The catalogue could not be loaded. It isn't that the shop is empty: "
      + "the server isn't answering properly.",
    'msg.reessayer': 'Try again',
    'msg.catalogueIndispo': 'Catalogue unavailable, try again in a moment.',
    'msg.pieceEnAttente': 'You can order once your ID has been checked.',
    'msg.calculEnAttente': 'Not yet — answer the sum in the chat.',
    'msg.articleParti': "This item has left the catalogue. Here's the rest of the shop.",
    'msg.verifIndispo': 'Verification unavailable. Try again in a moment.',
    'msg.reglageRefuse': 'Setting not saved, try again.',

    /* ── L'alerte de retour ── */

    /* ── Les rayons ── */
    'rayon.unProduit': '1 product',
    'rayon.produits': '{n} products',

    /* ── Le contact, en détail ── */
    'contact.onPrend': "We're taking orders.",
    'contact.onRouvre': "We'll reopen soon.",
    'contact.retrait': 'Meetup',
    'contact.retraitDetail': 'Time and place agreed in the chat.',
    'contact.livraison': 'Delivery',
    'contact.livraisonDetail': 'Address asked for when you order.',
    'contact.especes': 'Cash payment',
    'contact.especesDetail': 'On handover, nothing up front.',

    /* ── Les favoris ── */
    'favori.mettre': 'Add to favourites',
    'favori.retirer': 'Remove from favourites',
    'favori.epuiseAlerte': 'Sold out — turn on the back-in-stock alert',
    'favoris.desactives': 'Favourites are not enabled in this shop.',
    'favoris.vide': 'Tap the ♥ on a product to keep it here.',

    /* ── Les commandes ── */
    'commandes.desactivees': 'Order history is not enabled in this shop.',
    'commandes.vide': "You haven't placed an order yet.",
    'commandes.depuisTelegram': 'Open the shop from Telegram to find your orders.',
    'commandes.profilIndispo': 'Profile unavailable for the moment.',
    'profil.client': '{boutique} customer',

    /* ── Les avis, suite ── */
    'avis.compte': 'Reviews ({n})',
    'avis.voirLesN': 'See all {n} reviews',
    'avis.uneEtoile': '{n} star',
    'avis.desEtoiles': '{n} stars',
    'avis.toucheUneEtoile': 'Tap at least one star.',
    'avis.merci': 'Thanks for your review!',
    'avis.envoi': 'Sending…',
    'avis.refuse': 'Review refused.',
    'avis.tonAvisSur': 'Your review of {quoi}',
    'avis.reponseBoutique': 'Reply from the shop',

    /* ── La musique ── */
    'juke.ouvrir': 'Open the music player',

    /* ── Les médias ── */
    'media.video': '▶ Video',

    /* ── La mention légale, l'accès, la vérification ── */
    'legal.mention':
      'For adults only. Check the law where you are before ordering: '
      + 'whether these products are available depends on your jurisdiction.',
    'titre.page': 'Shop',
    'etat.compteBloque':
      "This account cannot place orders. Write to us in the chat if that's a mistake.",
    'etat.fermeeMessage': 'The shop is closed for the moment.',
    'etat.ouvertCourt': 'Open',
    'etat.fermeCourt': 'Closed',
    'verif.texteAucune':
      'To order here, an ID has to be checked. Send a photo of it in the bot chat: '
      + 'the seller looks at it and gets back to you.',
    'verif.texteEnCours':
      "Your ID is being checked. You'll get the answer in the bot chat.",
    'verif.texteRefusee':
      'The check came back refused. Write to us in the chat if you think that is a mistake.',
    'verif.titreEnCours': 'Being checked',
    'verif.titreRefusee': 'Check refused',
    'captcha.rate': 'Missed. Try again.',

    /* ── Les suggestions ── */
    'produit.memeCategorieAvec': 'Same category · {cat}',

    /* ── Ce qu'on écrit au vendeur ── */
    'snap.titre': 'To order',
    'snap.texte': 'Orders are taken on Snapchat: send us a message there. The shop is for choosing.',
    'snap.compris': 'Got it',
    'msg.article': 'Item',

    /* ── Le retour ── */
    'retour.simple': 'Back',
    'retour.catalogue': 'Back to the catalogue',
    'retour.categories': 'Back to categories',
    'retour.profil': 'Back to my profile',

    /* ── Les listes de noms ── */
    'liste.etAutre': '{liste} and {n} more',
    'liste.etAutres': '{liste} and {n} more',

    /* ── L'écran d'avis ── */
    'avis.ajouteUnMot': 'Add a word',
    'avis.tuAsNote': 'You rated {quoi}',
    'avis.dejaNote': 'You already rated {quoi}. Add a word, if you like.',
    'avis.commandeRef': 'Order {ref} — {quoi}',
    'avis.avecPrenom': 'As “{prenom}”',

    /* ── Ce que lit une synthèse vocale ── */
    'aria.effacer': 'Clear the search',
    'aria.trier': 'Sort the products',
    'aria.fermer': 'Close',
    'aria.fiche': 'Product page',
    'aria.navigation': 'Navigation',
    'aria.medias': 'Media',
    'aria.mediaPrec': 'Previous media',
    'aria.mediaSuiv': 'Next media',
    'aria.signer': 'Sign your review',

    /* ── Le lecteur ── */
    'juke.menu': 'Music player',
    'juke.lecture': 'Play',
    'juke.pause': 'Pause',
    'juke.precedent': 'Previous track',
    'juke.suivant': 'Next track',

    /* ── Ce qui reste privé dans un avis ── */
    'avis.noteVie':
      'Either way, your Telegram handle, your number and your address stay unpublished. '
      + 'The seller does still see which order was rated.',

    /* ── Les canaux d'alerte ── */
    'alertes.nouveautes': 'New products',
    'alertes.nouveautesAide': 'A message when an item lands in the catalogue.',
    'alertes.promos': 'Deals and codes',
    'alertes.promosAide': 'A message when a discount or a promo code starts.',

    'ouverture.1': 'Opening the shop…',
    'ouverture.2': 'Plugging in…',
    'ouverture.3': 'Lighting the neon…',
    'ouverture.4': 'Bringing out the goods…',
    'ouverture.5': 'Ready.',
    'ouverture.chargement': 'Loading…',
    'onglet.accueil': "Home",
    'onglet.boutique': "Shop",
    'onglet.favoris': "Favourites",
    'onglet.panier': "Cart",
    'onglet.compte': "Account",
    'vitrine.bienvenue': "Welcome",
    'vitrine.tous': "All products",
    'vitrine.articles': "{n} items",
    'vitrine.unArticle': "1 item",
    'vitrine.promos': "Deals",
    'promo.voir': "See the deals",
    'promo.titreAuto': "FLASH SALE — up to -{n}%",
    'carte.des': "from",
    'carte.ajouter': "Add to cart",
    'carte.sansAvis': "No reviews yet",
    'produit.ajouter': "Add to cart",
    'panier.ajoute': "Added to cart",
    'panier.plusDeStock': "No more stock for this size",
    'panier.titre': "My cart",
    'panier.vide': "Your cart is empty.",
    'panier.voirBoutique': "Browse the shop",
    'panier.total': "Total",
    'panier.economie': "You save {montant}",
    'panier.commander': "Order",
    'panier.vider': "Empty the cart",
    'panier.copier': "Copy the summary",
    'panier.copie': "Summary copied",
    'panier.copieImpossible': "Copy failed: select the text and copy it",
    'panier.recapTitre': "My order",
    'panier.recapAide': "Copy this summary and send it to us on Snapchat.",
    'panier.retirer': "Remove",
    'panier.moins': "One less",
    'panier.plus': "One more",
    'favoris.titre': "My favourites",
    'favoris.vide': "No favourites yet: tap a product's heart to keep it here.",
    'son.basculer': "Music",
    'panier.ouvrir': "Open the cart",
    'profil.contact': "A question? Contact",
    'commande.mode': "How you get it",
    'commande.retrait': "🏠 Pickup",
    'commande.surPlace': "on site",
    'commande.livraison': "🛵 Delivery",
    'commande.offerte': "free",
    'commande.adresse': "Delivery address",
    'commande.rue': "Street and number",
    'commande.complement': "Building, floor, door code (optional)",
    'commande.codePostal': "Postcode",
    'commande.ville': "City",
    'commande.creneauRetrait': "Pickup slot",
    'commande.creneauLivraison': "Delivery slot",
    'commande.choisisCreneau': "Choose a slot",
    'commande.aucunCreneau': "No slot available",
    'commande.complet': "full",
    'commande.places': "{n} left",
    'commande.telephone': "Phone (optional)",
    'commande.telephoneLivraison': "Phone (to tell you we're there)",
    'commande.telephoneAide': "So we can reach you",
    'commande.code': "Promo code",
    'commande.codeAide': "If you have one",
    'commande.appliquer': "Apply",
    'commande.codeApplique': "Code {code} applied: −{montant}",
    'commande.palierMieux': "Your automatic discount ({label}) is better: we keep it.",
    'commande.remiseAuto': "Automatic discount {label}: −{montant}",
    'commande.codeRefuse': "Code refused.",
    'commande.ajouteDabord': "Add an item first.",
    'commande.note': "A note for the order? (optional)",
    'commande.noteAide': "Pickup point, door code, question…",
    'commande.sousTotal': "Subtotal",
    'commande.remise': "Discount",
    'commande.fraisLivraison': "Delivery",
    'commande.minimum': "Minimum order {montant}: {reste} to go.",
    'commande.franco': "Free delivery from {montant}: {reste} to go.",
    'commande.pasLivre': "We don't deliver to {code} yet. Pickup is still possible.",
    'commande.zoneFrais': "{montant} delivery",
    'commande.zoneOfferte': "free delivery",
    'commande.zoneMin': "minimum {montant}",
    'commande.preparation': "Preparing…",
    'commande.fermee': "Shop closed",
    'commande.impossible': "Order not possible",
    'commande.ajuste': "Adjust your cart",
    'commande.refusee': "Order refused.",
    'commande.manqueRue': "Enter the street and number.",
    'commande.manqueCP': "Enter your postcode.",
    'commande.manqueVille': "Enter the city.",
    'commande.stockManque': "{nom}: only {n} left. Adjust the quantity.",
    'done.titre': "Order received",
    'done.texte': "We got your order and the seller has been notified. The confirmation arrives in the bot chat.",
    'done.texteSans': "We got your order and the seller has been notified. They'll get back to you soon.",
    'done.mesCommandes': "My orders",
    'done.continuer': "Keep shopping",
    'done.especes': "💶 Cash payment, on handover.",
    'done.retrait': "🏠 Pickup on site",
    'done.livraison': "🛵 Delivery",
    'o68.badge': "Selection by farms",
    'o68.devise': "The selection · The farms · The references",
    'o68.references': "References",
    'o68.farms': "Farms",
    'o68.original': "Original",
    'o68.explore': "Explore the catalogue",
    'o68.lesFarms': "The farms",
    'o68.tout': "All",
    'o68.toutesLesFarms': "All farms",
    'o68.nFarms': "{n} farms",
    'o68.aucuneFarm': "Farms are coming soon.",
    'onglet.farms': "Farms",
    'onglet.infos': "Info",

    'secours.titre': 'Backup door',
    'secours.texte':
      'A second bot opens the same shop. Write to it once: if this conversation ever disappears, ' +
      'that is where you will get the new address.',
    'secours.ouvrir': 'Save the backup door',
    'secours.fait': 'Backup door saved',
    'secours.faitAide': 'You are reachable there. Nothing else to do.',

    'secours.porteTitre': 'One message, and you are in',
    'secours.porteTexte':
      'This shop has a second bot, in case this one disappears. Send it /start, then come back — ' +
      'the shop opens by itself.',
    'secours.porteFine':
      'Asked once only. Without that message, Telegram will never let us give you the new address ' +
      'the day this conversation stops.',
    'secours.porteOuvrir': 'Open the backup bot',
    'secours.porteReessayer': 'I wrote to it — try again',
    'msg.secoursEnAttente': 'Not yet — send /start to the backup bot.',
  },

  es: {
    'accueil.bienvenue': 'Bienvenido',
    'accueil.texte':
      '{boutique} está aquí para descubrirte <strong>nuevas variedades</strong> y nuevas gamas, ' +
      'renovadas todo el año. <strong>Calidad garantizada</strong> en cada producto del catálogo.',
    'accueil.horaires': '7/7 · 13:00-00:00',
    'accueil.service': 'Meet-up y Entrega',
    'accueil.botApp':
      'Todo pasa en la app: catálogo en imágenes, fichas de producto, y tu pedido ya redactado.',
    'accueil.langue': 'Elige tu idioma',
    'accueil.entrer': 'Entrar en la tienda',

    'porte.entree': 'Entrada',
    'porte.marches': 'Paso {n} de {total}',
    'porte.titre': 'Una cuenta, y ya estás dentro',
    'porte.texte':
      'Vuelve a la conversación del bot: te pondrá una suma sencilla. ' +
      'Respóndela y vuelve — la tienda se abre sola.',
    'porte.fine':
      'Se pide una sola vez, para evitar cuentas falsas. ' +
      'No se te pide nada más.',
    'porte.ouvrir': 'Abrir la conversación',
    'porte.reessayer': 'Ya respondí — reintentar',

    'age.titre': '¡Alto!',
    'age.texte':
      'Esta tienda es solo para mayores de edad. ' +
      '¿Confirmas que tienes <strong>18&nbsp;años o más</strong>&nbsp;?',
    'age.oui': 'Sí, tengo 18 años',
    'age.non': 'No',

    'tuiles.entete': 'Comprobación',
    'tuiles.consigne': 'Vuelve a colocar la pieza',
    'tuiles.aide': 'Deslízala con el dedo — o usa las flechas del teclado.',
    'tuiles.pieceAria': 'La pieza que falta',
    'tuiles.texte': 'Un momento, comprobamos que no eres un robot.',
    'tuiles.valider': 'Validar',

    'verif.entete': 'Acceso controlado',
    'verif.titre': 'Verificación necesaria',
    'verif.fine':
      'La tienda no guarda tu documento: permanece en la conversación de ' +
      'Telegram, y puedes borrarlo una vez hecha la verificación.',
    'verif.ouvrir': 'Abrir la conversación',
    'verif.attendre': 'Ver la tienda mientras tanto',

    'hero.horaires': 'Abierto 7/7 · 13:00 – 00:00',
    'hero.service': 'Encuentro y entrega',

    'tri.defaut': 'Orden: por defecto',
    'tri.nouveautes': 'Novedades primero',
    'tri.prixCroissant': 'Precio, de menor a mayor',
    'tri.prixDecroissant': 'Precio, de mayor a menor',
    'tri.alphabetique': 'Orden alfabético',

    'catalogue.videTotal': 'El catálogo está vacío por ahora.',

    'avis.titre': 'Opiniones',
    'avis.voirTous': 'Ver todas las opiniones',
    'avis.commentCetait': '¿Qué tal estuvo?',
    'avis.tonAvis': 'Tu opinión',
    'avis.unMot': 'Unas palabras, si quieres',
    'avis.facultatif': 'opcional',
    'avis.signe': 'Con mi nombre',
    'avis.signeAide': 'Una opinión firmada inspira más confianza.',
    'avis.anonyme': 'Anónimo',
    'avis.anonymeAide': 'Tu opinión aparece sin nombre.',
    'avis.plusTard': 'Más tarde',
    'avis.envoyer': 'Enviar',

    'catalogue.rienNeCorrespond': 'Nada coincide con «{mot}».',
    'catalogue.videCategorie': 'Nada en esta categoría por ahora.',
    'produit.epuiseMinuscule': 'agotado',

    'etat.fermeDans': 'cierra en {duree}',
    'etat.ouvreDans': 'abre en {duree}',
    'etat.minutes': '{n} min',

    'onglet.catalogue': 'Catálogo',
    'onglet.categories': 'Categorías',
    'onglet.contact': 'Contacto',
    'onglet.profil': 'Perfil',

    'catalogue.rechercher': 'Buscar un producto',
    'catalogue.epuise': 'AGOTADO',
    'catalogue.retour': 'Volver al catálogo',

    'produit.format': 'Elige tu formato',
    'produit.commander': 'Pedir',
    'produit.epuise': 'Agotado',
    'produit.prevenir': '🔔 Avísame cuando vuelva',
    'produit.prevenu': '🔔 Te avisaremos',
    'alerte.inscrit': 'Te escribimos en cuanto vuelva.',
    'alerte.impossible': 'No se puede apuntar por ahora.',
    'produit.memeCategorie': 'Misma categoría',
    'produit.aimerAussi': 'También te puede gustar',

    'contact.titre': '¿Una pregunta?',
    'contact.texte':
      'Una duda sobre un producto, un pedido que tarda, una petición especial: '
      + 'escríbenos por Snapchat, respondemos allí.',

    'profil.titre': 'Mi perfil',
    'profil.commandes': 'Pedidos',
    'profil.favoris': 'Favoritos',
    'profil.produits': 'Productos',
    'profil.alertes': 'Avisos',
    'profil.langue': 'Idioma',
    'profil.langueAide': 'Los textos de la tienda. Los productos mantienen el idioma del vendedor.',
    'profil.alertesIntro':
      'Lo que la tienda puede enviarte en esta conversación. '
      + 'Lo apagas y lo vuelves a encender cuando quieras.',
    'profil.stop':
      '⚠️ Enviaste <b>/stop</b> al bot: no recibirás nada hasta que escribas '
      + '<b>/annonces</b> para volver a abrir la puerta.',

    'etat.ouverte': 'Tienda abierta',
    'etat.fermee': 'Tienda cerrada',
    'etat.dispo': 'Disponible ahora',
    'etat.retourA': 'De vuelta a las',
    'etat.fermePourLInstant': 'Cerrado por ahora',

    /* ── Ce que le script dit lui-même ── */
    'msg.chargement': 'Cargando…',
    'msg.injoignable': 'Tienda momentáneamente inaccesible',
    'msg.injoignableTexte':
      'No se ha podido cargar el catálogo. No es que la tienda esté vacía: '
      + 'el servidor no responde como debería.',
    'msg.reessayer': 'Reintentar',
    'msg.catalogueIndispo': 'Catálogo no disponible, inténtalo en un momento.',
    'msg.pieceEnAttente': 'Podrás pedir en cuanto se valide tu documento.',
    'msg.calculEnAttente': 'Todavía no — responde a la suma en la conversación.',
    'msg.articleParti': 'Este artículo ya no está en el catálogo. Aquí tienes el resto de la tienda.',
    'msg.verifIndispo': 'Verificación no disponible. Inténtalo en un momento.',
    'msg.reglageRefuse': 'Ajuste no guardado, inténtalo de nuevo.',

    /* ── L'alerte de retour ── */

    /* ── Les rayons ── */
    'rayon.unProduit': '1 producto',
    'rayon.produits': '{n} productos',

    /* ── Le contact, en détail ── */
    'contact.onPrend': 'Estamos tomando pedidos.',
    'contact.onRouvre': 'Volvemos a abrir pronto.',
    'contact.retrait': 'Recogida en mano',
    'contact.retraitDetail': 'Cita acordada en la conversación.',
    'contact.livraison': 'Entrega',
    'contact.livraisonDetail': 'La dirección se pide al hacer el pedido.',
    'contact.especes': 'Pago en efectivo',
    'contact.especesDetail': 'En la entrega, nada por adelantado.',

    /* ── Les favoris ── */
    'favori.mettre': 'Añadir a favoritos',
    'favori.retirer': 'Quitar de favoritos',
    'favori.epuiseAlerte': 'Agotado — activa el aviso de vuelta',
    'favoris.desactives': 'Los favoritos no están activados en esta tienda.',
    'favoris.vide': 'Toca el ♥ en un producto para guardarlo aquí.',

    /* ── Les commandes ── */
    'commandes.desactivees': 'El historial de pedidos no está activado en esta tienda.',
    'commandes.vide': 'Todavía no has hecho ningún pedido.',
    'commandes.depuisTelegram': 'Abre la tienda desde Telegram para ver tus pedidos.',
    'commandes.profilIndispo': 'Perfil no disponible por el momento.',
    'profil.client': 'Cliente de {boutique}',

    /* ── Les avis, suite ── */
    'avis.compte': 'Opiniones ({n})',
    'avis.voirLesN': 'Ver las {n} opiniones',
    'avis.uneEtoile': '{n} estrella',
    'avis.desEtoiles': '{n} estrellas',
    'avis.toucheUneEtoile': 'Toca al menos una estrella.',
    'avis.merci': '¡Gracias por tu opinión!',
    'avis.envoi': 'Enviando…',
    'avis.refuse': 'Opinión rechazada.',
    'avis.tonAvisSur': 'Tu opinión sobre {quoi}',
    'avis.reponseBoutique': 'Respuesta de la tienda',

    /* ── La musique ── */
    'juke.ouvrir': 'Abrir el reproductor de música',

    /* ── Les médias ── */
    'media.video': '▶ Vídeo',

    /* ── La mention légale, l'accès, la vérification ── */
    'legal.mention':
      'Productos reservados a personas mayores de edad. Comprueba la legislación vigente '
      + 'donde estés antes de pedir: la disponibilidad depende de tu jurisdicción.',
    'titre.page': 'Tienda',
    'etat.compteBloque':
      'Esta cuenta no puede hacer pedidos. Escríbenos en la conversación si es un error.',
    'etat.fermeeMessage': 'La tienda está cerrada por el momento.',
    'etat.ouvertCourt': 'Abierto',
    'etat.fermeCourt': 'Cerrado',
    'verif.texteAucune':
      'Para pedir aquí hay que validar un documento de identidad. Envíalo en foto '
      + 'en la conversación del bot: el vendedor lo mira y te responde.',
    'verif.texteEnCours':
      'Tu documento está en proceso de verificación. Recibirás la respuesta en la conversación del bot.',
    'verif.texteRefusee':
      'La verificación ha sido rechazada. Escríbenos en la conversación si crees que es un error.',
    'verif.titreEnCours': 'En verificación',
    'verif.titreRefusee': 'Verificación rechazada',
    'captcha.rate': 'Fallaste. Inténtalo otra vez.',

    /* ── Les suggestions ── */
    'produit.memeCategorieAvec': 'Misma categoría · {cat}',

    /* ── Ce qu'on écrit au vendeur ── */
    'snap.titre': 'Para pedir',
    'snap.texte': 'Los pedidos se hacen por Snapchat: envíanos un mensaje allí. La tienda sirve para elegir.',
    'snap.compris': 'Entendido',
    'msg.article': 'Artículo',

    /* ── Le retour ── */
    'retour.simple': 'Volver',
    'retour.catalogue': 'Volver al catálogo',
    'retour.categories': 'Volver a las categorías',
    'retour.profil': 'Volver a mi perfil',

    /* ── Les listes de noms ── */
    'liste.etAutre': '{liste} y {n} más',
    'liste.etAutres': '{liste} y {n} más',

    /* ── L'écran d'avis ── */
    'avis.ajouteUnMot': 'Añade un comentario',
    'avis.tuAsNote': 'Has valorado {quoi}',
    'avis.dejaNote': 'Ya has valorado {quoi}. Añade un comentario, si quieres.',
    'avis.commandeRef': 'Pedido {ref} — {quoi}',
    'avis.avecPrenom': 'Como «{prenom}»',

    /* ── Ce que lit une synthèse vocale ── */
    'aria.effacer': 'Borrar la búsqueda',
    'aria.trier': 'Ordenar los productos',
    'aria.fermer': 'Cerrar',
    'aria.fiche': 'Ficha del producto',
    'aria.navigation': 'Navegación',
    'aria.medias': 'Medios',
    'aria.mediaPrec': 'Medio anterior',
    'aria.mediaSuiv': 'Medio siguiente',
    'aria.signer': 'Firmar tu opinión',

    /* ── Le lecteur ── */
    'juke.menu': 'Reproductor de música',
    'juke.lecture': 'Reproducir',
    'juke.pause': 'Pausa',
    'juke.precedent': 'Tema anterior',
    'juke.suivant': 'Tema siguiente',

    /* ── Ce qui reste privé dans un avis ── */
    'avis.noteVie':
      'En ambos casos, ni tu usuario de Telegram, ni tu número, ni tu dirección se publican. '
      + 'El vendedor sí ve siempre qué pedido se ha valorado.',

    /* ── Les canaux d'alerte ── */
    'alertes.nouveautes': 'Productos nuevos',
    'alertes.nouveautesAide': 'Un mensaje cuando llega un artículo al catálogo.',
    'alertes.promos': 'Ofertas y códigos',
    'alertes.promosAide': 'Un mensaje cuando empieza un descuento o un código promocional.',

    'ouverture.1': 'Abriendo la tienda…',
    'ouverture.2': 'Conectando la corriente…',
    'ouverture.3': 'Encendiendo los neones…',
    'ouverture.4': 'Sacando la mercancía…',
    'ouverture.5': 'Listo.',
    'ouverture.chargement': 'Cargando…',
    'onglet.accueil': "Inicio",
    'onglet.boutique': "Tienda",
    'onglet.favoris': "Favoritos",
    'onglet.panier': "Carrito",
    'onglet.compte': "Cuenta",
    'vitrine.bienvenue': "Bienvenido",
    'vitrine.tous': "Todos los productos",
    'vitrine.articles': "{n} artículos",
    'vitrine.unArticle': "1 artículo",
    'vitrine.promos': "Ofertas",
    'promo.voir': "Ver las ofertas",
    'promo.titreAuto': "OFERTA FLASH — hasta -{n} %",
    'carte.des': "desde",
    'carte.ajouter': "Añadir al carrito",
    'carte.sansAvis': "Aún sin opiniones",
    'produit.ajouter': "Añadir al carrito",
    'panier.ajoute': "Añadido al carrito",
    'panier.plusDeStock': "No queda stock de este formato",
    'panier.titre': "Mi carrito",
    'panier.vide': "Tu carrito está vacío.",
    'panier.voirBoutique': "Ver la tienda",
    'panier.total': "Total",
    'panier.economie': "Ahorras {montant}",
    'panier.commander': "Pedir",
    'panier.vider': "Vaciar el carrito",
    'panier.copier': "Copiar el resumen",
    'panier.copie': "Resumen copiado",
    'panier.copieImpossible': "No se pudo copiar: selecciona el texto y cópialo",
    'panier.recapTitre': "Mi pedido",
    'panier.recapAide': "Copia este resumen y envíanoslo por Snapchat.",
    'panier.retirer': "Quitar",
    'panier.moins': "Uno menos",
    'panier.plus': "Uno más",
    'favoris.titre': "Mis favoritos",
    'favoris.vide': "Aún no tienes favoritos: toca el corazón de un producto para guardarlo aquí.",
    'son.basculer': "Música",
    'panier.ouvrir': "Abrir el carrito",
    'profil.contact': "¿Una pregunta? Contacto",
    'commande.mode': "Cómo lo recoges",
    'commande.retrait': "🏠 Recogida",
    'commande.surPlace': "en tienda",
    'commande.livraison': "🛵 Entrega",
    'commande.offerte': "gratis",
    'commande.adresse': "Dirección de entrega",
    'commande.rue': "Calle y número",
    'commande.complement': "Edificio, piso, código (opcional)",
    'commande.codePostal': "Código postal",
    'commande.ville': "Ciudad",
    'commande.creneauRetrait': "Franja de recogida",
    'commande.creneauLivraison': "Franja de entrega",
    'commande.choisisCreneau': "Elige una franja",
    'commande.aucunCreneau': "No hay franjas disponibles",
    'commande.complet': "completa",
    'commande.places': "quedan {n}",
    'commande.telephone': "Teléfono (opcional)",
    'commande.telephoneLivraison': "Teléfono (para avisarte al llegar)",
    'commande.telephoneAide': "Para contactarte",
    'commande.code': "Código promocional",
    'commande.codeAide': "Si tienes uno",
    'commande.appliquer': "Aplicar",
    'commande.codeApplique': "Código {code} aplicado: −{montant}",
    'commande.palierMieux': "Tu descuento automático ({label}) es mejor: lo mantenemos.",
    'commande.remiseAuto': "Descuento automático {label}: −{montant}",
    'commande.codeRefuse': "Código rechazado.",
    'commande.ajouteDabord': "Añade primero un artículo.",
    'commande.note': "¿Una nota para el pedido? (opcional)",
    'commande.noteAide': "Punto de recogida, código de la puerta, pregunta…",
    'commande.sousTotal': "Subtotal",
    'commande.remise': "Descuento",
    'commande.fraisLivraison': "Entrega",
    'commande.minimum': "Pedido mínimo {montant}: faltan {reste}.",
    'commande.franco': "Entrega gratis desde {montant}: faltan {reste}.",
    'commande.pasLivre': "Aún no entregamos en {code}. La recogida sigue siendo posible.",
    'commande.zoneFrais': "{montant} de entrega",
    'commande.zoneOfferte': "entrega gratis",
    'commande.zoneMin': "mínimo {montant}",
    'commande.preparation': "Preparando…",
    'commande.fermee': "Tienda cerrada",
    'commande.impossible': "Pedido imposible",
    'commande.ajuste': "Ajusta tu carrito",
    'commande.refusee': "Pedido rechazado.",
    'commande.manqueRue': "Indica la calle y el número.",
    'commande.manqueCP': "Indica tu código postal.",
    'commande.manqueVille': "Indica la ciudad.",
    'commande.stockManque': "{nom}: solo quedan {n}. Ajusta la cantidad.",
    'done.titre': "Pedido registrado",
    'done.texte': "Hemos recibido tu pedido y el vendedor está avisado. La confirmación llega en el chat del bot.",
    'done.texteSans': "Hemos recibido tu pedido y el vendedor está avisado. Te responderá muy pronto.",
    'done.mesCommandes': "Mis pedidos",
    'done.continuer': "Seguir comprando",
    'done.especes': "💶 Pago en efectivo, a la entrega.",
    'done.retrait': "🏠 Recogida en tienda",
    'done.livraison': "🛵 Entrega",
    'o68.badge': "Selección por farms",
    'o68.devise': "La selección · Las farms · Las referencias",
    'o68.references': "Referencias",
    'o68.farms': "Farms",
    'o68.original': "Original",
    'o68.explore': "Explora el catálogo",
    'o68.lesFarms': "Las farms",
    'o68.tout': "Todo",
    'o68.toutesLesFarms': "Todas las farms",
    'o68.nFarms': "{n} farms",
    'o68.aucuneFarm': "Las farms llegan pronto.",
    'onglet.farms': "Farms",
    'onglet.infos': "Info",

    'secours.titre': 'Puerta de emergencia',
    'secours.texte':
      'Un segundo bot abre la misma tienda. Escríbele una vez: si esta conversación ' +
      'desapareciera, allí recibirías la nueva dirección.',
    'secours.ouvrir': 'Guardar la puerta de emergencia',
    'secours.fait': 'Puerta de emergencia guardada',
    'secours.faitAide': 'Se te puede escribir allí. Nada más que hacer.',

    'secours.porteTitre': 'Un mensaje, y ya estás dentro',
    'secours.porteTexte':
      'Esta tienda tiene un segundo bot, por si este desapareciera. Envíale /start y vuelve — la ' +
      'tienda se abre sola.',
    'secours.porteFine':
      'Se pide una sola vez. Sin ese mensaje, Telegram nunca nos dejará darte la nueva dirección ' +
      'el día que esta conversación se detenga.',
    'secours.porteOuvrir': 'Abrir el bot de emergencia',
    'secours.porteReessayer': 'Ya le escribí — reintentar',
    'msg.secoursEnAttente': 'Todavía no — envía /start al bot de emergencia.',
  },

  it: {
    'accueil.bienvenue': 'Benvenuto',
    'accueil.texte':
      '{boutique} è qui per farti scoprire <strong>nuove varietà</strong> e nuove gamme, ' +
      'rinnovate tutto l\'anno. <strong>Qualità garantita</strong> su ogni prodotto del catalogo.',
    'accueil.horaires': '7/7 · 13-24',
    'accueil.service': 'Incontro e consegna',
    'accueil.botApp':
      'Tutto avviene nell\'app: catalogo in immagini, schede prodotto, e il tuo ordine già ' +
      'scritto.',
    'accueil.langue': 'Scegli la tua lingua',
    'accueil.entrer': 'Entra nel negozio',

    'porte.entree': 'Ingresso',
    'porte.marches': 'Passaggio {n} di {total}',
    'porte.titre': 'Un calcolo, e si apre',
    'porte.texte':
      'Torna nella chat del bot: ti pone una piccola addizione. Rispondi, poi torna qui — il ' +
      'negozio si apre da solo.',
    'porte.fine':
      'Viene chiesto una sola volta, per evitare i falsi account. Non ti viene chiesta ' +
      'nessun\'altra informazione.',
    'porte.ouvrir': 'Apri la chat',
    'porte.reessayer': 'Ho risposto — riprova',

    'age.titre': 'Stop!',
    'age.texte':
      'Questo negozio è riservato ai maggiorenni. Confermi di avere <strong>18&nbsp;anni o ' +
      'più</strong>&nbsp;?',
    'age.oui': 'Sì, ho 18 anni',
    'age.non': 'No',

    'tuiles.entete': 'Verifica',
    'tuiles.consigne': 'Rimetti il pezzo al suo posto',
    'tuiles.aide': 'Trascinalo col dito — o usa le frecce della tastiera.',
    'tuiles.pieceAria': 'Il pezzo mancante',
    'tuiles.texte': 'Un attimo, il tempo di verificare che non sei un robot.',
    'tuiles.valider': 'Conferma',

    'verif.entete': 'Accesso controllato',
    'verif.titre': 'Verifica richiesta',
    'verif.fine':
      'Il negozio non conserva il tuo documento: resta nella chat di Telegram, e puoi cancellarlo ' +
      'una volta fatta la verifica.',
    'verif.ouvrir': 'Apri la chat',
    'verif.attendre': 'Guardare il negozio nel frattempo',

    'hero.horaires': 'Aperto 7/7 · 13 – 24',
    'hero.service': 'Incontro e consegna',

    'tri.defaut': 'Ordine: predefinito',
    'tri.nouveautes': 'Prima le novità',
    'tri.prixCroissant': 'Prezzo crescente',
    'tri.prixDecroissant': 'Prezzo decrescente',
    'tri.alphabetique': 'Ordine alfabetico',

    'catalogue.videTotal': 'Il catalogo è vuoto per il momento.',

    'avis.titre': 'Recensioni',
    'avis.voirTous': 'Vedi tutte le recensioni',
    'avis.commentCetait': 'Com\'è andata?',
    'avis.tonAvis': 'La tua recensione',
    'avis.unMot': 'Due parole, se vuoi',
    'avis.facultatif': 'facoltativo',
    'avis.signe': 'Con il mio nome',
    'avis.signeAide': 'Una recensione firmata ispira più fiducia.',
    'avis.anonyme': 'Anonimo',
    'avis.anonymeAide': 'La tua recensione appare senza nome.',
    'avis.plusTard': 'Più tardi',
    'avis.envoyer': 'Invia',

    'catalogue.rienNeCorrespond': 'Nessun risultato per « {mot} ».',
    'catalogue.videCategorie': 'Niente in questa categoria per il momento.',
    'produit.epuiseMinuscule': 'esaurito',

    'etat.fermeDans': 'chiude tra {duree}',
    'etat.ouvreDans': 'apre tra {duree}',
    'etat.minutes': '{n} min',

    'onglet.catalogue': 'Catalogo',
    'onglet.categories': 'Categorie',
    'onglet.contact': 'Contatto',
    'onglet.profil': 'Profilo',

    'catalogue.rechercher': 'Cerca un prodotto',
    'catalogue.epuise': 'ESAURITO',
    'catalogue.retour': 'Torna al catalogo',

    'produit.format': 'Scegli il formato',
    'produit.commander': 'Ordina',
    'produit.epuise': 'Esaurito',
    'produit.prevenir': '🔔 Avvisami quando torna',
    'produit.prevenu': '🔔 Ti avviseremo',
    'alerte.inscrit': 'Ti scriviamo appena torna.',
    'alerte.impossible': 'Iscrizione impossibile per ora.',
    'produit.memeCategorie': 'Stessa categoria',
    'produit.aimerAussi': 'Ti piacerà anche',

    'contact.titre': 'Una domanda?',
    'contact.texte':
      'Un dubbio su un prodotto, un ordine che tarda, una richiesta particolare: scrivici ' +
      'su Snapchat, rispondiamo lì.',

    'profil.titre': 'Il mio profilo',
    'profil.commandes': 'Ordini',
    'profil.favoris': 'Preferiti',
    'profil.produits': 'Prodotti',
    'profil.alertes': 'Avvisi',
    'profil.langue': 'Lingua',
    'profil.langueAide': 'I testi del negozio. I prodotti restano nella lingua del venditore.',
    'profil.alertesIntro':
      'Quello che il negozio può inviarti in questa chat. Spegni e riaccendi quando vuoi.',
    'profil.stop':
      '⚠️ Hai inviato <b>/stop</b> al bot: non riceverai nulla finché non scrivi <b>/annonces</b> ' +
      'per riaprire la porta.',

    'etat.ouverte': 'Negozio aperto',
    'etat.fermee': 'Negozio chiuso',
    'etat.dispo': 'Disponibile ora',
    'etat.retourA': 'Torniamo alle',
    'etat.fermePourLInstant': 'Chiuso per ora',

    'msg.chargement': 'Caricamento…',
    'msg.injoignable': 'Negozio momentaneamente irraggiungibile',
    'msg.injoignableTexte':
      'Non è stato possibile caricare il catalogo. Non è che il negozio sia vuoto: il server non ' +
      'risponde come dovrebbe.',
    'msg.reessayer': 'Riprova',
    'msg.catalogueIndispo': 'Catalogo non disponibile, riprova tra un attimo.',
    'msg.pieceEnAttente': 'Potrai ordinare una volta convalidato il documento.',
    'msg.calculEnAttente': 'Non ancora — rispondi al calcolo in chat.',
    'msg.articleParti': 'Questo articolo non è più a catalogo. Ecco il resto del negozio.',
    'msg.verifIndispo': 'Verifica non disponibile. Riprova tra un attimo.',
    'msg.reglageRefuse': 'Impostazione non salvata, riprova.',


    'rayon.unProduit': '1 prodotto',
    'rayon.produits': '{n} prodotti',

    'contact.onPrend': 'Prendiamo ordini.',
    'contact.onRouvre': 'Riapriamo presto.',
    'contact.retrait': 'Ritiro di persona',
    'contact.retraitDetail': 'Appuntamento concordato in chat.',
    'contact.livraison': 'Consegna',
    'contact.livraisonDetail': 'Indirizzo richiesto al momento dell\'ordine.',
    'contact.especes': 'Pagamento in contanti',
    'contact.especesDetail': 'Alla consegna, niente in anticipo.',

    'favori.mettre': 'Aggiungi ai preferiti',
    'favori.retirer': 'Togli dai preferiti',
    'favori.epuiseAlerte': 'Esaurito — attiva l\'avviso di ritorno',
    'favoris.desactives': 'I preferiti non sono attivi in questo negozio.',
    'favoris.vide': 'Tocca il ♥ su un prodotto per tenerlo qui.',

    'commandes.desactivees': 'Lo storico degli ordini non è attivo in questo negozio.',
    'commandes.vide': 'Non hai ancora fatto ordini.',
    'commandes.depuisTelegram': 'Apri il negozio da Telegram per ritrovare i tuoi ordini.',
    'commandes.profilIndispo': 'Profilo non disponibile per il momento.',
    'profil.client': 'Cliente {boutique}',

    'avis.compte': 'Recensioni ({n})',
    'avis.voirLesN': 'Vedi le {n} recensioni',
    'avis.uneEtoile': '{n} stella',
    'avis.desEtoiles': '{n} stelle',
    'avis.toucheUneEtoile': 'Tocca almeno una stella.',
    'avis.merci': 'Grazie per la tua recensione!',
    'avis.envoi': 'Invio…',
    'avis.refuse': 'Recensione rifiutata.',
    'avis.tonAvisSur': 'La tua recensione su {quoi}',
    'avis.reponseBoutique': 'Risposta del negozio',

    'juke.ouvrir': 'Apri il lettore musicale',

    'media.video': '▶ Video',

    'legal.mention':
      'Prodotti riservati ai maggiorenni. Verifica la legge in vigore dove ti trovi prima di ' +
      'ordinare: la disponibilità di questi prodotti dipende dalla tua giurisdizione.',
    'titre.page': 'Negozio',
    'etat.compteBloque': 'Questo account non può ordinare. Scrivici in chat se è un errore.',
    'etat.fermeeMessage': 'Il negozio è chiuso per il momento.',
    'etat.ouvertCourt': 'Aperto',
    'etat.fermeCourt': 'Chiuso',
    'verif.texteAucune':
      'Per ordinare qui serve convalidare un documento d\'identità. Inviane una foto nella chat ' +
      'del bot: il venditore la guarda e ti risponde.',
    'verif.texteEnCours':
      'Il tuo documento è in verifica. Riceverai la risposta nella chat del bot.',
    'verif.texteRefusee': 'La verifica è stata rifiutata. Scrivici in chat se pensi sia un errore.',
    'verif.titreEnCours': 'In verifica',
    'verif.titreRefusee': 'Verifica rifiutata',
    'captcha.rate': 'Sbagliato. Riprova.',

    'produit.memeCategorieAvec': 'Stessa categoria · {cat}',

    'snap.titre': 'Per ordinare',
    'snap.texte': 'Gli ordini si prendono su Snapchat: mandaci un messaggio lì. Il negozio serve a scegliere.',
    'snap.compris': 'Ho capito',
    'msg.article': 'Articolo',

    'retour.simple': 'Indietro',
    'retour.catalogue': 'Torna al catalogo',
    'retour.categories': 'Torna alle categorie',
    'retour.profil': 'Torna al profilo',

    'liste.etAutre': '{liste} e altro {n}',
    'liste.etAutres': '{liste} e altri {n}',

    'avis.ajouteUnMot': 'Aggiungi due parole',
    'avis.tuAsNote': 'Hai valutato {quoi}',
    'avis.dejaNote': 'Hai già valutato {quoi}. Aggiungi due parole, se vuoi.',
    'avis.commandeRef': 'Ordine {ref} — {quoi}',
    'avis.avecPrenom': 'Come « {prenom} »',

    'aria.effacer': 'Cancella la ricerca',
    'aria.trier': 'Ordina i prodotti',
    'aria.fermer': 'Chiudi',
    'aria.fiche': 'Scheda prodotto',
    'aria.navigation': 'Navigazione',
    'aria.medias': 'Media',
    'aria.mediaPrec': 'Media precedente',
    'aria.mediaSuiv': 'Media successivo',
    'aria.signer': 'Firma la tua recensione',

    'juke.menu': 'Lettore musicale',
    'juke.lecture': 'Riproduci',
    'juke.pause': 'Pausa',
    'juke.precedent': 'Brano precedente',
    'juke.suivant': 'Brano successivo',

    'avis.noteVie':
      'In entrambi i casi, né il tuo nome Telegram, né il tuo numero, né il tuo indirizzo vengono ' +
      'pubblicati. Il venditore, però, vede sempre quale ordine è stato valutato.',

    'alertes.nouveautes': 'Nuovi prodotti',
    'alertes.nouveautesAide': 'Un messaggio quando arriva un articolo a catalogo.',
    'alertes.promos': 'Offerte e codici',
    'alertes.promosAide': 'Un messaggio quando parte uno sconto o un codice.',

    'ouverture.1': 'Apertura del negozio…',
    'ouverture.2': 'Colleghiamo la corrente…',
    'ouverture.3': 'Accendiamo i neon…',
    'ouverture.4': 'Tiriamo fuori la merce…',
    'ouverture.5': 'Pronto.',
    'ouverture.chargement': 'Caricamento…',
    'onglet.accueil': "Home",
    'onglet.boutique': "Negozio",
    'onglet.favoris': "Preferiti",
    'onglet.panier': "Carrello",
    'onglet.compte': "Account",
    'vitrine.bienvenue': "Benvenuto",
    'vitrine.tous': "Tutti i prodotti",
    'vitrine.articles': "{n} articoli",
    'vitrine.unArticle': "1 articolo",
    'vitrine.promos': "Promo",
    'promo.voir': "Vedi le offerte",
    'promo.titreAuto': "PROMO FLASH — fino a -{n} %",
    'carte.des': "da",
    'carte.ajouter': "Aggiungi al carrello",
    'carte.sansAvis': "Ancora nessuna recensione",
    'produit.ajouter': "Aggiungi al carrello",
    'panier.ajoute': "Aggiunto al carrello",
    'panier.plusDeStock': "Nessuna disponibilità per questo formato",
    'panier.titre': "Il mio carrello",
    'panier.vide': "Il tuo carrello è vuoto.",
    'panier.voirBoutique': "Vedi il negozio",
    'panier.total': "Totale",
    'panier.economie': "Risparmi {montant}",
    'panier.commander': "Ordina",
    'panier.vider': "Svuota il carrello",
    'panier.copier': "Copia il riepilogo",
    'panier.copie': "Riepilogo copiato",
    'panier.copieImpossible': "Copia non riuscita: seleziona il testo e copialo",
    'panier.recapTitre': "Il mio ordine",
    'panier.recapAide': "Copia questo riepilogo e mandacelo su Snapchat.",
    'panier.retirer': "Togli",
    'panier.moins': "Uno in meno",
    'panier.plus': "Uno in più",
    'favoris.titre': "I miei preferiti",
    'favoris.vide': "Nessun preferito per ora: tocca il cuore di un prodotto per tenerlo qui.",
    'son.basculer': "Musica",
    'panier.ouvrir': "Apri il carrello",
    'profil.contact': "Una domanda? Contatto",
    'commande.mode': "Come lo ritiri",
    'commande.retrait': "🏠 Ritiro",
    'commande.surPlace': "in sede",
    'commande.livraison': "🛵 Consegna",
    'commande.offerte': "gratis",
    'commande.adresse': "Indirizzo di consegna",
    'commande.rue': "Via e numero",
    'commande.complement': "Edificio, piano, codice (facoltativo)",
    'commande.codePostal': "CAP",
    'commande.ville': "Città",
    'commande.creneauRetrait': "Fascia di ritiro",
    'commande.creneauLivraison': "Fascia di consegna",
    'commande.choisisCreneau': "Scegli una fascia",
    'commande.aucunCreneau': "Nessuna fascia disponibile",
    'commande.complet': "completa",
    'commande.places': "{n} posti",
    'commande.telephone': "Telefono (facoltativo)",
    'commande.telephoneLivraison': "Telefono (per avvisarti all'arrivo)",
    'commande.telephoneAide': "Per contattarti",
    'commande.code': "Codice promo",
    'commande.codeAide': "Se ne hai uno",
    'commande.appliquer': "Applica",
    'commande.codeApplique': "Codice {code} applicato: −{montant}",
    'commande.palierMieux': "Il tuo sconto automatico ({label}) conviene di più: lo teniamo.",
    'commande.remiseAuto': "Sconto automatico {label}: −{montant}",
    'commande.codeRefuse': "Codice rifiutato.",
    'commande.ajouteDabord': "Aggiungi prima un articolo.",
    'commande.note': "Una nota per l'ordine? (facoltativo)",
    'commande.noteAide': "Punto di ritiro, codice del portone, domanda…",
    'commande.sousTotal': "Subtotale",
    'commande.remise': "Sconto",
    'commande.fraisLivraison': "Consegna",
    'commande.minimum': "Ordine minimo {montant}: mancano {reste}.",
    'commande.franco': "Consegna gratuita da {montant}: mancano {reste}.",
    'commande.pasLivre': "Non consegniamo ancora a {code}. Il ritiro resta possibile.",
    'commande.zoneFrais': "{montant} di consegna",
    'commande.zoneOfferte': "consegna gratuita",
    'commande.zoneMin': "minimo {montant}",
    'commande.preparation': "Preparazione…",
    'commande.fermee': "Negozio chiuso",
    'commande.impossible': "Ordine impossibile",
    'commande.ajuste': "Sistema il carrello",
    'commande.refusee': "Ordine rifiutato.",
    'commande.manqueRue': "Indica via e numero.",
    'commande.manqueCP': "Indica il CAP.",
    'commande.manqueVille': "Indica la città.",
    'commande.stockManque': "{nom}: ne restano solo {n}. Sistema la quantità.",
    'done.titre': "Ordine registrato",
    'done.texte': "Abbiamo ricevuto il tuo ordine, il venditore è avvisato. La conferma arriva nella chat del bot.",
    'done.texteSans': "Abbiamo ricevuto il tuo ordine, il venditore è avvisato. Ti risponderà presto.",
    'done.mesCommandes': "I miei ordini",
    'done.continuer': "Continua gli acquisti",
    'done.especes': "💶 Pagamento in contanti, alla consegna.",
    'done.retrait': "🏠 Ritiro in sede",
    'done.livraison': "🛵 Consegna",
    'o68.badge': "Selezione per farm",
    'o68.devise': "La selezione · Le farm · Le referenze",
    'o68.references': "Referenze",
    'o68.farms': "Farm",
    'o68.original': "Original",
    'o68.explore': "Esplora il catalogo",
    'o68.lesFarms': "Le farm",
    'o68.tout': "Tutto",
    'o68.toutesLesFarms': "Tutte le farm",
    'o68.nFarms': "{n} farm",
    'o68.aucuneFarm': "Le farm arrivano presto.",
    'onglet.farms': "Farm",
    'onglet.infos': "Info",

    'secours.titre': 'Porta di riserva',
    'secours.texte':
      'Un secondo bot apre lo stesso negozio. Scrivigli una volta: se questa conversazione ' +
      'dovesse sparire, è lì che riceverai il nuovo indirizzo.',
    'secours.ouvrir': 'Salva la porta di riserva',
    'secours.fait': 'Porta di riserva salvata',
    'secours.faitAide': 'Sei raggiungibile lì. Non serve altro.',

    'secours.porteTitre': 'Un messaggio, e sei dentro',
    'secours.porteTexte':
      'Questo negozio ha un secondo bot, nel caso questo sparisse. Mandagli /start, poi torna — ' +
      'il negozio si apre da solo.',
    'secours.porteFine':
      'Si chiede una volta sola. Senza quel messaggio, Telegram non ci lascerà mai darti il nuovo ' +
      'indirizzo il giorno in cui questa conversazione si fermerà.',
    'secours.porteOuvrir': 'Apri il bot di riserva',
    'secours.porteReessayer': 'Gli ho scritto — riprova',
    'msg.secoursEnAttente': 'Non ancora — manda /start al bot di riserva.',
  },

  nl: {
    'accueil.bienvenue': 'Welkom',
    'accueil.texte':
      '{boutique} laat je <strong>nieuwe soorten</strong> en nieuwe reeksen ontdekken, het hele ' +
      'jaar door vernieuwd. <strong>Gegarandeerde kwaliteit</strong> op elk product in de ' +
      'catalogus.',
    'accueil.horaires': '7/7 · 13-24 u',
    'accueil.service': 'Afspraak & levering',
    'accueil.botApp':
      'Alles gebeurt in de app: catalogus in beeld, productpagina\'s, en je bestelling al ' +
      'opgesteld.',
    'accueil.langue': 'Kies je taal',
    'accueil.entrer': 'Naar de winkel',

    'porte.entree': 'Ingang',
    'porte.marches': 'Stap {n} van {total}',
    'porte.titre': 'Eén sommetje en het is open',
    'porte.texte':
      'Ga terug naar het gesprek met de bot: daar krijg je een kleine optelsom. Beantwoord die en ' +
      'kom terug — de winkel gaat vanzelf open.',
    'porte.fine':
      'Dit wordt maar één keer gevraagd, om nepaccounts te vermijden. Verder wordt je niets ' +
      'gevraagd.',
    'porte.ouvrir': 'Gesprek openen',
    'porte.reessayer': 'Geantwoord — opnieuw proberen',

    'age.titre': 'Stop!',
    'age.texte':
      'Deze winkel is alleen voor meerderjarigen. Bevestig je dat je <strong>18&nbsp;jaar of ' +
      'ouder</strong> bent&nbsp;?',
    'age.oui': 'Ja, ik ben 18',
    'age.non': 'Nee',

    'tuiles.entete': 'Controle',
    'tuiles.consigne': 'Leg het ontbrekende stuk terug',
    'tuiles.aide': 'Schuif het met je vinger — of gebruik de pijltjestoetsen.',
    'tuiles.pieceAria': 'Het ontbrekende stuk',
    'tuiles.texte': 'Even kijken of je geen robot bent.',
    'tuiles.valider': 'Bevestigen',

    'verif.entete': 'Gecontroleerde toegang',
    'verif.titre': 'Controle vereist',
    'verif.fine':
      'De winkel bewaart je document niet: het blijft in het Telegram-gesprek, en je kunt het na ' +
      'de controle verwijderen.',
    'verif.ouvrir': 'Gesprek openen',
    'verif.attendre': 'Ondertussen rondkijken',

    'hero.horaires': 'Open 7/7 · 13 – 24 u',
    'hero.service': 'Afspraak & levering',

    'tri.defaut': 'Sortering: standaard',
    'tri.nouveautes': 'Nieuw eerst',
    'tri.prixCroissant': 'Prijs oplopend',
    'tri.prixDecroissant': 'Prijs aflopend',
    'tri.alphabetique': 'Alfabetisch',

    'catalogue.videTotal': 'De catalogus is voorlopig leeg.',

    'avis.titre': 'Beoordelingen',
    'avis.voirTous': 'Alle beoordelingen bekijken',
    'avis.commentCetait': 'Hoe was het?',
    'avis.tonAvis': 'Jouw beoordeling',
    'avis.unMot': 'Een woordje, als je wilt',
    'avis.facultatif': 'optioneel',
    'avis.signe': 'Met mijn voornaam',
    'avis.signeAide': 'Een ondertekende beoordeling wekt meer vertrouwen.',
    'avis.anonyme': 'Anoniem',
    'avis.anonymeAide': 'Je beoordeling verschijnt zonder naam.',
    'avis.plusTard': 'Later',
    'avis.envoyer': 'Versturen',

    'catalogue.rienNeCorrespond': 'Niets komt overeen met « {mot} ».',
    'catalogue.videCategorie': 'Voorlopig niets in deze categorie.',
    'produit.epuiseMinuscule': 'uitverkocht',

    'etat.fermeDans': 'sluit over {duree}',
    'etat.ouvreDans': 'opent over {duree}',
    'etat.minutes': '{n} min',

    'onglet.catalogue': 'Catalogus',
    'onglet.categories': 'Categorieën',
    'onglet.contact': 'Contact',
    'onglet.profil': 'Profiel',

    'catalogue.rechercher': 'Een product zoeken',
    'catalogue.epuise': 'UITVERKOCHT',
    'catalogue.retour': 'Terug naar de catalogus',

    'produit.format': 'Kies je formaat',
    'produit.commander': 'Bestellen',
    'produit.epuise': 'Uitverkocht',
    'produit.prevenir': '🔔 Waarschuw me',
    'produit.prevenu': '🔔 Je krijgt bericht',
    'alerte.inscrit': 'We schrijven je zodra het terug is.',
    'alerte.impossible': 'Inschrijven lukt nu niet.',
    'produit.memeCategorie': 'Zelfde categorie',
    'produit.aimerAussi': 'Dit vind je ook leuk',

    'contact.titre': 'Een vraag?',
    'contact.texte':
      'Twijfel over een product, een bestelling die op zich laat wachten, een bijzondere vraag: ' +
      'schrijf ons op Snapchat, daar antwoorden we.',

    'profil.titre': 'Mijn profiel',
    'profil.commandes': 'Bestellingen',
    'profil.favoris': 'Favorieten',
    'profil.produits': 'Producten',
    'profil.alertes': 'Meldingen',
    'profil.langue': 'Taal',
    'profil.langueAide':
      'De teksten van de winkel. De producten blijven in de taal van de verkoper.',
    'profil.alertesIntro':
      'Wat de winkel je in dit gesprek mag sturen. Je zet het uit en weer aan wanneer je wilt.',
    'profil.stop':
      '⚠️ Je hebt <b>/stop</b> naar de bot gestuurd: je ontvangt niets meer tot je ' +
      '<b>/annonces</b> schrijft om de deur weer te openen.',

    'etat.ouverte': 'Winkel open',
    'etat.fermee': 'Winkel gesloten',
    'etat.dispo': 'Nu beschikbaar',
    'etat.retourA': 'Terug om',
    'etat.fermePourLInstant': 'Nu gesloten',

    'msg.chargement': 'Laden…',
    'msg.injoignable': 'Winkel tijdelijk onbereikbaar',
    'msg.injoignableTexte':
      'De catalogus kon niet worden geladen. Het is niet zo dat de winkel leeg is: de server ' +
      'antwoordt niet zoals het hoort.',
    'msg.reessayer': 'Opnieuw proberen',
    'msg.catalogueIndispo': 'Catalogus niet beschikbaar, probeer het zo nog eens.',
    'msg.pieceEnAttente': 'Je kunt bestellen zodra je document is goedgekeurd.',
    'msg.calculEnAttente': 'Nog niet — beantwoord de som in het gesprek.',
    'msg.articleParti':
      'Dit artikel staat niet meer in de catalogus. Hier is de rest van de winkel.',
    'msg.verifIndispo': 'Controle niet beschikbaar. Probeer het zo nog eens.',
    'msg.reglageRefuse': 'Instelling niet opgeslagen, probeer opnieuw.',


    'rayon.unProduit': '1 product',
    'rayon.produits': '{n} producten',

    'contact.onPrend': 'We nemen bestellingen aan.',
    'contact.onRouvre': 'We openen binnenkort weer.',
    'contact.retrait': 'Ophalen ter plaatse',
    'contact.retraitDetail': 'Afspraak wordt in het gesprek gemaakt.',
    'contact.livraison': 'Levering',
    'contact.livraisonDetail': 'Adres wordt bij de bestelling gevraagd.',
    'contact.especes': 'Contante betaling',
    'contact.especesDetail': 'Bij overhandiging, niets vooraf.',

    'favori.mettre': 'Aan favorieten toevoegen',
    'favori.retirer': 'Uit favorieten halen',
    'favori.epuiseAlerte': 'Uitverkocht — zet de melding aan',
    'favoris.desactives': 'Favorieten staan niet aan in deze winkel.',
    'favoris.vide': 'Tik het ♥ op een product aan om het hier te bewaren.',

    'commandes.desactivees': 'De bestelgeschiedenis staat niet aan in deze winkel.',
    'commandes.vide': 'Je hebt nog niets besteld.',
    'commandes.depuisTelegram': 'Open de winkel via Telegram om je bestellingen terug te vinden.',
    'commandes.profilIndispo': 'Profiel nu niet beschikbaar.',
    'profil.client': 'Klant van {boutique}',

    'avis.compte': 'Beoordelingen ({n})',
    'avis.voirLesN': 'Alle {n} beoordelingen bekijken',
    'avis.uneEtoile': '{n} ster',
    'avis.desEtoiles': '{n} sterren',
    'avis.toucheUneEtoile': 'Tik minstens één ster aan.',
    'avis.merci': 'Bedankt voor je beoordeling!',
    'avis.envoi': 'Versturen…',
    'avis.refuse': 'Beoordeling geweigerd.',
    'avis.tonAvisSur': 'Jouw beoordeling van {quoi}',
    'avis.reponseBoutique': 'Antwoord van de winkel',

    'juke.ouvrir': 'Muziekspeler openen',

    'media.video': '▶ Video',

    'legal.mention':
      'Producten alleen voor meerderjarigen. Controleer de wetgeving die bij jou geldt voordat je ' +
      'bestelt: of deze producten beschikbaar zijn, hangt af van jouw rechtsgebied.',
    'titre.page': 'Winkel',
    'etat.compteBloque':
      'Dit account kan niet bestellen. Schrijf ons in het gesprek als dit een vergissing is.',
    'etat.fermeeMessage': 'De winkel is op dit moment gesloten.',
    'etat.ouvertCourt': 'Open',
    'etat.fermeCourt': 'Gesloten',
    'verif.texteAucune':
      'Om hier te bestellen moet een identiteitsbewijs worden goedgekeurd. Stuur er een foto van ' +
      'in het gesprek met de bot: de verkoper bekijkt het en antwoordt je.',
    'verif.texteEnCours':
      'Je document wordt gecontroleerd. Je krijgt het antwoord in het gesprek met de bot.',
    'verif.texteRefusee':
      'De controle is geweigerd. Schrijf ons in het gesprek als je denkt dat dit een vergissing ' +
      'is.',
    'verif.titreEnCours': 'Wordt gecontroleerd',
    'verif.titreRefusee': 'Controle geweigerd',
    'captcha.rate': 'Mis. Probeer het nog eens.',

    'produit.memeCategorieAvec': 'Zelfde categorie · {cat}',

    'snap.titre': 'Om te bestellen',
    'snap.texte': 'Bestellingen gaan via Snapchat: stuur ons daar een bericht. De winkel is om te kiezen.',
    'snap.compris': 'Begrepen',
    'msg.article': 'Artikel',

    'retour.simple': 'Terug',
    'retour.catalogue': 'Terug naar de catalogus',
    'retour.categories': 'Terug naar de categorieën',
    'retour.profil': 'Terug naar het profiel',

    'liste.etAutre': '{liste} en {n} andere',
    'liste.etAutres': '{liste} en {n} andere',

    'avis.ajouteUnMot': 'Een woordje toevoegen',
    'avis.tuAsNote': 'Je hebt {quoi} beoordeeld',
    'avis.dejaNote': 'Je hebt {quoi} al beoordeeld. Voeg een woordje toe, als je wilt.',
    'avis.commandeRef': 'Bestelling {ref} — {quoi}',
    'avis.avecPrenom': 'Als « {prenom} »',

    'aria.effacer': 'Zoekopdracht wissen',
    'aria.trier': 'Producten sorteren',
    'aria.fermer': 'Sluiten',
    'aria.fiche': 'Productpagina',
    'aria.navigation': 'Navigatie',
    'aria.medias': 'Media',
    'aria.mediaPrec': 'Vorige media',
    'aria.mediaSuiv': 'Volgende media',
    'aria.signer': 'Je beoordeling ondertekenen',

    'juke.menu': 'Muziekspeler',
    'juke.lecture': 'Afspelen',
    'juke.pause': 'Pauze',
    'juke.precedent': 'Vorig nummer',
    'juke.suivant': 'Volgend nummer',

    'avis.noteVie':
      'In beide gevallen worden noch je Telegram-naam, noch je nummer, noch je adres ' +
      'gepubliceerd. De verkoper ziet wel altijd welke bestelling is beoordeeld.',

    'alertes.nouveautes': 'Nieuwe producten',
    'alertes.nouveautesAide': 'Een bericht wanneer er een artikel in de catalogus komt.',
    'alertes.promos': 'Acties en codes',
    'alertes.promosAide': 'Een bericht wanneer een korting of code begint.',

    'ouverture.1': 'De winkel gaat open…',
    'ouverture.2': 'We zetten de stroom aan…',
    'ouverture.3': 'We doen de neonlampen aan…',
    'ouverture.4': 'We halen de waar tevoorschijn…',
    'ouverture.5': 'Klaar.',
    'ouverture.chargement': 'Laden…',
    'onglet.accueil': "Home",
    'onglet.boutique': "Winkel",
    'onglet.favoris': "Favorieten",
    'onglet.panier': "Winkelmand",
    'onglet.compte': "Account",
    'vitrine.bienvenue': "Welkom",
    'vitrine.tous': "Alle producten",
    'vitrine.articles': "{n} artikelen",
    'vitrine.unArticle': "1 artikel",
    'vitrine.promos': "Acties",
    'promo.voir': "Bekijk de acties",
    'promo.titreAuto': "FLASH ACTIE — tot -{n}%",
    'carte.des': "vanaf",
    'carte.ajouter': "In winkelmand",
    'carte.sansAvis': "Nog geen reviews",
    'produit.ajouter': "In winkelmand",
    'panier.ajoute': "Toegevoegd aan winkelmand",
    'panier.plusDeStock': "Geen voorraad meer voor dit formaat",
    'panier.titre': "Mijn winkelmand",
    'panier.vide': "Je winkelmand is leeg.",
    'panier.voirBoutique': "Bekijk de winkel",
    'panier.total': "Totaal",
    'panier.economie': "Je bespaart {montant}",
    'panier.commander': "Bestellen",
    'panier.vider': "Winkelmand legen",
    'panier.copier': "Overzicht kopiëren",
    'panier.copie': "Overzicht gekopieerd",
    'panier.copieImpossible': "Kopiëren mislukt: selecteer de tekst en kopieer hem",
    'panier.recapTitre': "Mijn bestelling",
    'panier.recapAide': "Kopieer dit overzicht en stuur het ons via Snapchat.",
    'panier.retirer': "Verwijderen",
    'panier.moins': "Eén minder",
    'panier.plus': "Eén meer",
    'favoris.titre': "Mijn favorieten",
    'favoris.vide': "Nog geen favorieten: tik op het hartje van een product om het hier te bewaren.",
    'son.basculer': "Muziek",
    'panier.ouvrir': "Winkelmand openen",
    'profil.contact': "Een vraag? Contact",
    'commande.mode': "Hoe je het ophaalt",
    'commande.retrait': "🏠 Afhalen",
    'commande.surPlace': "ter plaatse",
    'commande.livraison': "🛵 Bezorgen",
    'commande.offerte': "gratis",
    'commande.adresse': "Bezorgadres",
    'commande.rue': "Straat en nummer",
    'commande.complement': "Gebouw, verdieping, deurcode (optioneel)",
    'commande.codePostal': "Postcode",
    'commande.ville': "Plaats",
    'commande.creneauRetrait': "Afhaalmoment",
    'commande.creneauLivraison': "Bezorgmoment",
    'commande.choisisCreneau': "Kies een moment",
    'commande.aucunCreneau': "Geen moment beschikbaar",
    'commande.complet': "vol",
    'commande.places': "nog {n}",
    'commande.telephone': "Telefoon (optioneel)",
    'commande.telephoneLivraison': "Telefoon (om te laten weten dat we er zijn)",
    'commande.telephoneAide': "Om je te bereiken",
    'commande.code': "Kortingscode",
    'commande.codeAide': "Als je er een hebt",
    'commande.appliquer': "Toepassen",
    'commande.codeApplique': "Code {code} toegepast: −{montant}",
    'commande.palierMieux': "Je automatische korting ({label}) is voordeliger: die houden we.",
    'commande.remiseAuto': "Automatische korting {label}: −{montant}",
    'commande.codeRefuse': "Code geweigerd.",
    'commande.ajouteDabord': "Voeg eerst een artikel toe.",
    'commande.note': "Een opmerking bij de bestelling? (optioneel)",
    'commande.noteAide': "Afhaalpunt, deurcode, vraag…",
    'commande.sousTotal': "Subtotaal",
    'commande.remise': "Korting",
    'commande.fraisLivraison': "Bezorging",
    'commande.minimum': "Minimale bestelling {montant}: nog {reste}.",
    'commande.franco': "Gratis bezorging vanaf {montant}: nog {reste}.",
    'commande.pasLivre': "We bezorgen nog niet in {code}. Afhalen kan nog steeds.",
    'commande.zoneFrais': "{montant} bezorging",
    'commande.zoneOfferte': "gratis bezorging",
    'commande.zoneMin': "minimaal {montant}",
    'commande.preparation': "Bezig…",
    'commande.fermee': "Winkel gesloten",
    'commande.impossible': "Bestellen niet mogelijk",
    'commande.ajuste': "Pas je winkelmand aan",
    'commande.refusee': "Bestelling geweigerd.",
    'commande.manqueRue': "Vul straat en nummer in.",
    'commande.manqueCP': "Vul je postcode in.",
    'commande.manqueVille': "Vul de plaats in.",
    'commande.stockManque': "{nom}: nog maar {n} over. Pas het aantal aan.",
    'done.titre': "Bestelling ontvangen",
    'done.texte': "We hebben je bestelling ontvangen, de verkoper is op de hoogte. De bevestiging komt in de chat met de bot.",
    'done.texteSans': "We hebben je bestelling ontvangen, de verkoper is op de hoogte. Hij komt snel bij je terug.",
    'done.mesCommandes': "Mijn bestellingen",
    'done.continuer': "Verder winkelen",
    'done.especes': "💶 Contant betalen, bij overhandiging.",
    'done.retrait': "🏠 Afhalen ter plaatse",
    'done.livraison': "🛵 Bezorgen",
    'o68.badge': "Selectie per farm",
    'o68.devise': "De selectie · De farms · De referenties",
    'o68.references': "Referenties",
    'o68.farms': "Farms",
    'o68.original': "Original",
    'o68.explore': "Ontdek de catalogus",
    'o68.lesFarms': "De farms",
    'o68.tout': "Alles",
    'o68.toutesLesFarms': "Alle farms",
    'o68.nFarms': "{n} farms",
    'o68.aucuneFarm': "De farms komen eraan.",
    'onglet.farms': "Farms",
    'onglet.infos': "Info",

    'secours.titre': 'Reservedeur',
    'secours.texte':
      'Een tweede bot opent dezelfde winkel. Schrijf hem één keer: als dit gesprek verdwijnt, ' +
      'krijg je daar het nieuwe adres.',
    'secours.ouvrir': 'Reservedeur opslaan',
    'secours.fait': 'Reservedeur opgeslagen',
    'secours.faitAide': 'Je bent daar bereikbaar. Verder niets te doen.',

    'secours.porteTitre': 'Eén bericht, en je bent binnen',
    'secours.porteTexte':
      'Deze winkel heeft een tweede bot, voor het geval deze verdwijnt. Stuur hem /start en kom ' +
      'terug — de winkel gaat vanzelf open.',
    'secours.porteFine':
      'Wordt maar één keer gevraagd. Zonder dat bericht laat Telegram ons nooit het nieuwe adres ' +
      'sturen op de dag dat dit gesprek stopt.',
    'secours.porteOuvrir': 'Reservebot openen',
    'secours.porteReessayer': 'Geschreven — opnieuw proberen',
    'msg.secoursEnAttente': 'Nog niet — stuur /start naar de reservebot.',
  },

  pt: {
    'accueil.bienvenue': 'Bem-vindo',
    'accueil.texte':
      '{boutique} está aqui para te dar a conhecer <strong>novas variedades</strong> e novas ' +
      'gamas, renovadas todo o ano. <strong>Qualidade garantida</strong> em cada produto do ' +
      'catálogo.',
    'accueil.horaires': '7/7 · 13H-00H',
    'accueil.service': 'Encontro e entrega',
    'accueil.botApp':
      'Tudo acontece na app: catálogo em imagens, fichas de produto, e a tua encomenda já ' +
      'escrita.',
    'accueil.langue': 'Escolhe a tua língua',
    'accueil.entrer': 'Entrar na loja',

    'porte.entree': 'Entrada',
    'porte.marches': 'Passo {n} de {total}',
    'porte.titre': 'Uma conta, e está aberto',
    'porte.texte':
      'Volta à conversa do bot: ele põe-te uma pequena soma. Responde e volta — a loja abre ' +
      'sozinha.',
    'porte.fine':
      'É pedido uma só vez, para evitar contas falsas. Não te é pedida mais nenhuma informação.',
    'porte.ouvrir': 'Abrir a conversa',
    'porte.reessayer': 'Já respondi — tentar de novo',

    'age.titre': 'Alto!',
    'age.texte':
      'Esta loja é reservada a maiores de idade. Confirmas ter <strong>18&nbsp;anos ou ' +
      'mais</strong>&nbsp;?',
    'age.oui': 'Sim, tenho 18 anos',
    'age.non': 'Não',

    'tuiles.entete': 'Verificação',
    'tuiles.consigne': 'Repõe a peça em falta',
    'tuiles.aide': 'Arrasta-a com o dedo — ou usa as setas do teclado.',
    'tuiles.pieceAria': 'A peça em falta',
    'tuiles.texte': 'Um segundo, para verificar que não és um robô.',
    'tuiles.valider': 'Confirmar',

    'verif.entete': 'Acesso controlado',
    'verif.titre': 'Verificação necessária',
    'verif.fine':
      'A loja não guarda o teu documento: fica na conversa do Telegram, e podes apagá-lo depois ' +
      'da verificação.',
    'verif.ouvrir': 'Abrir a conversa',
    'verif.attendre': 'Ver a loja entretanto',

    'hero.horaires': 'Aberto 7/7 · 13h – 00h',
    'hero.service': 'Encontro e entrega',

    'tri.defaut': 'Ordem: predefinida',
    'tri.nouveautes': 'Novidades primeiro',
    'tri.prixCroissant': 'Preço crescente',
    'tri.prixDecroissant': 'Preço decrescente',
    'tri.alphabetique': 'Ordem alfabética',

    'catalogue.videTotal': 'O catálogo está vazio de momento.',

    'avis.titre': 'Avaliações',
    'avis.voirTous': 'Ver todas as avaliações',
    'avis.commentCetait': 'Como foi?',
    'avis.tonAvis': 'A tua avaliação',
    'avis.unMot': 'Uma palavra, se quiseres',
    'avis.facultatif': 'opcional',
    'avis.signe': 'Com o meu nome',
    'avis.signeAide': 'Uma avaliação assinada inspira mais confiança.',
    'avis.anonyme': 'Anónimo',
    'avis.anonymeAide': 'A tua avaliação aparece sem nome.',
    'avis.plusTard': 'Mais tarde',
    'avis.envoyer': 'Enviar',

    'catalogue.rienNeCorrespond': 'Nada corresponde a « {mot} ».',
    'catalogue.videCategorie': 'Nada nesta categoria de momento.',
    'produit.epuiseMinuscule': 'esgotado',

    'etat.fermeDans': 'fecha em {duree}',
    'etat.ouvreDans': 'abre em {duree}',
    'etat.minutes': '{n} min',

    'onglet.catalogue': 'Catálogo',
    'onglet.categories': 'Categorias',
    'onglet.contact': 'Contacto',
    'onglet.profil': 'Perfil',

    'catalogue.rechercher': 'Procurar um produto',
    'catalogue.epuise': 'ESGOTADO',
    'catalogue.retour': 'Voltar ao catálogo',

    'produit.format': 'Escolhe o formato',
    'produit.commander': 'Encomendar',
    'produit.epuise': 'Esgotado',
    'produit.prevenir': '🔔 Avisa-me quando voltar',
    'produit.prevenu': '🔔 Serás avisado',
    'alerte.inscrit': 'Escrevemos-te assim que voltar.',
    'alerte.impossible': 'Inscrição impossível de momento.',
    'produit.memeCategorie': 'Mesma categoria',
    'produit.aimerAussi': 'Também vais gostar',

    'contact.titre': 'Uma pergunta?',
    'contact.texte':
      'Uma dúvida sobre um produto, uma encomenda que demora, um pedido especial: escreve-nos ' +
      'no Snapchat, respondemos lá.',

    'profil.titre': 'O meu perfil',
    'profil.commandes': 'Encomendas',
    'profil.favoris': 'Favoritos',
    'profil.produits': 'Produtos',
    'profil.alertes': 'Avisos',
    'profil.langue': 'Língua',
    'profil.langueAide': 'Os textos da loja. Os produtos mantêm a língua do vendedor.',
    'profil.alertesIntro':
      'O que a loja te pode enviar nesta conversa. Desligas e ligas quando quiseres.',
    'profil.stop':
      '⚠️ Enviaste <b>/stop</b> ao bot: não receberás nada enquanto não escreveres ' +
      '<b>/annonces</b> para reabrir a porta.',

    'etat.ouverte': 'Loja aberta',
    'etat.fermee': 'Loja fechada',
    'etat.dispo': 'Disponível agora',
    'etat.retourA': 'De volta às',
    'etat.fermePourLInstant': 'Fechado por agora',

    'msg.chargement': 'A carregar…',
    'msg.injoignable': 'Loja momentaneamente inacessível',
    'msg.injoignableTexte':
      'Não foi possível carregar o catálogo. Não é que a loja esteja vazia: o servidor não ' +
      'responde como deve.',
    'msg.reessayer': 'Tentar de novo',
    'msg.catalogueIndispo': 'Catálogo indisponível, tenta daqui a pouco.',
    'msg.pieceEnAttente': 'Poderás encomendar assim que o teu documento for validado.',
    'msg.calculEnAttente': 'Ainda não — responde à conta na conversa.',
    'msg.articleParti': 'Este artigo já não está no catálogo. Aqui fica o resto da loja.',
    'msg.verifIndispo': 'Verificação indisponível. Tenta daqui a pouco.',
    'msg.reglageRefuse': 'Definição não guardada, tenta de novo.',


    'rayon.unProduit': '1 produto',
    'rayon.produits': '{n} produtos',

    'contact.onPrend': 'Estamos a aceitar encomendas.',
    'contact.onRouvre': 'Reabrimos em breve.',
    'contact.retrait': 'Levantamento em mão',
    'contact.retraitDetail': 'Encontro combinado na conversa.',
    'contact.livraison': 'Entrega',
    'contact.livraisonDetail': 'Morada pedida no momento da encomenda.',
    'contact.especes': 'Pagamento em dinheiro',
    'contact.especesDetail': 'Na entrega, nada adiantado.',

    'favori.mettre': 'Adicionar aos favoritos',
    'favori.retirer': 'Remover dos favoritos',
    'favori.epuiseAlerte': 'Esgotado — ativa o aviso de regresso',
    'favoris.desactives': 'Os favoritos não estão ativos nesta loja.',
    'favoris.vide': 'Toca no ♥ num produto para o guardar aqui.',

    'commandes.desactivees': 'O histórico de encomendas não está ativo nesta loja.',
    'commandes.vide': 'Ainda não fizeste nenhuma encomenda.',
    'commandes.depuisTelegram': 'Abre a loja pelo Telegram para veres as tuas encomendas.',
    'commandes.profilIndispo': 'Perfil indisponível de momento.',
    'profil.client': 'Cliente {boutique}',

    'avis.compte': 'Avaliações ({n})',
    'avis.voirLesN': 'Ver as {n} avaliações',
    'avis.uneEtoile': '{n} estrela',
    'avis.desEtoiles': '{n} estrelas',
    'avis.toucheUneEtoile': 'Toca em pelo menos uma estrela.',
    'avis.merci': 'Obrigado pela tua avaliação!',
    'avis.envoi': 'A enviar…',
    'avis.refuse': 'Avaliação recusada.',
    'avis.tonAvisSur': 'A tua avaliação de {quoi}',
    'avis.reponseBoutique': 'Resposta da loja',

    'juke.ouvrir': 'Abrir o leitor de música',

    'media.video': '▶ Vídeo',

    'legal.mention':
      'Produtos reservados a maiores de idade. Verifica a legislação em vigor onde estás antes de ' +
      'encomendar: a disponibilidade destes produtos depende da tua jurisdição.',
    'titre.page': 'Loja',
    'etat.compteBloque': 'Esta conta não pode encomendar. Escreve-nos na conversa se for um erro.',
    'etat.fermeeMessage': 'A loja está fechada de momento.',
    'etat.ouvertCourt': 'Aberto',
    'etat.fermeCourt': 'Fechado',
    'verif.texteAucune':
      'Para encomendar aqui é preciso validar um documento de identidade. Envia uma foto na ' +
      'conversa do bot: o vendedor vê e responde-te.',
    'verif.texteEnCours':
      'O teu documento está em verificação. Receberás a resposta na conversa do bot.',
    'verif.texteRefusee':
      'A verificação foi recusada. Escreve-nos na conversa se achas que é um erro.',
    'verif.titreEnCours': 'Em verificação',
    'verif.titreRefusee': 'Verificação recusada',
    'captcha.rate': 'Falhaste. Tenta outra vez.',

    'produit.memeCategorieAvec': 'Mesma categoria · {cat}',

    'snap.titre': 'Para encomendar',
    'snap.texte': 'As encomendas fazem-se no Snapchat: envia-nos uma mensagem por lá. A loja serve para escolher.',
    'snap.compris': 'Percebi',
    'msg.article': 'Artigo',

    'retour.simple': 'Voltar',
    'retour.catalogue': 'Voltar ao catálogo',
    'retour.categories': 'Voltar às categorias',
    'retour.profil': 'Voltar ao perfil',

    'liste.etAutre': '{liste} e mais {n}',
    'liste.etAutres': '{liste} e mais {n}',

    'avis.ajouteUnMot': 'Acrescenta uma palavra',
    'avis.tuAsNote': 'Avaliaste {quoi}',
    'avis.dejaNote': 'Já avaliaste {quoi}. Acrescenta uma palavra, se quiseres.',
    'avis.commandeRef': 'Encomenda {ref} — {quoi}',
    'avis.avecPrenom': 'Como « {prenom} »',

    'aria.effacer': 'Limpar a pesquisa',
    'aria.trier': 'Ordenar os produtos',
    'aria.fermer': 'Fechar',
    'aria.fiche': 'Ficha do produto',
    'aria.navigation': 'Navegação',
    'aria.medias': 'Multimédia',
    'aria.mediaPrec': 'Multimédia anterior',
    'aria.mediaSuiv': 'Multimédia seguinte',
    'aria.signer': 'Assinar a tua avaliação',

    'juke.menu': 'Leitor de música',
    'juke.lecture': 'Reproduzir',
    'juke.pause': 'Pausa',
    'juke.precedent': 'Faixa anterior',
    'juke.suivant': 'Faixa seguinte',

    'avis.noteVie':
      'Em ambos os casos, nem o teu nome no Telegram, nem o teu número, nem a tua morada são ' +
      'publicados. O vendedor, esse, vê sempre que encomenda foi avaliada.',

    'alertes.nouveautes': 'Produtos novos',
    'alertes.nouveautesAide': 'Uma mensagem quando chega um artigo ao catálogo.',
    'alertes.promos': 'Promoções e códigos',
    'alertes.promosAide': 'Uma mensagem quando começa um desconto ou um código.',

    'ouverture.1': 'A abrir a loja…',
    'ouverture.2': 'A ligar a corrente…',
    'ouverture.3': 'A acender os néons…',
    'ouverture.4': 'A tirar a mercadoria…',
    'ouverture.5': 'Pronto.',
    'ouverture.chargement': 'A carregar…',
    'onglet.accueil': "Início",
    'onglet.boutique': "Loja",
    'onglet.favoris': "Favoritos",
    'onglet.panier': "Carrinho",
    'onglet.compte': "Conta",
    'vitrine.bienvenue': "Bem-vindo",
    'vitrine.tous': "Todos os produtos",
    'vitrine.articles': "{n} artigos",
    'vitrine.unArticle': "1 artigo",
    'vitrine.promos': "Promoções",
    'promo.voir': "Ver as ofertas",
    'promo.titreAuto': "PROMO FLASH — até -{n} %",
    'carte.des': "desde",
    'carte.ajouter': "Adicionar ao carrinho",
    'carte.sansAvis': "Ainda sem avaliações",
    'produit.ajouter': "Adicionar ao carrinho",
    'panier.ajoute': "Adicionado ao carrinho",
    'panier.plusDeStock': "Sem stock para este formato",
    'panier.titre': "O meu carrinho",
    'panier.vide': "O teu carrinho está vazio.",
    'panier.voirBoutique': "Ver a loja",
    'panier.total': "Total",
    'panier.economie': "Poupas {montant}",
    'panier.commander': "Encomendar",
    'panier.vider': "Esvaziar o carrinho",
    'panier.copier': "Copiar o resumo",
    'panier.copie': "Resumo copiado",
    'panier.copieImpossible': "Não foi possível copiar: seleciona o texto e copia-o",
    'panier.recapTitre': "A minha encomenda",
    'panier.recapAide': "Copia este resumo e envia-no-lo pelo Snapchat.",
    'panier.retirer': "Remover",
    'panier.moins': "Menos um",
    'panier.plus': "Mais um",
    'favoris.titre': "Os meus favoritos",
    'favoris.vide': "Ainda sem favoritos: toca no coração de um produto para o guardar aqui.",
    'son.basculer': "Música",
    'panier.ouvrir': "Abrir o carrinho",
    'profil.contact': "Uma pergunta? Contacto",
    'commande.mode': "Como recebes",
    'commande.retrait': "🏠 Levantamento",
    'commande.surPlace': "no local",
    'commande.livraison': "🛵 Entrega",
    'commande.offerte': "grátis",
    'commande.adresse': "Morada de entrega",
    'commande.rue': "Rua e número",
    'commande.complement': "Prédio, andar, código (opcional)",
    'commande.codePostal': "Código postal",
    'commande.ville': "Cidade",
    'commande.creneauRetrait': "Horário de levantamento",
    'commande.creneauLivraison': "Horário de entrega",
    'commande.choisisCreneau': "Escolhe um horário",
    'commande.aucunCreneau': "Nenhum horário disponível",
    'commande.complet': "esgotado",
    'commande.places': "{n} vagas",
    'commande.telephone': "Telefone (opcional)",
    'commande.telephoneLivraison': "Telefone (para te avisar à chegada)",
    'commande.telephoneAide': "Para te contactar",
    'commande.code': "Código promocional",
    'commande.codeAide': "Se tiveres um",
    'commande.appliquer': "Aplicar",
    'commande.codeApplique': "Código {code} aplicado: −{montant}",
    'commande.palierMieux': "O teu desconto automático ({label}) é melhor: mantemo-lo.",
    'commande.remiseAuto': "Desconto automático {label}: −{montant}",
    'commande.codeRefuse': "Código recusado.",
    'commande.ajouteDabord': "Adiciona primeiro um artigo.",
    'commande.note': "Uma nota para a encomenda? (opcional)",
    'commande.noteAide': "Ponto de levantamento, código da porta, pergunta…",
    'commande.sousTotal': "Subtotal",
    'commande.remise': "Desconto",
    'commande.fraisLivraison': "Entrega",
    'commande.minimum': "Encomenda mínima {montant}: faltam {reste}.",
    'commande.franco': "Entrega grátis a partir de {montant}: faltam {reste}.",
    'commande.pasLivre': "Ainda não entregamos em {code}. O levantamento continua possível.",
    'commande.zoneFrais': "{montant} de entrega",
    'commande.zoneOfferte': "entrega grátis",
    'commande.zoneMin': "mínimo {montant}",
    'commande.preparation': "A preparar…",
    'commande.fermee': "Loja fechada",
    'commande.impossible': "Encomenda impossível",
    'commande.ajuste': "Ajusta o teu carrinho",
    'commande.refusee': "Encomenda recusada.",
    'commande.manqueRue': "Indica a rua e o número.",
    'commande.manqueCP': "Indica o teu código postal.",
    'commande.manqueVille': "Indica a cidade.",
    'commande.stockManque': "{nom}: só restam {n}. Ajusta a quantidade.",
    'done.titre': "Encomenda registada",
    'done.texte': "Recebemos a tua encomenda e o vendedor foi avisado. A confirmação chega na conversa do bot.",
    'done.texteSans': "Recebemos a tua encomenda e o vendedor foi avisado. Ele responde-te em breve.",
    'done.mesCommandes': "As minhas encomendas",
    'done.continuer': "Continuar as compras",
    'done.especes': "💶 Pagamento em dinheiro, na entrega.",
    'done.retrait': "🏠 Levantamento no local",
    'done.livraison': "🛵 Entrega",
    'o68.badge': "Seleção por farms",
    'o68.devise': "A seleção · As farms · As referências",
    'o68.references': "Referências",
    'o68.farms': "Farms",
    'o68.original': "Original",
    'o68.explore': "Explora o catálogo",
    'o68.lesFarms': "As farms",
    'o68.tout': "Tudo",
    'o68.toutesLesFarms': "Todas as farms",
    'o68.nFarms': "{n} farms",
    'o68.aucuneFarm': "As farms chegam em breve.",
    'onglet.farms': "Farms",
    'onglet.infos': "Info",

    'secours.titre': 'Porta de emergência',
    'secours.texte':
      'Um segundo bot abre a mesma loja. Escreve-lhe uma vez: se esta conversa desaparecer, é aí ' +
      'que recebes o novo endereço.',
    'secours.ouvrir': 'Guardar a porta de emergência',
    'secours.fait': 'Porta de emergência guardada',
    'secours.faitAide': 'Podemos contactar-te aí. Nada mais a fazer.',

    'secours.porteTitre': 'Uma mensagem, e já estás dentro',
    'secours.porteTexte':
      'Esta loja tem um segundo bot, caso este desapareça. Envia-lhe /start e volta — a loja abre ' +
      'sozinha.',
    'secours.porteFine':
      'Pede-se uma só vez. Sem essa mensagem, o Telegram nunca nos deixará dar-te o novo endereço ' +
      'no dia em que esta conversa parar.',
    'secours.porteOuvrir': 'Abrir o bot de emergência',
    'secours.porteReessayer': 'Já lhe escrevi — tentar de novo',
    'msg.secoursEnAttente': 'Ainda não — envia /start ao bot de emergência.',
  },

  de: {
    'accueil.bienvenue': 'Willkommen',
    'accueil.texte':
      '{boutique} zeigt dir <strong>neue Sorten</strong> und neue Reihen, das ganze Jahr über ' +
      'erneuert. <strong>Garantierte Qualität</strong> bei jedem Produkt im Katalog.',
    'accueil.horaires': '7/7 · 13–24 Uhr',
    'accueil.service': 'Treffen & Lieferung',
    'accueil.botApp':
      'Alles läuft in der App: Katalog in Bildern, Produktseiten, und deine Bestellung schon ' +
      'fertig geschrieben.',
    'accueil.langue': 'Wähle deine Sprache',
    'accueil.entrer': 'Zum Shop',

    'porte.entree': 'Eingang',
    'porte.marches': 'Schritt {n} von {total}',
    'porte.titre': 'Eine Rechnung, und es ist offen',
    'porte.texte':
      'Geh zurück in den Bot-Chat: Dort bekommst du eine kleine Additionsaufgabe. Beantworte sie ' +
      'und komm zurück — der Shop öffnet von selbst.',
    'porte.fine':
      'Wird nur einmal gefragt, um Fake-Konten zu vermeiden. Weitere Angaben brauchst du nicht zu ' +
      'machen.',
    'porte.ouvrir': 'Chat öffnen',
    'porte.reessayer': 'Beantwortet — nochmal versuchen',

    'age.titre': 'Stopp!',
    'age.texte':
      'Dieser Shop ist nur für Volljährige. Bestätigst du, <strong>18&nbsp;Jahre oder ' +
      'älter</strong> zu sein&nbsp;?',
    'age.oui': 'Ja, ich bin 18',
    'age.non': 'Nein',

    'tuiles.entete': 'Prüfung',
    'tuiles.consigne': 'Setz das fehlende Stück ein',
    'tuiles.aide': 'Zieh es mit dem Finger — oder nimm die Pfeiltasten.',
    'tuiles.pieceAria': 'Das fehlende Stück',
    'tuiles.texte': 'Einen Moment, wir prüfen nur kurz, dass du kein Roboter bist.',
    'tuiles.valider': 'Bestätigen',

    'verif.entete': 'Kontrollierter Zugang',
    'verif.titre': 'Prüfung erforderlich',
    'verif.fine':
      'Der Shop speichert dein Dokument nicht: Es bleibt im Telegram-Chat, und du kannst es nach ' +
      'der Prüfung löschen.',
    'verif.ouvrir': 'Chat öffnen',
    'verif.attendre': 'Solange im Shop stöbern',

    'hero.horaires': 'Offen 7/7 · 13 – 24 Uhr',
    'hero.service': 'Treffen & Lieferung',

    'tri.defaut': 'Sortierung: Standard',
    'tri.nouveautes': 'Neuheiten zuerst',
    'tri.prixCroissant': 'Preis aufsteigend',
    'tri.prixDecroissant': 'Preis absteigend',
    'tri.alphabetique': 'Alphabetisch',

    'catalogue.videTotal': 'Der Katalog ist im Moment leer.',

    'avis.titre': 'Bewertungen',
    'avis.voirTous': 'Alle Bewertungen ansehen',
    'avis.commentCetait': 'Wie war es?',
    'avis.tonAvis': 'Deine Bewertung',
    'avis.unMot': 'Ein Wort, wenn du magst',
    'avis.facultatif': 'optional',
    'avis.signe': 'Mit meinem Vornamen',
    'avis.signeAide': 'Eine unterschriebene Bewertung wirkt glaubwürdiger.',
    'avis.anonyme': 'Anonym',
    'avis.anonymeAide': 'Deine Bewertung erscheint ohne Namen.',
    'avis.plusTard': 'Später',
    'avis.envoyer': 'Senden',

    'catalogue.rienNeCorrespond': 'Nichts passt zu « {mot} ».',
    'catalogue.videCategorie': 'In dieser Kategorie ist gerade nichts.',
    'produit.epuiseMinuscule': 'ausverkauft',

    'etat.fermeDans': 'schließt in {duree}',
    'etat.ouvreDans': 'öffnet in {duree}',
    'etat.minutes': '{n} Min',

    'onglet.catalogue': 'Katalog',
    'onglet.categories': 'Kategorien',
    'onglet.contact': 'Kontakt',
    'onglet.profil': 'Profil',

    'catalogue.rechercher': 'Produkt suchen',
    'catalogue.epuise': 'AUSVERKAUFT',
    'catalogue.retour': 'Zurück zum Katalog',

    'produit.format': 'Wähle dein Format',
    'produit.commander': 'Bestellen',
    'produit.epuise': 'Ausverkauft',
    'produit.prevenir': '🔔 Benachrichtige mich',
    'produit.prevenu': '🔔 Du wirst benachrichtigt',
    'alerte.inscrit': 'Wir schreiben dir, sobald es zurück ist.',
    'alerte.impossible': 'Eintragung gerade nicht möglich.',
    'produit.memeCategorie': 'Gleiche Kategorie',
    'produit.aimerAussi': 'Das gefällt dir auch',

    'contact.titre': 'Eine Frage?',
    'contact.texte':
      'Zweifel an einem Produkt, eine Bestellung, die dauert, ein besonderer Wunsch: Schreib uns ' +
      'auf Snapchat, dort antworten wir.',

    'profil.titre': 'Mein Profil',
    'profil.commandes': 'Bestellungen',
    'profil.favoris': 'Favoriten',
    'profil.produits': 'Produkte',
    'profil.alertes': 'Hinweise',
    'profil.langue': 'Sprache',
    'profil.langueAide': 'Die Texte des Shops. Die Produkte bleiben in der Sprache des Verkäufers.',
    'profil.alertesIntro':
      'Was der Shop dir in diesem Chat schicken darf. Du schaltest es aus und wieder ein, wann du ' +
      'willst.',
    'profil.stop':
      '⚠️ Du hast dem Bot <b>/stop</b> geschickt: Es erreicht dich nichts mehr, bis du ' +
      '<b>/annonces</b> schreibst, um die Tür wieder zu öffnen.',

    'etat.ouverte': 'Shop offen',
    'etat.fermee': 'Shop geschlossen',
    'etat.dispo': 'Jetzt verfügbar',
    'etat.retourA': 'Zurück um',
    'etat.fermePourLInstant': 'Gerade geschlossen',

    'msg.chargement': 'Lädt…',
    'msg.injoignable': 'Shop momentan nicht erreichbar',
    'msg.injoignableTexte':
      'Der Katalog konnte nicht geladen werden. Es ist nicht so, dass der Shop leer wäre: Der ' +
      'Server antwortet nicht richtig.',
    'msg.reessayer': 'Nochmal versuchen',
    'msg.catalogueIndispo': 'Katalog nicht verfügbar, versuch es gleich nochmal.',
    'msg.pieceEnAttente': 'Du kannst bestellen, sobald dein Ausweis geprüft ist.',
    'msg.calculEnAttente': 'Noch nicht — beantworte die Rechnung im Chat.',
    'msg.articleParti': 'Dieser Artikel ist nicht mehr im Katalog. Hier ist der Rest des Shops.',
    'msg.verifIndispo': 'Prüfung nicht verfügbar. Versuch es gleich nochmal.',
    'msg.reglageRefuse': 'Einstellung nicht gespeichert, versuch es nochmal.',


    'rayon.unProduit': '1 Produkt',
    'rayon.produits': '{n} Produkte',

    'contact.onPrend': 'Wir nehmen Bestellungen an.',
    'contact.onRouvre': 'Wir öffnen bald wieder.',
    'contact.retrait': 'Abholung vor Ort',
    'contact.retraitDetail': 'Treffpunkt wird im Chat vereinbart.',
    'contact.livraison': 'Lieferung',
    'contact.livraisonDetail': 'Adresse wird bei der Bestellung erfragt.',
    'contact.especes': 'Barzahlung',
    'contact.especesDetail': 'Bei der Übergabe, nichts im Voraus.',

    'favori.mettre': 'Zu Favoriten hinzufügen',
    'favori.retirer': 'Aus Favoriten entfernen',
    'favori.epuiseAlerte': 'Ausverkauft — Benachrichtigung aktivieren',
    'favoris.desactives': 'Favoriten sind in diesem Shop nicht aktiv.',
    'favoris.vide': 'Tippe das ♥ auf einem Produkt an, um es hier zu behalten.',

    'commandes.desactivees': 'Der Bestellverlauf ist in diesem Shop nicht aktiv.',
    'commandes.vide': 'Du hast noch nichts bestellt.',
    'commandes.depuisTelegram': 'Öffne den Shop über Telegram, um deine Bestellungen zu sehen.',
    'commandes.profilIndispo': 'Profil momentan nicht verfügbar.',
    'profil.client': 'Kunde von {boutique}',

    'avis.compte': 'Bewertungen ({n})',
    'avis.voirLesN': 'Alle {n} Bewertungen ansehen',
    'avis.uneEtoile': '{n} Stern',
    'avis.desEtoiles': '{n} Sterne',
    'avis.toucheUneEtoile': 'Tippe mindestens einen Stern an.',
    'avis.merci': 'Danke für deine Bewertung!',
    'avis.envoi': 'Wird gesendet…',
    'avis.refuse': 'Bewertung abgelehnt.',
    'avis.tonAvisSur': 'Deine Bewertung zu {quoi}',
    'avis.reponseBoutique': 'Antwort des Shops',

    'juke.ouvrir': 'Musikplayer öffnen',

    'media.video': '▶ Video',

    'legal.mention':
      'Produkte nur für Volljährige. Prüfe die bei dir geltenden Gesetze vor jeder Bestellung: Ob ' +
      'diese Produkte verfügbar sind, hängt von deiner Rechtsordnung ab.',
    'titre.page': 'Shop',
    'etat.compteBloque':
      'Dieses Konto kann nicht bestellen. Schreib uns im Chat, falls das ein Fehler ist.',
    'etat.fermeeMessage': 'Der Shop ist gerade geschlossen.',
    'etat.ouvertCourt': 'Offen',
    'etat.fermeCourt': 'Geschlossen',
    'verif.texteAucune':
      'Um hier zu bestellen, muss ein Ausweis geprüft werden. Schick ein Foto davon in den ' +
      'Bot-Chat: Der Verkäufer sieht es sich an und antwortet dir.',
    'verif.texteEnCours': 'Dein Ausweis wird geprüft. Die Antwort bekommst du im Bot-Chat.',
    'verif.texteRefusee':
      'Die Prüfung wurde abgelehnt. Schreib uns im Chat, wenn du meinst, das sei ein Fehler.',
    'verif.titreEnCours': 'Wird geprüft',
    'verif.titreRefusee': 'Prüfung abgelehnt',
    'captcha.rate': 'Daneben. Versuch es nochmal.',

    'produit.memeCategorieAvec': 'Gleiche Kategorie · {cat}',

    'snap.titre': 'Zum Bestellen',
    'snap.texte': 'Bestellt wird über Snapchat: schick uns dort eine Nachricht. Der Shop ist zum Aussuchen.',
    'snap.compris': 'Verstanden',
    'msg.article': 'Artikel',

    'retour.simple': 'Zurück',
    'retour.catalogue': 'Zurück zum Katalog',
    'retour.categories': 'Zurück zu den Kategorien',
    'retour.profil': 'Zurück zum Profil',

    'liste.etAutre': '{liste} und {n} weiteres',
    'liste.etAutres': '{liste} und {n} weitere',

    'avis.ajouteUnMot': 'Ein Wort hinzufügen',
    'avis.tuAsNote': 'Du hast {quoi} bewertet',
    'avis.dejaNote': 'Du hast {quoi} schon bewertet. Füge ein Wort hinzu, wenn du magst.',
    'avis.commandeRef': 'Bestellung {ref} — {quoi}',
    'avis.avecPrenom': 'Als « {prenom} »',

    'aria.effacer': 'Suche löschen',
    'aria.trier': 'Produkte sortieren',
    'aria.fermer': 'Schließen',
    'aria.fiche': 'Produktseite',
    'aria.navigation': 'Navigation',
    'aria.medias': 'Medien',
    'aria.mediaPrec': 'Vorheriges Medium',
    'aria.mediaSuiv': 'Nächstes Medium',
    'aria.signer': 'Deine Bewertung unterschreiben',

    'juke.menu': 'Musikplayer',
    'juke.lecture': 'Abspielen',
    'juke.pause': 'Pause',
    'juke.precedent': 'Vorheriger Titel',
    'juke.suivant': 'Nächster Titel',

    'avis.noteVie':
      'In beiden Fällen werden weder dein Telegram-Name noch deine Nummer noch deine Adresse ' +
      'veröffentlicht. Der Verkäufer sieht allerdings immer, welche Bestellung bewertet wurde.',

    'alertes.nouveautes': 'Neue Produkte',
    'alertes.nouveautesAide': 'Eine Nachricht, wenn ein Artikel in den Katalog kommt.',
    'alertes.promos': 'Angebote und Codes',
    'alertes.promosAide': 'Eine Nachricht, wenn ein Rabatt oder ein Code startet.',

    'ouverture.1': 'Der Shop öffnet…',
    'ouverture.2': 'Wir schalten den Strom ein…',
    'ouverture.3': 'Wir machen die Neonlichter an…',
    'ouverture.4': 'Wir holen die Ware raus…',
    'ouverture.5': 'Bereit.',
    'ouverture.chargement': 'Wird geladen…',
    'onglet.accueil': "Start",
    'onglet.boutique': "Shop",
    'onglet.favoris': "Favoriten",
    'onglet.panier': "Warenkorb",
    'onglet.compte': "Konto",
    'vitrine.bienvenue': "Willkommen",
    'vitrine.tous': "Alle Produkte",
    'vitrine.articles': "{n} Artikel",
    'vitrine.unArticle': "1 Artikel",
    'vitrine.promos': "Angebote",
    'promo.voir': "Zu den Angeboten",
    'promo.titreAuto': "FLASH-SALE — bis zu -{n} %",
    'carte.des': "ab",
    'carte.ajouter': "In den Warenkorb",
    'carte.sansAvis': "Noch keine Bewertungen",
    'produit.ajouter': "In den Warenkorb",
    'panier.ajoute': "Zum Warenkorb hinzugefügt",
    'panier.plusDeStock': "Für dieses Format nicht mehr vorrätig",
    'panier.titre': "Mein Warenkorb",
    'panier.vide': "Dein Warenkorb ist leer.",
    'panier.voirBoutique': "Zum Shop",
    'panier.total': "Summe",
    'panier.economie': "Du sparst {montant}",
    'panier.commander': "Bestellen",
    'panier.vider': "Warenkorb leeren",
    'panier.copier': "Übersicht kopieren",
    'panier.copie': "Übersicht kopiert",
    'panier.copieImpossible': "Kopieren fehlgeschlagen: markiere den Text und kopiere ihn",
    'panier.recapTitre': "Meine Bestellung",
    'panier.recapAide': "Kopiere diese Übersicht und schick sie uns auf Snapchat.",
    'panier.retirer': "Entfernen",
    'panier.moins': "Einer weniger",
    'panier.plus': "Einer mehr",
    'favoris.titre': "Meine Favoriten",
    'favoris.vide': "Noch keine Favoriten: tippe auf das Herz eines Produkts, um es hier zu behalten.",
    'son.basculer': "Musik",
    'panier.ouvrir': "Warenkorb öffnen",
    'profil.contact': "Eine Frage? Kontakt",
    'commande.mode': "Wie du es bekommst",
    'commande.retrait': "🏠 Abholung",
    'commande.surPlace': "vor Ort",
    'commande.livraison': "🛵 Lieferung",
    'commande.offerte': "gratis",
    'commande.adresse': "Lieferadresse",
    'commande.rue': "Straße und Hausnummer",
    'commande.complement': "Gebäude, Etage, Türcode (optional)",
    'commande.codePostal': "PLZ",
    'commande.ville': "Ort",
    'commande.creneauRetrait': "Abholzeit",
    'commande.creneauLivraison': "Lieferzeit",
    'commande.choisisCreneau': "Wähle eine Zeit",
    'commande.aucunCreneau': "Keine Zeit verfügbar",
    'commande.complet': "voll",
    'commande.places': "noch {n}",
    'commande.telephone': "Telefon (optional)",
    'commande.telephoneLivraison': "Telefon (damit wir dir Bescheid geben)",
    'commande.telephoneAide': "Damit wir dich erreichen",
    'commande.code': "Gutscheincode",
    'commande.codeAide': "Falls du einen hast",
    'commande.appliquer': "Einlösen",
    'commande.codeApplique': "Code {code} eingelöst: −{montant}",
    'commande.palierMieux': "Dein automatischer Rabatt ({label}) ist günstiger: wir behalten ihn.",
    'commande.remiseAuto': "Automatischer Rabatt {label}: −{montant}",
    'commande.codeRefuse': "Code abgelehnt.",
    'commande.ajouteDabord': "Füge zuerst einen Artikel hinzu.",
    'commande.note': "Eine Notiz zur Bestellung? (optional)",
    'commande.noteAide': "Abholort, Türcode, Frage…",
    'commande.sousTotal': "Zwischensumme",
    'commande.remise': "Rabatt",
    'commande.fraisLivraison': "Lieferung",
    'commande.minimum': "Mindestbestellwert {montant}: es fehlen {reste}.",
    'commande.franco': "Gratis Lieferung ab {montant}: es fehlen {reste}.",
    'commande.pasLivre': "Nach {code} liefern wir noch nicht. Abholung ist weiterhin möglich.",
    'commande.zoneFrais': "{montant} Lieferung",
    'commande.zoneOfferte': "gratis Lieferung",
    'commande.zoneMin': "mindestens {montant}",
    'commande.preparation': "Wird vorbereitet…",
    'commande.fermee': "Shop geschlossen",
    'commande.impossible': "Bestellung nicht möglich",
    'commande.ajuste': "Passe deinen Warenkorb an",
    'commande.refusee': "Bestellung abgelehnt.",
    'commande.manqueRue': "Gib Straße und Hausnummer an.",
    'commande.manqueCP': "Gib deine PLZ an.",
    'commande.manqueVille': "Gib den Ort an.",
    'commande.stockManque': "{nom}: nur noch {n} übrig. Passe die Menge an.",
    'done.titre': "Bestellung eingegangen",
    'done.texte': "Wir haben deine Bestellung, der Verkäufer ist informiert. Die Bestätigung kommt im Chat mit dem Bot.",
    'done.texteSans': "Wir haben deine Bestellung, der Verkäufer ist informiert. Er meldet sich bald.",
    'done.mesCommandes': "Meine Bestellungen",
    'done.continuer': "Weiter einkaufen",
    'done.especes': "💶 Barzahlung bei Übergabe.",
    'done.retrait': "🏠 Abholung vor Ort",
    'done.livraison': "🛵 Lieferung",
    'o68.badge': "Auswahl nach Farms",
    'o68.devise': "Die Auswahl · Die Farms · Die Referenzen",
    'o68.references': "Referenzen",
    'o68.farms': "Farms",
    'o68.original': "Original",
    'o68.explore': "Entdecke den Katalog",
    'o68.lesFarms': "Die Farms",
    'o68.tout': "Alle",
    'o68.toutesLesFarms': "Alle Farms",
    'o68.nFarms': "{n} Farms",
    'o68.aucuneFarm': "Die Farms kommen bald.",
    'onglet.farms': "Farms",
    'onglet.infos': "Infos",

    'secours.titre': 'Ersatzzugang',
    'secours.texte':
      'Ein zweiter Bot öffnet denselben Shop. Schreib ihm einmal: Sollte diese Unterhaltung ' +
      'verschwinden, bekommst du dort die neue Adresse.',
    'secours.ouvrir': 'Ersatzzugang sichern',
    'secours.fait': 'Ersatzzugang gesichert',
    'secours.faitAide': 'Du bist dort erreichbar. Sonst nichts zu tun.',

    'secours.porteTitre': 'Eine Nachricht, und du bist drin',
    'secours.porteTexte':
      'Dieser Shop hat einen zweiten Bot, falls dieser verschwindet. Schick ihm /start und komm ' +
      'zurück — der Shop öffnet sich von selbst.',
    'secours.porteFine':
      'Nur einmal gefragt. Ohne diese Nachricht lässt Telegram uns nie die neue Adresse schicken, ' +
      'wenn diese Unterhaltung endet.',
    'secours.porteOuvrir': 'Ersatz-Bot öffnen',
    'secours.porteReessayer': 'Geschrieben — erneut versuchen',
    'msg.secoursEnAttente': 'Noch nicht — schick /start an den Ersatz-Bot.',
  },

  ar: {
    'accueil.bienvenue': 'مرحباً',
    'accueil.texte':
      '{boutique} يعرّفك على <strong>أصناف جديدة</strong> وتشكيلات جديدة، تتجدّد طوال السنة. ' +
      '<strong>جودة مضمونة</strong> في كل منتج من الكتالوج.',
    'accueil.horaires': '7/7 · 13:00-00:00',
    'accueil.service': 'لقاء وتوصيل',
    'accueil.botApp': 'كل شيء يجري في التطبيق: كتالوج بالصور، بطاقات المنتجات، وطلبك مكتوب سلفاً.',
    'accueil.langue': 'اختر لغتك',
    'accueil.entrer': 'ادخل المتجر',

    'porte.entree': 'الدخول',
    'porte.marches': 'الخطوة {n} من {total}',
    'porte.titre': 'عملية حسابية واحدة، ويُفتح',
    'porte.texte':
      'عد إلى محادثة البوت: سيطرح عليك عملية جمع بسيطة. أجب عنها ثم عد إلى هنا — سيُفتح المتجر ' +
      'وحده.',
    'porte.fine':
      'يُطلب هذا مرة واحدة فقط، لتفادي الحسابات الوهمية. ولا يُطلب منك أي معلومات أخرى.',
    'porte.ouvrir': 'فتح المحادثة',
    'porte.reessayer': 'أجبت — أعد المحاولة',

    'age.titre': 'قف!',
    'age.texte':
      'هذا المتجر مخصّص للبالغين. هل تؤكّد أن عمرك <strong>18&nbsp;سنة أو أكثر</strong>&nbsp;؟',
    'age.oui': 'نعم، عمري 18 سنة',
    'age.non': 'لا',

    'tuiles.entete': 'تحقّق',
    'tuiles.consigne': 'أعد القطعة إلى مكانها',
    'tuiles.aide': 'اسحبها بإصبعك — أو استخدم أسهم لوحة المفاتيح.',
    'tuiles.pieceAria': 'القطعة الناقصة',
    'tuiles.texte': 'لحظة واحدة، للتأكّد أنك لست روبوتاً.',
    'tuiles.valider': 'تأكيد',

    'verif.entete': 'دخول مراقَب',
    'verif.titre': 'التحقّق مطلوب',
    'verif.fine':
      'المتجر لا يحفظ وثيقتك: تبقى في محادثة تيليغرام، ويمكنك حذفها بعد انتهاء التحقّق.',
    'verif.ouvrir': 'فتح المحادثة',
    'verif.attendre': 'تصفّح المتجر في الأثناء',

    'hero.horaires': 'مفتوح 7/7 · 13:00 – 00:00',
    'hero.service': 'لقاء وتوصيل',

    'tri.defaut': 'الترتيب: افتراضي',
    'tri.nouveautes': 'الجديد أولاً',
    'tri.prixCroissant': 'السعر تصاعدياً',
    'tri.prixDecroissant': 'السعر تنازلياً',
    'tri.alphabetique': 'ترتيب أبجدي',

    'catalogue.videTotal': 'الكتالوج فارغ في الوقت الحالي.',

    'avis.titre': 'التقييمات',
    'avis.voirTous': 'عرض كل التقييمات',
    'avis.commentCetait': 'كيف كانت التجربة؟',
    'avis.tonAvis': 'تقييمك',
    'avis.unMot': 'كلمة، إن أردت',
    'avis.facultatif': 'اختياري',
    'avis.signe': 'باسمي',
    'avis.signeAide': 'التقييم الموقَّع يبعث على الثقة أكثر.',
    'avis.anonyme': 'مجهول',
    'avis.anonymeAide': 'يظهر تقييمك بدون اسم.',
    'avis.plusTard': 'لاحقاً',
    'avis.envoyer': 'إرسال',

    'catalogue.rienNeCorrespond': 'لا نتائج لـ « {mot} ».',
    'catalogue.videCategorie': 'لا شيء في هذه الفئة حالياً.',
    'produit.epuiseMinuscule': 'نفد',

    'etat.fermeDans': 'يُغلق خلال {duree}',
    'etat.ouvreDans': 'يفتح خلال {duree}',
    'etat.minutes': '{n} د',

    'onglet.catalogue': 'الكتالوج',
    'onglet.categories': 'الفئات',
    'onglet.contact': 'تواصل',
    'onglet.profil': 'حسابي',

    'catalogue.rechercher': 'ابحث عن منتج',
    'catalogue.epuise': 'نفد',
    'catalogue.retour': 'العودة إلى الكتالوج',

    'produit.format': 'اختر الحجم',
    'produit.commander': 'اطلب',
    'produit.epuise': 'نفد',
    'produit.prevenir': '🔔 أعلِمني عند التوفّر',
    'produit.prevenu': '🔔 سنُعلِمك',
    'alerte.inscrit': 'سنكتب لك فور عودته.',
    'alerte.impossible': 'التسجيل غير ممكن حالياً.',
    'produit.memeCategorie': 'الفئة نفسها',
    'produit.aimerAussi': 'سيعجبك أيضاً',

    'contact.titre': 'عندك سؤال؟',
    'contact.texte': 'شكّ في منتج، طلب تأخّر، طلب خاص: اكتب لنا على سناب شات، نردّ عليك هناك.',

    'profil.titre': 'حسابي',
    'profil.commandes': 'الطلبات',
    'profil.favoris': 'المفضّلة',
    'profil.produits': 'المنتجات',
    'profil.alertes': 'التنبيهات',
    'profil.langue': 'اللغة',
    'profil.langueAide': 'نصوص المتجر. أمّا المنتجات فتبقى بلغة البائع.',
    'profil.alertesIntro': 'ما يمكن للمتجر أن يرسله إليك في هذه المحادثة. توقفه وتعيده متى شئت.',
    'profil.stop':
      '⚠️ أرسلت <b>/stop</b> إلى البوت: لن يصلك شيء حتى تكتب <b>/annonces</b> لإعادة فتح الباب.',

    'etat.ouverte': 'المتجر مفتوح',
    'etat.fermee': 'المتجر مغلق',
    'etat.dispo': 'متاح الآن',
    'etat.retourA': 'نعود على الساعة',
    'etat.fermePourLInstant': 'مغلق حالياً',

    'msg.chargement': 'جارٍ التحميل…',
    'msg.injoignable': 'المتجر غير متاح مؤقتاً',
    'msg.injoignableTexte':
      'تعذّر تحميل الكتالوج. ليس لأن المتجر فارغ: الخادم لا يستجيب كما ينبغي.',
    'msg.reessayer': 'أعد المحاولة',
    'msg.catalogueIndispo': 'الكتالوج غير متاح، أعد المحاولة بعد لحظات.',
    'msg.pieceEnAttente': 'يمكنك الطلب بمجرّد قبول وثيقتك.',
    'msg.calculEnAttente': 'ليس بعد — أجب عن العملية الحسابية في المحادثة.',
    'msg.articleParti': 'لم يعد هذا المنتج في الكتالوج. إليك بقية المتجر.',
    'msg.verifIndispo': 'التحقّق غير متاح. أعد المحاولة بعد لحظات.',
    'msg.reglageRefuse': 'لم يُحفظ الإعداد، أعد المحاولة.',


    'rayon.unProduit': 'منتج واحد',
    'rayon.produits': '{n} منتجات',

    'contact.onPrend': 'نستقبل الطلبات.',
    'contact.onRouvre': 'سنفتح قريباً.',
    'contact.retrait': 'الاستلام باليد',
    'contact.retraitDetail': 'يُتّفق على الموعد في المحادثة.',
    'contact.livraison': 'التوصيل',
    'contact.livraisonDetail': 'يُطلب العنوان عند الطلب.',
    'contact.especes': 'الدفع نقداً',
    'contact.especesDetail': 'عند التسليم، لا شيء مقدّماً.',

    'favori.mettre': 'إضافة إلى المفضّلة',
    'favori.retirer': 'إزالة من المفضّلة',
    'favori.epuiseAlerte': 'نفد — فعّل تنبيه العودة',
    'favoris.desactives': 'المفضّلة غير مفعّلة في هذا المتجر.',
    'favoris.vide': 'اضغط على ♥ في أي منتج لتحتفظ به هنا.',

    'commandes.desactivees': 'سجلّ الطلبات غير مفعّل في هذا المتجر.',
    'commandes.vide': 'لم تقم بأي طلب بعد.',
    'commandes.depuisTelegram': 'افتح المتجر من تيليغرام لتجد طلباتك.',
    'commandes.profilIndispo': 'الحساب غير متاح حالياً.',
    'profil.client': 'زبون {boutique}',

    'avis.compte': 'التقييمات ({n})',
    'avis.voirLesN': 'عرض التقييمات {n}',
    'avis.uneEtoile': 'نجمة {n}',
    'avis.desEtoiles': '{n} نجوم',
    'avis.toucheUneEtoile': 'اضغط على نجمة واحدة على الأقل.',
    'avis.merci': 'شكراً على تقييمك!',
    'avis.envoi': 'جارٍ الإرسال…',
    'avis.refuse': 'رُفض التقييم.',
    'avis.tonAvisSur': 'تقييمك لـ {quoi}',
    'avis.reponseBoutique': 'ردّ المتجر',

    'juke.ouvrir': 'فتح مشغّل الموسيقى',

    'media.video': '▶ فيديو',

    'legal.mention':
      'منتجات مخصّصة للبالغين. تحقّق من القانون المعمول به عندك قبل أي طلب: توفّر هذه المنتجات ' +
      'يتوقّف على ولايتك القضائية.',
    'titre.page': 'المتجر',
    'etat.compteBloque': 'لا يمكن لهذا الحساب أن يطلب. اكتب لنا في المحادثة إن كان ذلك خطأً.',
    'etat.fermeeMessage': 'المتجر مغلق في الوقت الحالي.',
    'etat.ouvertCourt': 'مفتوح',
    'etat.fermeCourt': 'مغلق',
    'verif.texteAucune':
      'للطلب من هنا، يجب قبول وثيقة هوية. أرسل صورة منها في محادثة البوت: يطّلع عليها البائع ' +
      'ويردّ عليك.',
    'verif.texteEnCours': 'وثيقتك قيد التحقّق. ستصلك الإجابة في محادثة البوت.',
    'verif.texteRefusee': 'رُفض التحقّق. اكتب لنا في المحادثة إن كنت ترى أن ذلك خطأ.',
    'verif.titreEnCours': 'قيد التحقّق',
    'verif.titreRefusee': 'رُفض التحقّق',
    'captcha.rate': 'خطأ. حاول مرة أخرى.',

    'produit.memeCategorieAvec': 'الفئة نفسها · {cat}',

    'snap.titre': 'للطلب',
    'snap.texte': 'الطلبات تُؤخذ على سناب شات: أرسل لنا رسالة هناك. المتجر للاختيار.',
    'snap.compris': 'فهمت',
    'msg.article': 'منتج',

    'retour.simple': 'رجوع',
    'retour.catalogue': 'العودة إلى الكتالوج',
    'retour.categories': 'العودة إلى الفئات',
    'retour.profil': 'العودة إلى الحساب',

    'liste.etAutre': '{liste} و{n} آخر',
    'liste.etAutres': '{liste} و{n} أخرى',

    'avis.ajouteUnMot': 'أضف كلمة',
    'avis.tuAsNote': 'قيّمت {quoi}',
    'avis.dejaNote': 'سبق أن قيّمت {quoi}. أضف كلمة، إن أردت.',
    'avis.commandeRef': 'الطلب {ref} — {quoi}',
    'avis.avecPrenom': 'باسم « {prenom} »',

    'aria.effacer': 'مسح البحث',
    'aria.trier': 'ترتيب المنتجات',
    'aria.fermer': 'إغلاق',
    'aria.fiche': 'صفحة المنتج',
    'aria.navigation': 'التنقّل',
    'aria.medias': 'الوسائط',
    'aria.mediaPrec': 'الوسيط السابق',
    'aria.mediaSuiv': 'الوسيط التالي',
    'aria.signer': 'وقّع تقييمك',

    'juke.menu': 'مشغّل الموسيقى',
    'juke.lecture': 'تشغيل',
    'juke.pause': 'إيقاف مؤقت',
    'juke.precedent': 'المقطع السابق',
    'juke.suivant': 'المقطع التالي',

    'avis.noteVie':
      'في الحالتين، لا يُنشر اسمك على تيليغرام ولا رقمك ولا عنوانك. أمّا البائع فيرى دائماً أي ' +
      'طلب جرى تقييمه.',

    'alertes.nouveautes': 'منتجات جديدة',
    'alertes.nouveautesAide': 'رسالة عند وصول منتج إلى الكتالوج.',
    'alertes.promos': 'العروض والرموز',
    'alertes.promosAide': 'رسالة عند بدء تخفيض أو رمز ترويجي.',

    'ouverture.1': 'جارٍ فتح المتجر…',
    'ouverture.2': 'نوصّل التيار…',
    'ouverture.3': 'نُشعل النيون…',
    'ouverture.4': 'نُخرج البضاعة…',
    'ouverture.5': 'جاهز.',
    'ouverture.chargement': 'جارٍ التحميل…',
    'onglet.accueil': "الرئيسية",
    'onglet.boutique': "المتجر",
    'onglet.favoris': "المفضلة",
    'onglet.panier': "السلة",
    'onglet.compte': "الحساب",
    'vitrine.bienvenue': "أهلاً بك",
    'vitrine.tous': "كل المنتجات",
    'vitrine.articles': "{n} منتجات",
    'vitrine.unArticle': "منتج واحد",
    'vitrine.promos': "العروض",
    'promo.voir': "شاهد العروض",
    'promo.titreAuto': "عرض سريع — حتى ‎-{n}%",
    'carte.des': "من",
    'carte.ajouter': "أضف إلى السلة",
    'carte.sansAvis': "لا تقييمات بعد",
    'produit.ajouter': "أضف إلى السلة",
    'panier.ajoute': "أُضيف إلى السلة",
    'panier.plusDeStock': "لم يعد هذا الحجم متوفراً",
    'panier.titre': "سلتي",
    'panier.vide': "سلتك فارغة.",
    'panier.voirBoutique': "تصفح المتجر",
    'panier.total': "المجموع",
    'panier.economie': "وفّرت {montant}",
    'panier.commander': "اطلب",
    'panier.vider': "إفراغ السلة",
    'panier.copier': "انسخ الملخص",
    'panier.copie': "تم نسخ الملخص",
    'panier.copieImpossible': "تعذّر النسخ: حدّد النص وانسخه",
    'panier.recapTitre': "طلبي",
    'panier.recapAide': "انسخ هذا الملخص وأرسله لنا على سناب شات.",
    'panier.retirer': "إزالة",
    'panier.moins': "واحد أقل",
    'panier.plus': "واحد أكثر",
    'favoris.titre': "مفضلتي",
    'favoris.vide': "لا مفضلات بعد: اضغط على قلب المنتج لتحتفظ به هنا.",
    'son.basculer': "الموسيقى",
    'panier.ouvrir': "افتح السلة",
    'profil.contact': "سؤال؟ تواصل معنا",
    'commande.mode': "طريقة الاستلام",
    'commande.retrait': "🏠 استلام",
    'commande.surPlace': "في المكان",
    'commande.livraison': "🛵 توصيل",
    'commande.offerte': "مجاناً",
    'commande.adresse': "عنوان التوصيل",
    'commande.rue': "الشارع والرقم",
    'commande.complement': "المبنى، الطابق، رمز الباب (اختياري)",
    'commande.codePostal': "الرمز البريدي",
    'commande.ville': "المدينة",
    'commande.creneauRetrait': "موعد الاستلام",
    'commande.creneauLivraison': "موعد التوصيل",
    'commande.choisisCreneau': "اختر موعداً",
    'commande.aucunCreneau': "لا مواعيد متاحة",
    'commande.complet': "ممتلئ",
    'commande.places': "{n} أماكن",
    'commande.telephone': "الهاتف (اختياري)",
    'commande.telephoneLivraison': "الهاتف (لنخبرك عند الوصول)",
    'commande.telephoneAide': "للتواصل معك",
    'commande.code': "رمز ترويجي",
    'commande.codeAide': "إن كان لديك واحد",
    'commande.appliquer': "تطبيق",
    'commande.codeApplique': "تم تطبيق الرمز {code}: ‎−{montant}",
    'commande.palierMieux': "خصمك التلقائي ({label}) أفضل: سنحتفظ به.",
    'commande.remiseAuto': "خصم تلقائي {label}: ‎−{montant}",
    'commande.codeRefuse': "الرمز مرفوض.",
    'commande.ajouteDabord': "أضف منتجاً أولاً.",
    'commande.note': "ملاحظة للطلب؟ (اختياري)",
    'commande.noteAide': "نقطة الاستلام، رمز الباب، سؤال…",
    'commande.sousTotal': "المجموع الفرعي",
    'commande.remise': "الخصم",
    'commande.fraisLivraison': "التوصيل",
    'commande.minimum': "الحد الأدنى للطلب {montant}: ينقصك {reste}.",
    'commande.franco': "توصيل مجاني ابتداءً من {montant}: ينقصك {reste}.",
    'commande.pasLivre': "لا نوصل إلى {code} بعد. الاستلام ما زال ممكناً.",
    'commande.zoneFrais': "{montant} للتوصيل",
    'commande.zoneOfferte': "توصيل مجاني",
    'commande.zoneMin': "الحد الأدنى {montant}",
    'commande.preparation': "جارٍ التحضير…",
    'commande.fermee': "المتجر مغلق",
    'commande.impossible': "الطلب غير ممكن",
    'commande.ajuste': "عدّل سلتك",
    'commande.refusee': "رُفض الطلب.",
    'commande.manqueRue': "أدخل الشارع والرقم.",
    'commande.manqueCP': "أدخل رمزك البريدي.",
    'commande.manqueVille': "أدخل المدينة.",
    'commande.stockManque': "{nom}: بقي {n} فقط. عدّل الكمية.",
    'done.titre': "تم تسجيل الطلب",
    'done.texte': "وصلنا طلبك وتم إبلاغ البائع. يصلك التأكيد في محادثة البوت.",
    'done.texteSans': "وصلنا طلبك وتم إبلاغ البائع. سيعود إليك قريباً.",
    'done.mesCommandes': "طلباتي",
    'done.continuer': "متابعة التسوق",
    'done.especes': "💶 الدفع نقداً عند الاستلام.",
    'done.retrait': "🏠 استلام في المكان",
    'done.livraison': "🛵 توصيل",
    'o68.badge': "اختيار حسب المزارع",
    'o68.devise': "التشكيلة · المزارع · المراجع",
    'o68.references': "مراجع",
    'o68.farms': "مزارع",
    'o68.original': "أصلي",
    'o68.explore': "تصفح الكتالوج",
    'o68.lesFarms': "المزارع",
    'o68.tout': "الكل",
    'o68.toutesLesFarms': "كل المزارع",
    'o68.nFarms': "{n} مزارع",
    'o68.aucuneFarm': "المزارع قادمة قريباً.",
    'onglet.farms': "المزارع",
    'onglet.infos': "معلومات",

    'secours.titre': 'باب الطوارئ',
    'secours.texte':
      'بوت ثانٍ يفتح المتجر نفسه. راسله مرّة واحدة: إن اختفت هذه المحادثة، فمن هناك يصلك العنوان ' +
      'الجديد.',
    'secours.ouvrir': 'احفظ باب الطوارئ',
    'secours.fait': 'تم حفظ باب الطوارئ',
    'secours.faitAide': 'يمكننا الوصول إليك هناك. لا شيء آخر.',

    'secours.porteTitre': 'رسالة واحدة، ويُفتح المتجر',
    'secours.porteTexte':
      'لهذا المتجر بوت ثانٍ، تحسّباً لاختفاء هذا. أرسل له /start ثم عُد — يفتح المتجر من تلقاء ' +
      'نفسه.',
    'secours.porteFine':
      'يُطلب مرّة واحدة فقط. من دون هذه الرسالة لن يسمح لنا تيليجرام أبداً بإرسال العنوان الجديد ' +
      'إليك يوم تتوقّف هذه المحادثة.',
    'secours.porteOuvrir': 'افتح بوت الطوارئ',
    'secours.porteReessayer': 'راسلته — أعد المحاولة',
    'msg.secoursEnAttente': 'ليس بعد — أرسل /start إلى بوت الطوارئ.',
  },
};

/** La langue par défaut, et le repli de toutes les autres. */
export const LANGUE_PAR_DEFAUT = 'fr';

/**
 * La langue que parle le téléphone, si on la propose.
 *
 * Telegram donne la langue du client dans `initDataUnsafe.user.language_code`,
 * le navigateur dans `navigator.language` : on prend la première des deux qui
 * répond, et on ne garde que les deux premières lettres — « en-GB » et
 * « en-US » sont la même entrée dans ce fichier.
 *
 * Ce n'est qu'une proposition : elle préselectionne le bouton de l'écran
 * d'accueil, elle ne décide pas à la place du client.
 */
export function langueProposee(codeTelegram) {
  const brut = codeTelegram || (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  const deux = String(brut).slice(0, 2).toLowerCase();
  return LANGUES.some((l) => l.code === deux) ? deux : LANGUE_PAR_DEFAUT;
}
