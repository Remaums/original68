import 'dotenv/config';

const required = ['BOT_TOKEN'];

/** Vrai si l'adresse n'est qu'un texte de remplissage recopié du modèle. */
export function estUneAdresseDExemple(url) {
  return /@(host|adresse|hote)[/:]/i.test(url) || /\/\/(utilisateur|user):(motdepasse|password)@/i.test(url);
}

function exempleOuVide(url) {
  const propre = String(url ?? '').trim();
  if (!propre) return '';
  if (estUneAdresseDExemple(propre)) {
    console.warn(
      "\n  ⚠ DATABASE_URL est restée à sa valeur d'exemple : elle est ignorée.\n" +
        '    La boutique garde ses données dans server/data/, ce qui est le bon\n' +
        "    réglage sur un VPS. Efface la ligne de .env pour faire taire cet avertissement,\n" +
        '    ou renseigne une vraie adresse Postgres pour un déploiement serverless.\n'
    );
    return '';
  }
  return propre;
}

/**
 * Les identifiants Telegram autorisés à ouvrir l'espace admin.
 *
 * Les deux variables sont réunies, pas mises en concurrence. `??` ne bascule
 * que sur null ou undefined : un `ADMIN_IDS=` vide — le geste naturel quand on
 * efface l'exemple — vaut la chaîne vide, qui n'est pas nulle. Le repli vers
 * ADMIN_CHAT_ID que promettait .env.example ne se produisait donc jamais, et la
 * boutique se retrouvait sans aucun administrateur. Personne ne renseigne son
 * ADMIN_CHAT_ID sans vouloir aussi ouvrir son espace admin.
 */
const adminIds = [
  ...new Set(
    [process.env.ADMIN_IDS, process.env.ADMIN_CHAT_ID]
      .flatMap((v) => String(v ?? '').split(','))
      .map((v) => v.trim())
      .filter(Boolean)
  ),
];

export const config = {
  botToken: process.env.BOT_TOKEN ?? '',
  webappUrl: (process.env.WEBAPP_URL ?? '').replace(/\/$/, ''),
  // Où le bot dépose les commandes, les alertes de stock et les messages des
  // clients.
  //
  // Le repli sur le premier administrateur n'est pas un confort : sans lui, un
  // `.env` qui déclare ADMIN_IDS et oublie ADMIN_CHAT_ID laissait le vendeur
  // sans aucune notification de commande, silencieusement — et depuis que la
  // Mini App n'ouvre plus la conversation du vendeur avec le récapitulatif, il
  // n'y avait plus rien du tout pour rattraper l'oubli.
  adminChatId: process.env.ADMIN_CHAT_ID || adminIds[0] || '',
  sellerUsername: (process.env.SELLER_USERNAME ?? '').replace(/^@/, ''),
  // Nom du bot, pour fabriquer les liens t.me qui ouvrent la Mini App. Il se
  // demande à Telegram si on ne le renseigne pas — mais le renseigner évite
  // un aller-retour réseau au premier lien généré.
  botUsername: (process.env.BOT_USERNAME ?? '').replace(/^@/, ''),
  // Le bot de secours : un second jeton, un second @nom, la même boutique.
  //
  // Un bot de vente se fait fermer. Quand c'est arrivé, la boutique elle-même
  // tourne toujours — c'est ce serveur qui la sert — mais la porte a disparu,
  // et Telegram interdit formellement à un bot d'écrire le premier à
  // quelqu'un qui ne l'a jamais démarré. Le secours ne sert donc à rien s'il
  // n'est connu qu'au moment de la panne : il tourne en même temps que le
  // premier, et les clients l'enregistrent avant d'en avoir besoin.
  //
  // Absent, tout ce qui suit s'éteint proprement : pas de second bot, pas de
  // carte dans la boutique, pas de veille. Rien ne casse.
  botTokenSecours: process.env.BOT_TOKEN_SECOURS ?? '',
  botUsernameSecours: (process.env.BOT_USERNAME_SECOURS ?? '').replace(/^@/, ''),
  adminIds,
  port: Number(process.env.PORT ?? 3000),
  // Derrière un reverse proxy (Nginx, Caddy), on n'écoute que en local :
  // HOST=127.0.0.1 ferme la porte à un accès direct au port.
  host: process.env.HOST ?? '0.0.0.0',
  // Postgres : présent = mise en ligne serverless, absent = fichiers JSON.
  //
  // Une adresse laissée à sa valeur d'exemple est traitée comme absente. Le
  // cas s'est produit : `.env` copié depuis le modèle, `DATABASE_URL` non
  // effacée, et toute la boutique bascule sur un Postgres dont l'hôte
  // s'appelle littéralement « host ». Plus rien ne s'affiche, et le journal
  // ne parle que de résolution DNS. Basculer de magasin est trop lourd de
  // conséquences pour se déclencher sur un texte que personne n'a écrit.
  databaseUrl: exempleOuVide(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ''),
  // Jeton partagé avec Telegram : il signe chaque appel du webhook.
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
  currency: process.env.CURRENCY ?? 'EUR',
  shopName: process.env.SHOP_NAME ?? 'Original68',
  // Le préfixe des références de commande. Trois à cinq lettres, en
  // majuscules : c'est ce qu'on lit dans une conversation pour savoir de
  // quelle boutique vient la commande dont on parle.
  orderPrefix: (process.env.ORDER_PREFIX ?? 'O68').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'O68',
  // Racine de l'API Telegram. On ne la change que pour tester en local ou
  // pour viser un serveur Bot API auto-hébergé.
  telegramApiRoot: (process.env.TELEGRAM_API_ROOT ?? 'https://api.telegram.org').replace(/\/$/, ''),
  // Copie locale des médias relayés depuis Telegram.
  //
  // Sans elle, chaque première vue d'une photo ou d'une vidéo fait le trajet
  // VPS → Telegram → VPS → client, et une vidéo de quinze mégaoctets se fait
  // attendre. Avec elle, seul le premier visiteur le paie.
  //
  // `MEDIA_CACHE_MB=0` l'éteint. Elle s'éteint aussi d'elle-même là où le
  // disque est en lecture seule (serverless), sans rien casser : la boutique
  // relaie alors comme avant.
  mediaCache: {
    dir: process.env.MEDIA_CACHE_DIR || '',
    maxBytes: Math.max(0, Number(process.env.MEDIA_CACHE_MB ?? 500)) * 1024 * 1024,
  },
};

