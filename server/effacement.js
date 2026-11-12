/**
 * Effacer les données d'une personne.
 *
 * Le panneau savait déjà effacer par DATE — toutes les commandes d'avant le
 * 1er janvier. Il ne savait pas effacer quelqu'un. C'est pourtant la demande
 * qui arrive vraiment : un client qui s'en va et demande qu'on l'oublie, ou
 * une adresse qu'on n'a plus de raison de garder.
 *
 * ── Le danger de cette fonction ─────────────────────────────
 *
 * Un effacement partiel est PIRE que pas d'effacement du tout : il annonce
 * que c'est fait. Le vendeur répond à son client « c'est effacé », et le
 * numéro de téléphone dort toujours dans un magasin qu'on avait oublié.
 *
 * D'où `MAGASINS` : la liste complète des magasins de la boutique, chacun avec
 * son traitement — ou avec la raison écrite pour laquelle il ne contient rien
 * de personnel. Une suite compare cette liste aux `createStore()` du code et
 * tombe si un magasin apparaît sans y figurer. Ajouter un magasin oblige donc
 * à dire ce qu'il advient de son contenu quand quelqu'un demande à partir.
 *
 * ── Deux modes, comme pour la purge par date ────────────────
 *
 * `oublier` détache la personne de tout : ses commandes gardent leurs
 * montants, sa note compte toujours dans la moyenne d'un produit, mais plus
 * rien n'y désigne quelqu'un. La comptabilité ne se réécrit pas.
 *
 * `effacer` enlève en plus ses commandes et ses avis. Le chiffre d'affaires
 * bouge, et c'est le prix à payer.
 *
 * `oublier` est presque toujours le bon choix.
 */
import { HttpError } from './catalog.js';
import { effacerLesCommandesDe, allOrders } from './orders.js';
import { effacerLesAvisDe, tousLesAvis } from './avis.js';
import { oublierUtilisateur, ficheDuRegistre } from './users.js';
import { oublierClient as oublierLesFavoris, favorisDe } from './favoris.js';
import { oublierClient as oublierLesPreferences } from './preferences.js';
import { oublierClient as oublierLesAttentes } from './waitlist.js';
import { oublierClient as oublierLesCodes } from './promos.js';
import { oublierLaLangue } from './langue.js';
import { oublier as oublierLeSecours } from './secours.js';
import { oublier as oublierLaPorte } from './bot-captcha.js';
import { resetVerification, getVerification } from './verification.js';
import { reabonner } from './annonces.js';
import { oublierPresence } from './presence.js';
import { getSettings, isBlocked } from './settings.js';
import { estAdmin } from './admins.js';

/**
 * Tous les magasins de la boutique, et ce qu'il advient de chacun.
 *
 * `personnel: false` veut dire : ce magasin ne contient rien qui désigne
 * quelqu'un, et la raison est écrite. Elle doit se relire dans un an.
 */
export const MAGASINS = [
  { fichier: 'orders.json', personnel: true, quoi: 'commandes : nom, identifiant, adresse, téléphone, note' },
  { fichier: 'users.json', personnel: true, quoi: 'registre du bot : prénom, pseudo, nombre d\'ouvertures' },
  { fichier: 'avis.json', personnel: true, quoi: 'avis : auteur et référence de commande' },
  { fichier: 'favoris.json', personnel: true, quoi: 'produits mis en favori' },
  { fichier: 'preferences.json', personnel: true, quoi: 'réglages d\'alertes' },
  { fichier: 'langue.json', personnel: true, quoi: 'langue choisie' },
  { fichier: 'waitlist.json', personnel: true, quoi: 'lignes attendues en rupture' },
  { fichier: 'verifications.json', personnel: true, quoi: 'verdict de vérification d\'identité' },
  { fichier: 'captcha-bot.json', personnel: true, quoi: 'porte du bot : passée ou non' },
  { fichier: 'secours.json', personnel: true, quoi: 'inscription au bot de secours' },
  { fichier: 'annonces.json', personnel: true, quoi: 'désabonnement aux annonces' },
  { fichier: 'promos.json', personnel: true, quoi: 'codes promo réclamés' },
  {
    fichier: 'settings.json',
    personnel: true,
    quoi: 'liste des bloqués',
    // Volontairement laissé sur place : voir `effacerLaPersonne`.
    garde: 'le blocage reste',
  },
  {
    fichier: 'admins.json',
    personnel: false,
    pourquoi: "ce sont des vendeurs, pas des clients — et l'effacement d'un admin est refusé",
  },
  { fichier: 'catalog.json', personnel: false, pourquoi: 'des produits, personne dedans' },
  { fichier: 'entretien.json', personnel: false, pourquoi: 'dates du dernier passage de la minuterie' },
];

