import { createStore } from './store.js';
import { LANGUES, LANGUE_PAR_DEFAUT } from '../webapp/js/langues.js';

/**
 * La langue d'un client, connue du serveur.
 *
 * Elle ne vivait que dans le navigateur, et cela suffisait tant que la
 * boutique était seule à parler. Le bot s'y met : sans un endroit commun,
 * un client qui choisit l'italien dans la boutique recevrait ses messages
 * en français, et corrigerait deux fois le même réglage sans comprendre
 * pourquoi il ne tient pas.
 *
 * Un code de deux lettres par identifiant Telegram. Rien d'autre — ce n'est
 * pas un profil, c'est un réglage.
 */

const store = createStore('langue.json', {});

/** Les codes que la boutique sait parler. Le reste est refusé. */
const CONNUES = new Set(LANGUES.map((l) => l.code));

export const estConnue = (code) => CONNUES.has(String(code ?? '').toLowerCase());

/**
 * La langue à employer pour ce client, et d'où elle vient.
 *
 * Trois sources, dans cet ordre : ce qu'il a choisi, ce que dit son
 * téléphone, et le français. La deuxième compte plus qu'il n'y paraît — un
 * client n'a rien à régler si son Telegram est déjà dans sa langue, et un
 * réglage qu'on n'a pas besoin de toucher est le meilleur des réglages.
 *
 * `source` sert à décider s'il faut lui proposer le choix : à qui a choisi,
 * on ne redemande pas.
 */
export async function langueDe(userId, codeTelegram) {
  const data = await store.read();
  const choisie = data[String(userId)];
  if (estConnue(choisie)) return { code: choisie, source: 'choisie' };

  // « en-GB » et « en-US » sont la même entrée du dictionnaire.
  const deux = String(codeTelegram ?? '').slice(0, 2).toLowerCase();
  if (estConnue(deux)) return { code: deux, source: 'telephone' };

  return { code: LANGUE_PAR_DEFAUT, source: 'defaut' };
}

/** Enregistre un choix. Rend le code retenu, ou null si on ne le parle pas. */
export async function choisirLaLangue(userId, code) {
  const propre = String(code ?? '').toLowerCase();
  if (!estConnue(propre)) return null;
  return store.update((data) => {
    data[String(userId)] = propre;
    return propre;
  });
}

/** Oublie le choix d'un client. Sert à l'effacement de ses données. */
export async function oublierLaLangue(userId) {
  return store.update((data) => {
    const existait = Boolean(data[String(userId)]);
    delete data[String(userId)];
    return existait;
  });
}

/** Combien de clients par langue. Pour le tableau de bord du vendeur. */
export async function comptesParLangue() {
  const data = await store.read();
  const comptes = {};
  for (const code of Object.values(data)) comptes[code] = (comptes[code] ?? 0) + 1;
  return comptes;
}