/** Ce que la Mini App a le droit de connaître (jamais le token, jamais l'admin chat). */
// Ce que /api/catalog publie, et cette route se lit SANS aucune signature.
// Le compte du vendeur n'en fait pas partie : la boutique ne l'affiche plus
// nulle part, et rien ne justifie de le donner à qui passe.
export const publicConfig = {
  shopName: config.shopName,
  currency: config.currency,
};

/**
 * Vérifie la configuration.
 *
 * `exit: true` pour un démarrage en ligne de commande (message lisible puis
 * arrêt) ; sinon on lève, car en serverless un `process.exit` ne laisse
 * qu'un code d'erreur nu dans les journaux.
 */
export function assertConfigured({ exit = false } = {}) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const message =
      `Configuration incomplète : ${missing.join(', ')} manquant(s). ` +
      'Copie .env.example vers .env (ou renseigne les variables chez ton hébergeur).';
    if (exit) {
      console.error(`\n  ${message}\n`);
      process.exit(1);
    }
    throw new Error(message);
  }
  if (!config.adminIds.length) {
    console.warn(
      "  ADMIN_IDS non défini : personne ne pourra ouvrir l'espace admin."
    );
  }
  // Le cas où l'on croit avoir rempli : la valeur du modèle est toujours là.
  // Elle n'est celle de personne, donc l'espace admin reste fermé, la porte
  // du bot ne s'ouvre pour personne, et rien ne le dit — on cherche alors du
  // côté du bot ou du tunnel un problème qui tient à cette ligne.
  // Uniquement ce que .env.example contient vraiment : signaler une valeur
  // qui n'y est pas reviendrait à accuser un identifiant légitime.
  const DU_MODELE = ['123456789'];
  const restes = config.adminIds.filter((id) => DU_MODELE.includes(id));
  if (restes.length) {
    console.warn(
      `  ⚠ ADMIN_IDS contient encore ${restes.join(', ')}, la valeur du modèle.\n` +
        "    Ce n'est l'identifiant de personne : l'espace admin restera fermé,\n" +
        "    et l'épreuve d'entrée du bot ne te laissera pas passer.\n" +
        '    Le tien : envoie /start au bot, il te l\'affiche.'
    );
  }
  if (!config.sellerUsername) {
    // « Ou » et non « donc » : depuis que le panneau sait le régler, un
    // SELLER_USERNAME absent n'est plus une panne, seulement un réglage qui
    // vit ailleurs. Crier à l'erreur enverrait chercher dans le mauvais
    // fichier quelqu'un qui a déjà tout réglé.
    console.warn(
      '  SELLER_USERNAME non défini : règle le compte vendeur dans le panneau\n' +
        '    (Réglages → Où mènent les commandes), ou pose-le ici.'
    );
  }
}
