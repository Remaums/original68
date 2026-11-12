import { config } from './config.js';
import { noterSante, sante, inscrits, combien, configure } from './secours.js';

/**
 * La ronde : toutes les cinq minutes, chaque porte répond-elle encore ?
 *
 * Une seule question suffit — `getMe`. C'est l'appel le moins cher de l'API,
 * et c'est le premier que Telegram refuse quand un bot est fermé.
 *
 * Toute la difficulté est de ne pas crier au loup. Un bot ne répond pas pour
 * deux raisons qui n'ont rien à voir : Telegram a fermé le compte, ou le
 * réseau a hoqueté. La première est définitive, la seconde dure trente
 * secondes. Annoncer à toute la clientèle un déménagement pour un hoquet de
 * réseau, c'est faire soi-même la panne qu'on surveillait.
 *
 * D'où deux verrous :
 *
 *   1. Seul un REFUS de Telegram compte — 401, 404, « Unauthorized ». Un
 *      timeout, un DNS qui tombe, une coupure de la machine : ce sont des
 *      pannes de notre côté, elles sont notées mais ne déclenchent rien.
 *   2. Il en faut trois de suite. À cinq minutes de ronde, cela fait un
 *      quart d'heure de refus constant avant qu'un seul message parte.
 *
 * Un compte fermé le reste. Un quart d'heure est donc gratuit, et c'est le
 * prix de ne jamais annoncer un déménagement qui n'a pas eu lieu.
 */

export const RONDE_MS = 5 * 60 * 1000;
export const REFUS_AVANT_BASCULE = 3;

/** Un refus de Telegram, par opposition à une panne de notre côté. */
export function refusDefinitif(err) {
  const message = String(err?.message ?? err ?? '');
  if (/\b(401|404|409)\b/.test(message)) return true;
  return /unauthorized|not found|bot was blocked|token is invalid|chat not found/i.test(message);
}

/**
 * Une ronde. Rend ce qu'elle a vu, sans rien envoyer : c'est l'appelant qui
 * décide, et c'est ce qui rend la fonction vérifiable sans réseau ni bot.
 */
export async function ausculter(portes) {
  const vu = {};
  for (const [quel, api] of Object.entries(portes)) {
    if (!api) continue;
    try {
      const moi = await api.getMe();
      vu[quel] = { vivant: true, username: moi?.username ?? null };
    } catch (err) {
      vu[quel] = {
        vivant: false,
        definitif: refusDefinitif(err),
        raison: String(err?.message ?? err ?? 'inconnu').slice(0, 200),
      };
    }
  }
  return vu;
}

/**
 * Le texte qu'un client reçoit quand la porte principale est tombée.
 *
 * Il ne dit pas « le bot a été supprimé » : le client s'en moque, et
 * l'annonce d'une fermeture est exactement ce qui fait fuir. Il dit ce qui
 * est vrai et utile — la boutique est là, et c'est ici que ça se passe
 * maintenant.
 */
export function annonceDeBascule(nomBoutique) {
  return (
    `🆘 ${nomBoutique}\n\n` +
    "L'autre conversation ne répond plus. Rien n'a changé pour toi : le " +
    'catalogue, les prix et tes commandes sont intacts, et tout se passe ' +
    'désormais ici.\n\n' +
    "Garde cette conversation : c'est elle, maintenant, qui ouvre la boutique."
  );
}

/**
 * La veille, montée sur des fonctions plutôt que sur des modules.
 *
 * `portes` donne les deux API à interroger, `prevenirClients` et
 * `prevenirVendeur` disent quoi faire d'un basculement, `consigner` décide
 * où l'état est écrit — le registre de la boutique en service, rien du tout
 * dans une épreuve. Ce dernier point n'est pas de la coquetterie : sans lui,
 * une suite d'épreuves écrivait « principal muet » dans les données de la
 * vraie boutique, et le démarrage suivant l'annonçait au vendeur. Tout est
 * injecté :
 * c'est ce qui permet d'éprouver la logique — trois refus puis bascule, un
 * timeout qui ne bascule pas, une seule annonce pour une panne qui dure —
 * sans jamais toucher à Telegram.
 */
