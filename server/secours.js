import { createStore } from './store.js';
import { config } from './config.js';

/**
 * Le bot de secours : le registre, et l'état des deux portes.
 *
 * Ce que ce module ne fait pas : parler à Telegram. Il tient la liste de
 * ceux qui ont enregistré le secours, et la dernière santé connue de chaque
 * bot. Les envois sont dans bot-secours.js, la veille dans veille.js.
 *
 * Pourquoi un registre, plutôt que « tous les clients » : Telegram interdit
 * à un bot d'écrire le premier à quelqu'un qui ne l'a jamais démarré. La
 * liste des clients de la boutique ne dit donc rien de qui le secours peut
 * joindre — seul le fait d'avoir ouvert *cette* conversation-là le dit. Un
 * client peut tout à fait avoir commandé trente fois et rester injoignable
 * par le second bot, et c'est le cœur du problème que ce registre résout :
 * il se remplit *avant* la panne, pendant que le premier bot fonctionne
 * encore et peut encore demander le geste.
 */

const store = createStore('secours.json', { inscrits: {}, sante: {} });

/** Le secours est-il configuré ? Sans jeton, tout ce qui suit s'éteint. */
export const configure = () => Boolean(config.botTokenSecours);

/**
 * Quelqu'un vient de démarrer le bot de secours.
 *
 * On garde la date : elle ne sert pas à l'inscription elle-même, mais elle
 * permet au vendeur de voir si sa couverture date de six mois ou d'hier —
 * un compte qui a bloqué le bot depuis ne le dira jamais autrement.
 */
export async function inscrire(userId) {
  const clef = String(userId);
  return store.update((data) => {
    data.inscrits ??= {};
    const deja = Boolean(data.inscrits[clef]);
    // Ne pas réécrire la date d'un inscrit : elle dit depuis quand il est
    // couvert, et la remettre à jour à chaque /start effacerait justement
    // l'information qu'on cherche.
    if (!deja) data.inscrits[clef] = { depuis: new Date().toISOString() };
    return { nouveau: !deja, total: Object.keys(data.inscrits).length };
  });
}

/** On oublie quelqu'un : il a bloqué le bot, ou il a demandé à partir. */
export async function oublier(userId) {
  const clef = String(userId);
  return store.update((data) => {
    data.inscrits ??= {};
    const existait = Boolean(data.inscrits[clef]);
    delete data.inscrits[clef];
    return existait;
  });
}

export async function estInscrit(userId) {
  const data = await store.read();
  return Boolean(data.inscrits?.[String(userId)]);
}

/** Les identifiants que le bot de secours a le droit de joindre. */
export async function inscrits() {
  const data = await store.read();
  return Object.keys(data.inscrits ?? {});
}

export async function combien() {
  return (await inscrits()).length;
}

/**
 * La santé d'une porte, telle que la dernière ronde l'a trouvée.
 *
 * `quel` vaut 'principal' ou 'secours'. On garde la date du dernier passage,
 * celle du dernier passage réussi, et la raison du refus quand il y en a
 * une : « Unauthorized » n'est pas « timeout », et le vendeur n'a pas les
 * mêmes choses à faire dans les deux cas.
 */
export async function noterSante(quel, { vivant, username = null, raison = null }) {
  return store.update((data) => {
    data.sante ??= {};
    const avant = data.sante[quel] ?? {};
    const maintenant = new Date().toISOString();
    data.sante[quel] = {
      vivant,
      username: username ?? avant.username ?? null,
      raison: vivant ? null : raison,
      vu: maintenant,
      vivantDepuis: vivant ? (avant.vivant ? avant.vivantDepuis ?? maintenant : maintenant) : null,
      mortDepuis: vivant ? null : (avant.vivant === false ? avant.mortDepuis ?? maintenant : maintenant),
    };
    // Le basculement, et lui seul, mérite d'être annoncé : une ronde qui
    // retrouve une porte fermée pour la quarantième fois n'est pas une
    // nouvelle, et quarante messages identiques valent zéro message lu.
    return { bascule: avant.vivant !== undefined && avant.vivant !== vivant, avant: avant.vivant };
  });
}

/** Oublie l'état d'une porte. Sert aux épreuves, et à un renommage. */
export async function oublierSante(quel) {
  return store.update((data) => {
    data.sante ??= {};
    const existait = Boolean(data.sante[quel]);
    delete data.sante[quel];
    return existait;
  });
}

export async function sante() {
  const data = await store.read();
  return data.sante ?? {};
}
