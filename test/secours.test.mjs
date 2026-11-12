/**
 * Le bot de secours : le registre, la veille, et les deux signatures.
 *
 * Ce que cette suite protège, et qui n'est pas évident : une veille qui crie
 * au loup. Un bot ne répond pas pour deux raisons sans rapport — Telegram a
 * fermé le compte, ou le réseau a hoqueté. La première est définitive, la
 * seconde dure trente secondes, et annoncer un déménagement à toute la
 * clientèle pour un hoquet de réseau, c'est fabriquer soi-même la panne
 * qu'on surveillait. Les épreuves ci-dessous jouent les deux.
 *
 * Elles protègent aussi une porte qui donnerait sur un mur : la Mini App
 * ouverte depuis le bot de secours est signée par le jeton du secours, et
 * un serveur qui ne connaîtrait que le premier jeton la refuserait — le
 * jour précis où c'est la seule porte qui reste.
 *
 * Aucun réseau : les API de Telegram sont remplacées par des fonctions qui
 * rendent ce qu'on leur dit de rendre.
 *
 * Usage :  node test/secours.test.mjs
 */
import crypto from 'node:crypto';
import { creerLaVeille, refusDefinitif, ausculter, annonceDeBascule, REFUS_AVANT_BASCULE }
  from '../server/veille.js';
import { verifyInitDataAny } from '../server/telegram-auth.js';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

/* ══ Ce qui compte comme une porte fermée ══ */

console.log('\n── Refus de Telegram, ou panne de notre côté ───────');

check('401 Unauthorized est un refus', refusDefinitif(new Error('Call to getMe failed! (401: Unauthorized)')));
check('404 Not Found est un refus', refusDefinitif(new Error('404: Not Found')));
check('Un timeout ne l est pas', !refusDefinitif(new Error('request to api.telegram.org failed, reason: ETIMEDOUT')));
check('Un DNS tombé ne l est pas', !refusDefinitif(new Error('getaddrinfo EAI_AGAIN api.telegram.org')));
check('Une coupure réseau ne l est pas', !refusDefinitif(new Error('socket hang up')));

/* ══ La ronde ══ */

console.log('\n── Une ronde ───────────────────────────────────────');

const porteVivante = (nom) => ({ getMe: async () => ({ username: nom }) });
const porteMorte = (message) => ({ getMe: async () => { throw new Error(message); } });

let vu = await ausculter({ principal: porteVivante('o68_bot'), secours: porteVivante('o68_secours') });
check('Deux portes debout sont vues debout',
  vu.principal.vivant && vu.secours.vivant, JSON.stringify(vu));
check('Et elle retient leur nom', vu.principal.username === 'o68_bot', vu.principal.username);

vu = await ausculter({ principal: porteMorte('401: Unauthorized'), secours: porteVivante('s') });
check('Une porte fermée est vue fermée, et le refus est retenu',
  vu.principal.vivant === false && vu.principal.definitif === true, vu.principal.raison);

vu = await ausculter({ principal: porteMorte('socket hang up'), secours: porteVivante('s') });
check('Une panne réseau est vue, mais pas comme définitive',
  vu.principal.vivant === false && vu.principal.definitif === false, vu.principal.raison);

/* ══ Ce qui déclenche l'annonce, et ce qui ne la déclenche pas ══ */

/** Une veille montée sur des portes qu'on pilote, et des envois qu'on compte. */
function banc({ principal, secours = porteVivante('s') }) {
  const clients = [];
  const vendeur = [];
  const veille = creerLaVeille({
    portes: { principal, secours },
    // Rien n'est écrit : une épreuve qui consigne dans le registre de la
    // boutique y laisse « principal muet », et le démarrage suivant
    // l'annonce au vendeur. C'est arrivé, d'où cette ligne.
    consigner: async () => {},
    prevenirClients: async (texte, liste) => {
      clients.push({ texte, combien: liste.length });
      return { envoyes: liste.length, refuses: 0 };
    },
    prevenirVendeur: async (texte) => { vendeur.push(texte); },
  });
  return { veille, clients, vendeur };
}

console.log('\n── Un réseau qui hoquette ──────────────────────────');

let b = banc({ principal: porteMorte('socket hang up') });
for (let i = 0; i < REFUS_AVANT_BASCULE + 5; i++) await b.veille.ronde();
check('Huit pannes réseau n annoncent rien aux clients', b.clients.length === 0, `${b.clients.length} envoi(s)`);
check('Et ne réveillent pas le vendeur non plus', b.vendeur.length === 0, b.vendeur.join(' | '));
check('Le compteur de refus reste à zéro', b.veille.etat().refusDAffilee === 0, String(b.veille.etat().refusDAffilee));

console.log('\n── Un compte fermé ─────────────────────────────────');

// Des nombres en dur, et non `REFUS_AVANT_BASCULE - 1` : une épreuve qui
// lit la constante qu'elle éprouve suit toutes ses valeurs, y compris 1 —
// et ne dit donc plus rien du seul comportement qui compte, à savoir qu'un
// refus isolé ne déclenche rien. Ramener le seuil à 1 doit casser ici.
check('Le seuil laisse passer au moins un quart d heure', REFUS_AVANT_BASCULE >= 3,
  `${REFUS_AVANT_BASCULE} ronde(s)`);

b = banc({ principal: porteMorte('401: Unauthorized') });
await b.veille.ronde();
check('Un refus isolé n annonce rien', b.clients.length === 0, `${b.clients.length} envoi(s)`);
await b.veille.ronde();
check('Deux refus non plus', b.clients.length === 0, `${b.clients.length} envoi(s)`);
await b.veille.ronde();
check('Le troisième déclenche l annonce', b.clients.length === 1, `${b.clients.length} envoi(s)`);
check('Le vendeur est prévenu', b.vendeur.some((t) => /refuse depuis/.test(t)), b.vendeur[0]?.slice(0, 60));

