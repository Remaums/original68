/**
 * Ouverture de la boutique : interrupteur manuel et horaires hebdomadaires.
 *
 * Fonctions pures, sans accès au magasin : l'heure est passée en argument,
 * ce qui les rend vérifiables sans attendre mardi 3 h du matin.
 */

export const DAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

/** Horaires par défaut : ouvert tous les jours de 10 h à 22 h. */
export function defaultHours() {
  return Object.fromEntries(
    // 13h–00h, sept jours sur sept : les horaires de la maison, ceux que le
    // bandeau de la boutique annonce. La plage franchit minuit, ce que la
    // lecture plus bas sait faire (`to + 24 h` quand `to` précède `from`).
    DAYS.map((day) => [day, { closed: false, from: '13:00', to: '00:00' }])
  );
}

/**
 * La boutique accepte-t-elle des commandes maintenant ?
 *
 * @returns {{open: boolean, reason: 'manuelle'|'horaires'|null}}
 */
export function isOpenNow(opening, now = new Date()) {
  if (!opening?.open) return { open: false, reason: 'manuelle' };
  if (!opening.hours?.enabled) return { open: true, reason: null };

  const { day, minutes } = localTime(now, opening.hours.timezone);
  const days = opening.hours.days ?? {};
  const index = DAYS.indexOf(day);

  // Le créneau du jour…
  if (covers(days[day], minutes)) return { open: true, reason: null };

  // … et celui de la veille s'il franchit minuit : à 1 h du matin, c'est
  // l'horaire d'hier soir (22:00 → 02:00) qui décide, pas celui d'aujourd'hui.
  const yesterday = days[DAYS[(index + 6) % 7]];
  if (index >= 0 && wrapsPastMidnight(yesterday) && covers(yesterday, minutes + 24 * 60)) {
    return { open: true, reason: null };
  }

  return { open: false, reason: 'horaires' };
}

/**
 * Dans combien de minutes la boutique change-t-elle d'état ?
 *
 * Sert au bandeau qui décompte : « ferme dans 2 h 15 » vaut mieux qu'un
 * « ouvert » nu, parce qu'un client qui remplit son panier a besoin de savoir
 * s'il a le temps. On rend des minutes plutôt qu'une heure absolue : le
 * téléphone du client peut être à l'heure d'un autre fuseau, et un décompte
 * relatif reste juste de toute façon.
 *
 * Rend `null` quand rien ne changera — horaires coupés, boutique fermée à la
 * main, ou ouverte sans interruption.
 *
 * @returns {{open: boolean, minutes: number}|null}
 */
export function nextChange(opening, now = new Date()) {
  if (!opening?.open) return null;            // fermeture manuelle : rien à décompter
  if (!opening.hours?.enabled) return null;   // sans horaires, l'état ne bouge pas

  const etat = isOpenNow(opening, now);
  const { minutes } = localTime(now, opening.hours.timezone);
  const jours = opening.hours.days ?? {};

  // On avance minute par minute jusqu'au basculement, au plus une semaine.
  // Une semaine de minutes, c'est dix mille tours de boucle sur des nombres :
  // trop peu pour qu'une formule plus savante en vaille la complexité, et
  // impossible à prendre en défaut sur les plages qui franchissent minuit.
  const depart = DAYS.indexOf(localTime(now, opening.hours.timezone).day);
  if (depart < 0) return null;

  for (let delta = 1; delta <= 7 * 24 * 60; delta++) {
    const total = minutes + delta;
    const jour = DAYS[(depart + Math.floor(total / (24 * 60))) % 7];
    const dansLeJour = total % (24 * 60);

    const veille = DAYS[(DAYS.indexOf(jour) + 6) % 7];
    const ouvert =
      covers(jours[jour], dansLeJour) ||
      (wrapsPastMidnight(jours[veille]) && covers(jours[veille], dansLeJour + 24 * 60));

    if (ouvert !== etat.open) return { open: etat.open, minutes: delta };
  }
  return null; // ouverte en continu
}

/**
 * À quelle heure la boutique rouvre-t-elle ? « 13h », « 13h30 », ou rien.
 *
 * Le bandeau d'accueil annonce « Dispo maintenant ». Fermée, cette phrase
 * ment — et elle le fait treize heures par jour sur des horaires 13h–00h,
 * juste au-dessus du bandeau d'état qui, lui, dit la vérité. Elle est donc
 * remplacée par l'heure de retour, et cette heure se calcule ici.
 *
 * Elle ne peut pas se calculer chez le client : il reçoit un décompte en
 * minutes, pas un fuseau. Ajouter ces minutes à sa propre horloge lui
 * donnerait l'heure de retour dans SON fuseau — juste pour un voisin, faux
 * pour quiconque consulte depuis l'étranger, et c'est un rendez-vous qu'on
 * annonce. Le fuseau de la boutique ne sort jamais d'ici : l'heure non plus.
 *
 * Rend `null` quand la boutique est ouverte, et quand l'heure de retour est
 * inconnue — fermeture à la main, horaires coupés : il n'y a alors rien à
 * promettre, et c'est au client d'écrire autre chose.
 *
 * @returns {string|null}
 */
export function nextOpeningLabel(opening, now = new Date()) {
  const prochain = nextChange(opening, now);
  if (!prochain || prochain.open) return null;

  // On repart de la minute du jour dans le fuseau de la boutique et on y
  // ajoute le décompte, plutôt que de refaire une Date : c'est exactement la
  // grandeur sur laquelle `nextChange` a compté, donc les deux ne peuvent pas
  // diverger d'une minute à la frontière d'un créneau.
  const { minutes } = localTime(now, opening.hours?.timezone);
  const total = (minutes + prochain.minutes) % (24 * 60);
  const heures = Math.floor(total / 60);
  const restantes = total % 60;
  return restantes ? `${heures}h${String(restantes).padStart(2, '0')}` : `${heures}h`;
}

/** Le créneau couvre-t-il cette minute ? (les minutes peuvent dépasser 24 h) */
function covers(slot, minutes) {
  if (!slot || slot.closed) return false;
  const from = toMinutes(slot.from);
  const to = toMinutes(slot.to);
  if (from === null || to === null) return false;

  const end = to > from ? to : to + 24 * 60; // plage qui franchit minuit
  return minutes >= from && minutes < end;
}

function wrapsPastMidnight(slot) {
  if (!slot || slot.closed) return false;
  const from = toMinutes(slot.from);
  const to = toMinutes(slot.to);
  return from !== null && to !== null && to <= from;
}

/** Jour et minute du jour dans le fuseau de la boutique, pas celui du serveur. */
function localTime(now, timezone) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone || 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  // « lun. » → « lun »
  const day = get('weekday').replace('.', '').toLowerCase().slice(0, 3);
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function toMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Nettoie des horaires reçus du client avant enregistrement. */
export function normalizeHours(input) {
  const base = defaultHours();
  if (!input || typeof input !== 'object') return base;

  for (const day of DAYS) {
    const value = input[day];
    if (!value || typeof value !== 'object') continue;
    base[day] = {
      closed: Boolean(value.closed),
      from: toMinutes(value.from) === null ? base[day].from : String(value.from),
      to: toMinutes(value.to) === null ? base[day].to : String(value.to),
    };
  }
  return base;
}