/** Les identifiants Telegram sont des entiers ; on n'efface pas sur un « à peu près ». */
export function identifiantValide(id) {
  const texte = String(id ?? '').trim();
  if (!/^\d{1,20}$/.test(texte)) {
    throw new HttpError(400, 'Donne un identifiant Telegram, en chiffres.');
  }
  return texte;
}

/**
 * Ce qu'on trouve sur quelqu'un, avant de toucher à quoi que ce soit.
 *
 * Le bouton ne doit pas s'appuyer à l'aveugle : un effacement ne se rattrape
 * pas, et le vendeur a le droit de voir ce qu'il s'apprête à perdre — y
 * compris « rien », qui arrive quand on se trompe d'un chiffre.
 */
export async function apercuDeLaPersonne(id) {
  const cible = identifiantValide(id);
  const [toutes, avis, favoris, registre, verif, reglages, admin] = await Promise.all([
    // `allOrders` et non `listOrders` : celle-ci ne rend que les cinquante
    // dernières, et un aperçu d'effacement qui annonce « 50 commandes » à
    // quelqu'un qui en a soixante ment sur ce qu'il s'apprête à détruire.
    allOrders(),
    tousLesAvis(),
    favorisDe(cible),
    ficheDuRegistre(cible).catch(() => null),
    getVerification(cible).catch(() => null),
    getSettings(),
    estAdmin(cible),
  ]);

  const commandes = toutes.filter((c) => String(c?.user?.id ?? '') === cible);
  const siens = avis.filter((a) => String(a?.user?.id ?? '') === cible);
  const nommees = commandes.filter((c) => !c.anonymise);

  return {
    id: cible,
    admin,
    bloque: isBlocked(reglages, cible),
    // Le prénom le plus récent qu'on ait vu de lui, pour que le vendeur
    // reconnaisse la personne avant d'appuyer.
    nom: registre?.firstName ?? nommees[0]?.user?.firstName ?? null,
    pseudo: registre?.username ?? nommees[0]?.user?.username ?? null,
    commandes: commandes.length,
    commandesNommees: nommees.length,
    depense: commandes.reduce((somme, c) => somme + (c.total ?? 0), 0),
    avis: siens.length,
    favoris: favoris.length,
    connu: Boolean(registre),
    verification: verif?.status ?? 'none',
  };
}

/**
 * Efface quelqu'un. Rien n'est récupérable ensuite.
 *
 * Le blocage n'est PAS levé, et c'est un choix. Un client bloqué qu'on efface
 * reviendrait libre le lendemain, sous le même identifiant : l'effacement
 * deviendrait le moyen de se débloquer soi-même. Le rapport le dit, et le
 * vendeur débloque à part s'il le veut.
 *
 * Un admin n'est pas effaçable. C'est le garde-fou contre l'accident qui
 * coûte le plus cher — s'effacer soi-même — et un vendeur qui veut vraiment
 * partir se retire d'abord des admins.
 */
export async function effacerLaPersonne(id, { mode = 'oublier' } = {}) {
  const cible = identifiantValide(id);
  if (mode !== 'oublier' && mode !== 'effacer') {
    throw new HttpError(400, `Effacement inconnu : ${mode}`);
  }
  if (await estAdmin(cible)) {
    throw new HttpError(
      400,
      "Cette personne est administratrice de la boutique : retire-lui d'abord ses droits."
    );
  }

  const avant = await apercuDeLaPersonne(cible);
  const garder = mode === 'oublier';

  // Les commandes et les avis d'abord : ce sont les deux seuls magasins où le
  // mode change quelque chose, et les deux plus gros. S'ils échouent, rien
  // n'a encore été détruit ailleurs.
  const commandes = await effacerLesCommandesDe(cible, { garder });
  const avis = await effacerLesAvisDe(cible, { garder });

  // Le reste part dans tous les cas : rien là-dedans ne fait une comptabilité.
  const [favoris, attentes, codes] = await Promise.all([
    oublierLesFavoris(cible),
    oublierLesAttentes(cible),
    oublierLesCodes(cible),
  ]);
  await Promise.all([
    oublierUtilisateur(cible),
    oublierLesPreferences(cible),
    oublierLaLangue(cible),
    oublierLeSecours(cible),
    oublierLaPorte(cible),
    resetVerification(cible),
    // « Réabonner » retire de la liste des désabonnés : c'est son identifiant
    // qui y dormait, et c'est lui qu'on enlève.
    reabonner(cible),
  ]);
  oublierPresence(cible);

  return {
    id: cible,
    mode,
    avant,
    commandes,
    avis,
    favoris,
    attentes,
    codes,
    // Ce qui n'a PAS été effacé, dit en clair plutôt que tu par omission.
    bloqueEncore: avant.bloque,
  };
}