// Une panne qui dure ne doit pas se répéter : quarante messages identiques
// valent zéro message lu, et Telegram coupe un bot qui insiste.
const avant = b.clients.length;
for (let i = 0; i < 10; i++) await b.veille.ronde();
check('Une panne qui dure n annonce qu une fois', b.clients.length === avant, `${b.clients.length} envoi(s)`);

console.log('\n── Le retour ───────────────────────────────────────');

let vivant = false;
b = banc({
  principal: { getMe: async () => { if (!vivant) throw new Error('401: Unauthorized'); return { username: 'revenu' }; } },
});
for (let i = 0; i < REFUS_AVANT_BASCULE; i++) await b.veille.ronde();
check('La bascule a eu lieu', b.clients.length === 1);
vivant = true;
await b.veille.ronde();
check('Le vendeur apprend le retour', b.vendeur.some((t) => /répond de nouveau/.test(t)));
check('Et le compteur repart de zéro',
  b.veille.etat().refusDAffilee === 0 && b.veille.etat().annonceFaite === false,
  JSON.stringify(b.veille.etat()));

// Une boutique qui tombe deux fois dans l'année doit prévenir deux fois.
vivant = false;
for (let i = 0; i < REFUS_AVANT_BASCULE; i++) await b.veille.ronde();
check('Une seconde panne annonce de nouveau', b.clients.length === 2, `${b.clients.length} envoi(s)`);

/* ══ Ce que le client lit ══ */

console.log('\n── L annonce ───────────────────────────────────────');

const texte = annonceDeBascule('Original68');
check('Elle nomme la boutique', texte.includes('Original68'));
check("Elle ne parle ni de suppression ni de bannissement",
  !/supprim|bannis|ferm[ée]|banni/i.test(texte), texte.slice(0, 70));
check('Elle dit que rien n est perdu', /intact|rien n'a changé/i.test(texte));

/* ══ Les deux signatures ══ */

console.log('\n── Deux jetons, une boutique ───────────────────────');

const PRINCIPAL = '8000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const SECOURS = '9000000001:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const AUTRE = '7000000002:CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';

function signer(jeton, user) {
  const p = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify(user),
  });
  const donnees = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(jeton).digest();
  p.set('hash', crypto.createHmac('sha256', secret).update(donnees).digest('hex'));
  return p.toString();
}

const moi = { id: 5150, first_name: 'Amine' };
const jetons = [PRINCIPAL, SECOURS];

let r = verifyInitDataAny(signer(PRINCIPAL, moi), jetons);
check('Une session ouverte depuis le bot principal passe', r.ok && r.user.id === 5150, r.reason ?? '');
r = verifyInitDataAny(signer(SECOURS, moi), jetons);
check('Une session ouverte depuis le bot de secours passe aussi', r.ok && r.user.id === 5150, r.reason ?? '');
check('Et elle désigne le même client', r.user.id === 5150, String(r.user.id));
r = verifyInitDataAny(signer(AUTRE, moi), jetons);
check('Un troisième bot est refusé', !r.ok, r.reason ?? 'acceptée !');
r = verifyInitDataAny(signer(SECOURS, moi), [PRINCIPAL]);
check('Sans secours configuré, seul le principal ouvre', !r.ok, r.reason ?? 'acceptée !');
r = verifyInitDataAny(signer(PRINCIPAL, moi), []);
check('Sans aucun jeton, rien ne passe', !r.ok, r.reason ?? 'acceptée !');

/* ══ Le registre ══ */

console.log('\n── Le registre des joignables ──────────────────────');

// Le vrai magasin, avec un identifiant de passage qu'on retire ensuite : le
// registre est la seule chose que le secours possède en propre, et un
// double comptage y ferait croire à un filet plus large qu'il n'est.
const { inscrire, oublier, estInscrit, inscrits, noterSante, sante, oublierSante } =
  await import('../server/secours.js');

const passant = 990000000 + (Date.now() % 900000);
try {
  const avant = (await inscrits()).length;
  let r = await inscrire(passant);
  check('Un nouveau venu est compté une fois', r.nouveau === true, JSON.stringify(r));
  check('Et il est joignable', await estInscrit(passant));

  r = await inscrire(passant);
  check("Un second /start ne le compte pas deux fois", r.nouveau === false, JSON.stringify(r));
  check('Le registre a grandi d un seul', (await inscrits()).length === avant + 1,
    `${avant} → ${(await inscrits()).length}`);

  check('Partir le retire', (await oublier(passant)) === true);
  check('Et il n est plus joignable', (await estInscrit(passant)) === false);
  check('Oublier deux fois ne ment pas', (await oublier(passant)) === false);

  // La santé : on ne veut pas quarante annonces pour une panne qui dure,
  // et c'est ce booléen qui le décide.
  await noterSante('epreuve', { vivant: true, username: 'x' });
  let n = await noterSante('epreuve', { vivant: false, raison: '401' });
  check('Debout puis muet : c est un basculement', n.bascule === true, JSON.stringify(n));
  n = await noterSante('epreuve', { vivant: false, raison: '401' });
  check('Muet puis muet : ce n en est pas un', n.bascule === false, JSON.stringify(n));
  const etat = await sante();
  check('Et la raison du refus est gardée', etat.epreuve?.raison === '401', JSON.stringify(etat.epreuve));
} finally {
  await oublier(passant).catch(() => {});
  await oublierSante('epreuve').catch(() => {});
}

console.log(`\nBot de secours : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
