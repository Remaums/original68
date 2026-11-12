import crypto from 'node:crypto';
import { config } from './config.js';
import { creerCadence } from './cadence.js';

/**
 * Épreuve d'entrée de la boutique : la pièce qui manque à la photo.
 *
 * Le client voit une image du film d'ouverture — celui qu'il vient de
 * regarder — avec un carré découpé, et fait glisser la pièce jusqu'au trou.
 * Elle remplace la grille de tuiles à toucher, et le calcul que le bot posait
 * dans la conversation : un seul geste, au lieu de deux épreuves.
 *
 * ── Ce que ça vaut, et ce que ça ne vaut pas ────────────────
 *
 * La vraie barrière contre les robots reste la signature Telegram vérifiée à
 * chaque appel : sans compte Telegram, aucune commande. L'épreuve ajoute une
 * friction et un geste conscient à l'entrée.
 *
 * Et il faut le dire franchement : **la position du trou voyage jusqu'au
 * client**, parce qu'il faut bien la lui montrer pour qu'il puisse viser. Un
 * automate qui lit la réponse dans le message du serveur la trouve donc sans
 * effort. C'est vrai de TOUTES les épreuves de ce genre — celles du commerce
 * n'examinent pas la réponse mais le GESTE, et c'est ce qu'on fait ici aussi.
 * Ce qui reste : un script doit maintenant fabriquer un mouvement plausible,
 * et non poster un nombre. Avec la limite d'essais et la signature Telegram,
 * c'est la friction qu'on cherchait, pas un coffre-fort — et le prétendre
 * serait plus dangereux que l'épreuve elle-même.
 *
 * ── Rien n'est stocké ───────────────────────────────────────
 *
 * La position du trou se DÉDUIT de l'aléa de l'épreuve et d'un secret du
 * serveur. Le serveur la recalcule au moment de juger : le client ne peut
 * donc pas annoncer une autre cible que la sienne, et la boutique peut
 * redémarrer ou se dupliquer au milieu d'une épreuve sans rien perdre.
 */

/** Les images du puzzle : des cadrages de l'affiche et de la bannière de la maison. */
const IMAGES = 8;
export const LARGEUR = 300;
export const HAUTEUR = 200;
/** Le côté de la pièce. Assez grande pour se voir, assez petite pour viser. */
export const PIECE = 56;

/**
 * De combien on peut manquer le trou.
 *
 * Douze pixels sur trois cents : un doigt sur un téléphone ne fait pas mieux,
 * et un automate qui tire au hasard n'a qu'une chance sur dix de tomber
 * dedans — la limite d'essais fait le reste.
 */
export const TOLERANCE = 12;

/** Le trou ne touche jamais les bords : une pièce à moitié sortie ne se lit pas. */
const X_MIN = PIECE + 24;
const X_MAX = LARGEUR - PIECE - 8;
const Y_MIN = 8;
const Y_MAX = HAUTEUR - PIECE - 8;

const CHALLENGE_TTL = 5 * 60 * 1000;   // le temps de comprendre et de viser
const PASS_TTL = 12 * 60 * 60 * 1000;  // ne pas réinterroger le client toute la journée

/**
 * Le nombre d'essais tolérés.
 *
 * Trois cents pixels, douze de tolérance : vingt-cinq positions possibles.
 * Douze essais laissent très largement passer le client qui vise mal sur un
 * petit écran, et laissent l'automate qui tire au hasard devant une attente
 * qu'il ne peut pas raccourcir.
 */
const ESSAIS_MAX = 12;
const PAUSE_MS = 10 * 60 * 1000;

const cadenceDesEssais = creerCadence({ max: ESSAIS_MAX, fenetreMs: PAUSE_MS, nom: 'captcha' });

const sign = (payload) =>
  crypto.createHmac('sha256', `captcha:${config.botToken}`).update(payload).digest('hex');

const equal = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/**
 * Où se trouve le trou, déduit de l'aléa de l'épreuve.
 *
 * Tiré d'un HMAC plutôt que gardé en mémoire : le serveur retrouve la même
 * réponse au moment de juger, sans magasin et sans session, et le client ne
 * peut pas la calculer — il lui manque le jeton du bot.
 */