export function creerLaVeille({
  portes, prevenirClients, prevenirVendeur, intervalle = RONDE_MS, consigner = noterSante,
}) {
  let refusDAffilee = 0;
  let annonceFaite = false;
  let minuterie = null;

  async function ronde() {
    const vu = await ausculter(portes);

    for (const [quel, etat] of Object.entries(vu)) {
      await consigner(quel, etat).catch(() => {});
    }

    const principal = vu.principal;
    if (!principal) return vu;

    if (principal.vivant) {
      // La porte est revenue : on repart de zéro, et on se redonne le droit
      // d'annoncer une prochaine panne. Sans cette remise à zéro, une
      // boutique qui tombe deux fois dans l'année ne préviendrait qu'une.
      if (annonceFaite && prevenirVendeur) {
        await prevenirVendeur(
          '✅ Le bot principal répond de nouveau. Les clients qui avaient reçu ' +
            "l'adresse de secours peuvent revenir dessus — ils n'ont rien à faire."
        ).catch(() => {});
      }
      refusDAffilee = 0;
      annonceFaite = false;
      return vu;
    }

    // Une panne de notre côté n'est pas une fermeture de compte : on la note,
    // on ne compte pas, on n'annonce rien.
    if (!principal.definitif) return vu;

    refusDAffilee += 1;
    if (refusDAffilee < REFUS_AVANT_BASCULE || annonceFaite) return vu;

    annonceFaite = true;
    const liste = await inscrits().catch(() => []);
    if (prevenirVendeur) {
      await prevenirVendeur(
        `🆘 Le bot principal refuse depuis ${REFUS_AVANT_BASCULE} rondes ` +
          `(${principal.raison}).\n\n` +
          `J'annonce l'adresse de secours aux ${liste.length} client(s) qui l'ont ` +
          'enregistrée. Les autres ne sont pas joignables : Telegram interdit à ' +
          "un bot d'écrire le premier à qui ne l'a jamais démarré."
      ).catch(() => {});
    }
    if (prevenirClients) {
      const bilan = await prevenirClients(annonceDeBascule(config.shopName), liste).catch(() => null);
      if (bilan && prevenirVendeur) {
        await prevenirVendeur(
          `Annonce de secours : ${bilan.envoyes} remis, ${bilan.refuses} refusés.`
        ).catch(() => {});
      }
    }
    return vu;
  }

  return {
    ronde,
    demarrer() {
      if (minuterie) return;
      // `unref` : la veille ne doit pas, à elle seule, garder le process en
      // vie. C'est un service d'arrière-plan, pas une raison d'exister.
      minuterie = setInterval(() => { ronde().catch(() => {}); }, intervalle);
      minuterie.unref?.();
      ronde().catch(() => {});
    },
    arreter() {
      if (minuterie) clearInterval(minuterie);
      minuterie = null;
    },
    // Pour les épreuves : l'état interne, sans avoir à deviner.
    etat: () => ({ refusDAffilee, annonceFaite }),
  };
}

/** Ce que la boutique sait du secours, en une phrase lisible au démarrage. */
export async function resumeDuSecours() {
  if (!configure()) return 'Bot de secours : non configuré (BOT_TOKEN_SECOURS absent).';
  const etat = await sante().catch(() => ({}));
  const n = await combien().catch(() => 0);
  // Trois états, pas deux : une porte qu'aucune ronde n'a encore vue n'est
  // pas debout, elle est inconnue. Les confondre annonçait « secours
  // debout » au démarrage, avant le premier appel.
  const dire = (e) => (e?.vivant === undefined ? 'pas encore vu' : e.vivant ? 'debout' : 'muet');
  const p = dire(etat.principal);
  const s = dire(etat.secours);
  return `Bot de secours : ${n} client(s) enregistré(s) · principal ${p} · secours ${s}.`;
}
