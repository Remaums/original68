/**
 * Ouvre un tunnel HTTPS vers la boutique et rend l'adresse, seule.
 *
 *   npm run tunnel              → l'adresse, et .env mis à jour
 *   npm run tunnel -- --lancer  → idem, puis la boutique démarre
 *
 * Trois pertes de temps que ce script supprime :
 *
 *  - `npx cloudflared` retélécharge une archive de quarante mégaoctets à
 *    chaque lancement. On cherche donc d'abord un vrai `cloudflared` installé
 *    sur la machine, et on ne retombe sur npx qu'à défaut — en le disant.
 *  - l'adresse est noyée dans un journal qui commence par un paragraphe de
 *    conditions d'utilisation. On la guette et on n'affiche qu'elle.
 *  - il faut ensuite la recopier à la main dans .env, puis relancer. Le
 *    script l'écrit, en gardant le reste du fichier intact.
 *
 * Le tunnel reste ouvert tant que la fenêtre l'est : c'est lui qui relaie le
 * trafic. Le fermer coupe la boutique pour les clients.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);
const racine = new URL('..', import.meta.url).pathname;
const ENV = `${racine}.env`;

const PORT = (() => {
  if (!existsSync(ENV)) return '3300';
  const m = readFileSync(ENV, 'utf8').match(/^PORT=(\d+)/m);
  return m ? m[1] : '3300';
})();

const lancerLaBoutique = process.argv.includes('--lancer');

/* ── Trouver cloudflared sans rien télécharger si possible ── */

function binaireInstalle() {
  // `--version` plutôt que `which` ou `where` : la réponse est la même sur
  // Windows, macOS et Linux, et elle prouve en plus que le binaire s'exécute.
  const essai = spawn('cloudflared', ['--version'], { stdio: 'ignore', shell: true });
  return new Promise((res) => {
    essai.on('error', () => res(false));
    essai.on('exit', (code) => res(code === 0));
  });
}

const ANSI = { gris: '\x1b[90m', jaune: '\x1b[33m', vert: '\x1b[32m', gras: '\x1b[1m', fin: '\x1b[0m' };
const dire = (t = '') => process.stdout.write(`${t}\n`);

/* ── Écrire l'adresse dans .env, sans abîmer le reste ─────── */

function inscrireLAdresse(url) {
  if (!existsSync(ENV)) {
    dire(`${ANSI.jaune}⚠ Pas de fichier .env : l'adresse n'a pas été enregistrée.${ANSI.fin}`);
    dire(`  Crée-le avec : cp .env.example .env`);
    return false;
  }
  const avant = readFileSync(ENV, 'utf8');
  // On remplace la ligne si elle existe, on l'ajoute sinon. Réécrire tout le
  // fichier depuis un modèle effacerait le token et les identifiants admin.
  const apres = /^WEBAPP_URL=.*$/m.test(avant)
    ? avant.replace(/^WEBAPP_URL=.*$/m, `WEBAPP_URL=${url}`)
    : `${avant.replace(/\n*$/, '')}\nWEBAPP_URL=${url}\n`;
  if (apres === avant) return true;
  writeFileSync(ENV, apres);
  return true;
}

/* ── Le tunnel ────────────────────────────────────────────── */

const installe = await binaireInstalle();
if (!installe) {
  dire(`${ANSI.jaune}cloudflared n'est pas installé : on passe par npx, ce qui prend`);
  dire(`une minute la première fois. Pour que ce soit instantané ensuite :${ANSI.fin}`);
  dire(`  Windows : ${ANSI.gras}winget install Cloudflare.cloudflared${ANSI.fin}`);
  dire(`  macOS   : ${ANSI.gras}brew install cloudflared${ANSI.fin}`);
  dire(`  Linux   : ${ANSI.gras}sudo apt install cloudflared${ANSI.fin}   (ou le .deb de Cloudflare)`);
  dire();
}

const commande = installe ? 'cloudflared' : 'npx';
const args = installe
  ? ['tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate']
  : ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate'];

dire(`${ANSI.gris}Ouverture du tunnel vers http://localhost:${PORT}…${ANSI.fin}`);