function cible(nonce) {
  const grain = (quoi) =>
    crypto.createHmac('sha256', `puzzle:${config.botToken}`).update(`${quoi}:${nonce}`)
      .digest().readUInt32BE(0);
  return {
    image: 1 + (grain('image') % IMAGES),
    x: X_MIN + (grain('x') % (X_MAX - X_MIN + 1)),
    y: Y_MIN + (grain('y') % (Y_MAX - Y_MIN + 1)),
  };
}

/** Tire une épreuve et renvoie de quoi la dessiner. */
export function buildChallenge(userId) {
  const nonce = crypto.randomBytes(9).toString('base64url');
  const expiresAt = Date.now() + CHALLENGE_TTL;
  const { image, x, y } = cible(nonce);

  return {
    prompt: 'Fais glisser la pièce à sa place',
    image: `/assets/captcha/charge-${image}.jpg`,
    largeur: LARGEUR,
    hauteur: HAUTEUR,
    piece: PIECE,
    // La position du trou : le client en a besoin pour le découper. Elle
    // n'est pas un secret — voir l'en-tête de ce fichier.
    x,
    y,
    nonce,
    expiresAt,
    // Lie l'épreuve à CE client et à CETTE expiration : on ne rejoue pas
    // l'épreuve d'un autre, et on ne s'accorde pas une heure de plus.
    token: sign(`${userId}:${nonce}:${expiresAt}`),
  };
}

/**
 * Le mouvement ressemble-t-il à une main ?
 *
 * Volontairement indulgent : une épreuve qui refuse un vrai client est pire
 * qu'un robot qui passe. On ne refuse donc que ce qu'aucune main ne produit —
 * un dépôt sans le moindre déplacement, ou un glissement plus rapide qu'un
 * battement de cil. Pas de courbe à analyser, pas de vitesse à modéliser : ce
 * serait prétendre distinguer ce qu'on ne sait pas distinguer.
 */
function gesteHumain(trace) {
  if (!Array.isArray(trace) || trace.length < 3) return false;
  const duree = Number(trace[trace.length - 1]?.t) - Number(trace[0]?.t);
  if (!Number.isFinite(duree) || duree < 120) return false;
  return true;
}

/**
 * Vérifie une réponse.
 *
 * La cible est RECALCULÉE depuis l'aléa : ce que le client annonce comme
 * position du trou n'entre pas dans le jugement, seulement là où il a lâché
 * la pièce.
 */
export function solveChallenge(userId, { nonce, expiresAt, token, x, trace } = {}) {
  if (!nonce || !token || !Number.isFinite(Number(x))) {
    return { ok: false, reason: 'Réponse incomplète.' };
  }
  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) {
    return { ok: false, reason: 'Épreuve expirée, on recommence.' };
  }
  if (!equal(sign(`${userId}:${nonce}:${expiresAt}`), token)) {
    return { ok: false, reason: 'Épreuve invalide, on recommence.' };
  }

  // Le décompte est pris avant de juger, et rendu si la réponse est bonne :
  // un client qui réussit du premier coup n'a rien consommé, un automate qui
  // balaie les positions s'arrête au douzième essai.
  const essai = cadenceDesEssais.passer(userId);
  if (!essai.ok) {
    return {
      ok: false,
      reason: `Trop d'essais. Réessaie dans ${Math.ceil(essai.attente / 60)} minute(s).`,
      pause: essai.attente,
    };
  }

  if (!gesteHumain(trace)) {
    return { ok: false, reason: 'Fais glisser la pièce, doucement.' };
  }
  if (Math.abs(Number(x) - cible(nonce).x) > TOLERANCE) {
    return { ok: false, reason: 'Pas tout à fait. Essaie encore.' };
  }

  cadenceDesEssais.absoudre(userId);
  return { ok: true, pass: issuePass(userId) };
}

/* ── Laissez-passer ──────────────────────────────────────── */

/** Jeton signé qui évite de réinterroger le client à chaque ouverture. */
export function issuePass(userId) {
  const expiresAt = Date.now() + PASS_TTL;
  return `${expiresAt}.${sign(`pass:${userId}:${expiresAt}`)}`;
}

export function passIsValid(pass, userId) {
  if (typeof pass !== 'string' || !pass.includes('.')) return false;
  const [expiresAt, signature] = pass.split('.');
  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return false;
  return equal(sign(`pass:${userId}:${expiresAt}`), signature ?? '');
}
