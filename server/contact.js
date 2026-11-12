/**
 * Qui la boutique prévient, et qui les clients écrivent.
 *
 * Les deux vivaient dans le `.env` : `ADMIN_CHAT_ID` pour les commandes, les
 * alertes de stock et les messages relayés, `SELLER_USERNAME` pour le compte
 * que le client contacte. Les changer demandait donc d'ouvrir un terminal sur
 * le VPS et de redémarrer — pour deux valeurs qui bougent quand on change de
 * compte, qu'on prend un associé, ou qu'un bot se fait fermer.
 *
 * Elles se règlent maintenant dans le panneau. Le `.env` reste le REPLI :
 * champ vide dans les réglages, on retombe sur lui. Une boutique déjà en
 * service ne voit donc rien changer tant qu'elle ne touche à rien, et une
 * installation neuve marche avec le seul `.env`, comme avant.
 *
 * ── Pourquoi un accesseur, et pas une lecture des réglages ──
 *
 * Vingt-et-un endroits lisaient `config.adminChatId`, dont plusieurs dans des
 * fonctions que rien n'oblige à être asynchrones. Les faire toutes attendre
 * une lecture de magasin pour obtenir un identifiant, c'est vingt-et-un
 * `await` de plus et autant d'occasions d'en oublier un. On garde donc une
 * valeur en mémoire, que `getSettings()` rafraîchit à chaque lecture — et
 * comme presque toute requête lit les réglages, elle est fraîche.
 *
 * Avant la toute première lecture, c'est le `.env` qui parle. C'est le bon
 * repli : au démarrage, une notification qui part au mauvais endroit serait
 * pire qu'une notification qui part à l'adresse d'origine.
 */
import { config } from './config.js';

let admin = config.adminChatId;
let vendeur = config.sellerUsername;

/** Où le bot dépose commandes, alertes et messages de clients. */
export const adminAPrevenir = () => admin;

/** Le compte que le client contacte depuis la boutique. */
export const vendeurJoignable = () => vendeur;

/** Appelé par `getSettings()` : les réglages priment, le `.env` rattrape. */
export function retenirLeContact(contact) {
  admin = String(contact?.adminChatId ?? '').trim() || config.adminChatId;
  vendeur = String(contact?.sellerUsername ?? '').trim() || config.sellerUsername;
}

/**
 * Un identifiant de conversation Telegram.
 *
 * Négatif pour un groupe ou un canal — c'est justement le cas qu'on veut
 * permettre : déposer les commandes dans un groupe où deux vendeurs les
 * voient. Refuser le signe reviendrait à n'accepter que les comptes seuls.
 */
export function identifiantDeConversation(valeur) {
  const brut = String(valeur ?? '').trim();
  if (!brut) return '';
  if (!/^-?\d{1,20}$/.test(brut)) {
    throw new Error('Identifiant de conversation invalide : des chiffres, éventuellement précédés d\'un moins.');
  }
  return brut;
}

/**
 * Un pseudo Telegram, quelle que soit la façon dont on l'a collé.
 *
 * Le lien complet, le `@pseudo`, le pseudo nu : les trois marchent. Refuser
 * la forme qu'on a sous la main, c'est un réglage qui ne s'enregistre jamais
 * sans qu'on comprenne pourquoi.
 *
 * Les règles sont celles de Telegram : de 5 à 32 caractères, lettres,
 * chiffres et soulignés, et jamais un chiffre en tête.
 */
export function pseudoTelegram(valeur) {
  const brut = String(valeur ?? '').trim();
  if (!brut) return '';
  const lien = brut.match(/t\.me\/([^/?#]+)/i);
  const pseudo = (lien ? lien[1] : brut).replace(/^@/, '').trim();
  if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(pseudo)) {
    throw new Error('Pseudo Telegram invalide : 5 à 32 caractères, lettres, chiffres et « _ ».');
  }
  return pseudo;
}