const tunnel = spawn(commande, args, { shell: true });
let trouvee = false;

// cloudflared écrit son journal sur la sortie d'erreur, pas la sortie
// standard : n'écouter que stdout ne donnerait jamais l'adresse.
const guetter = (morceau) => {
  const texte = String(morceau);
  const m = texte.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!m || trouvee) return;
  trouvee = true;
  const url = m[0];
  const ecrit = inscrireLAdresse(url);

  dire();
  dire(`${ANSI.vert}${ANSI.gras}  ${url}${ANSI.fin}`);
  dire();
  if (ecrit) dire(`${ANSI.gris}  WEBAPP_URL enregistrée dans .env${ANSI.fin}`);
  dire(`${ANSI.gris}  Laisse cette fenêtre ouverte : le tunnel s'arrête avec elle.${ANSI.fin}`);
  dire();

  if (lancerLaBoutique) {
    dire(`${ANSI.gris}Démarrage de la boutique…${ANSI.fin}\n`);
    // Un processus séparé, et surtout démarré MAINTENANT : la boutique lit
    // .env au démarrage, donc la lancer avant d'avoir l'adresse lui en aurait
    // fait lire une vide, et Telegram aurait refusé d'ouvrir la Mini App.
    const boutique = spawn(process.execPath, ['server/index.js'], {
      cwd: racine, stdio: 'inherit',
    });
    const arreter = () => { boutique.kill(); tunnel.kill(); process.exit(0); };
    process.on('SIGINT', arreter);
    process.on('SIGTERM', arreter);

    // Les deux vivent ou meurent ensemble.
    //
    // Sans ça, une boutique qui refuse de démarrer — un port déjà pris, par
    // exemple — laissait le tunnel ouvert sur du vide : l'adresse répondait,
    // mais sur rien. On croyait à un problème de tunnel, et on cherchait du
    // mauvais côté pendant que la vraie erreur avait défilé plus haut.
    boutique.on('exit', (code) => {
      if (code === 0) return;
      dire();
      dire(`${ANSI.jaune}La boutique s'est arrêtée (code ${code}).${ANSI.fin}`);
      dire(`${ANSI.gris}La raison est écrite juste au-dessus. Le tunnel se ferme`);
      dire(`avec elle : le laisser ouvert donnerait une adresse qui ne mène`);
      dire(`nulle part.${ANSI.fin}`);
      dire();
      tunnel.kill();
      process.exit(code ?? 1);
    });
  }
};

tunnel.stderr.on('data', guetter);
tunnel.stdout.on('data', guetter);

tunnel.on('error', (err) => {
  dire(`${ANSI.jaune}Le tunnel n'a pas pu démarrer : ${err.message}${ANSI.fin}`);
  process.exit(1);
});

tunnel.on('exit', (code) => {
  if (trouvee) {
    // Le tunnel avait donné son adresse, puis s'est arrêté. C'est l'erreur
    // 1033 côté visiteur : Cloudflare connaît l'adresse mais ne joint plus
    // personne derrière. Rien à réparer, il faut relancer — et l'adresse
    // sera différente, un tunnel rapide en tire une neuve à chaque fois.
    dire();
    dire(`${ANSI.jaune}Le tunnel s'est fermé (code ${code}).${ANSI.fin}`);
    dire(`${ANSI.gris}L'ancienne adresse ne répond plus : un visiteur y voit`);
    dire(`« Error 1033 ». Relance la commande — la nouvelle adresse sera`);
    dire(`différente, c'est le propre d'un tunnel rapide.`);
    dire();
    dire(`Pour une adresse qui ne change pas : un tunnel nommé ou Caddy,`);
    dire(`voir docs/vps.md.${ANSI.fin}`);
    process.exit(code ?? 0);
  }
  if (!trouvee) {
    dire(`${ANSI.jaune}Le tunnel s'est arrêté sans donner d'adresse (code ${code}).${ANSI.fin}`);
    dire(`${ANSI.gris}Relance la commande ; si ça recommence, c'est en général un pare-feu`);
    dire(`ou un réseau d'entreprise qui bloque Cloudflare.${ANSI.fin}`);
  }
  process.exit(code ?? 0);
});
