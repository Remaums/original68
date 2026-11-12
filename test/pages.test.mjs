/**
 * Les pages portent une empreinte sur leurs scripts.
 *
 * Le défaut que cette suite fige, et il a coûté une fausse panne : la page
 * chargeait `/js/app.js` sans rien qui change d'une version à l'autre. Un
 * téléphone qui gardait l'ancien fichier continuait de le lire, et le jour où
 * un champ de l'API a été renommé, ce fichier-là cherchait un champ disparu.
 * Le bouton « Commander » retombait sur Telegram sans que rien ne le dise, et
 * recharger la page n'y changeait rien — c'est le script qui était vieux, pas
 * la page.
 *
 * Deux choses à tenir, et la seconde compte autant que la première :
 *   — l'empreinte SUIT le contenu : elle change quand un fichier change, et
 *     ne change pas quand rien ne bouge (sinon le cache ne sert plus à rien) ;
 *   — la PAGE, elle, n'est jamais mise en cache : c'est elle qui porte les
 *     adresses versionnées, et une page en cache annoncerait l'ancienne.
 *
 * Prérequis : serveur démarré.
 * Usage :  node test/pages.test.mjs
 */
import 'dotenv/config';   // sans ça, PORT reste à 3000 sous `npm test`
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { empreinteDes, versionner } from '../server/pages.js';

const BASE = process.env.TEST_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const WEBAPP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'webapp');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

console.log('\n── L empreinte suit le contenu ─────────────────────');

const a = empreinteDes(WEBAPP);
check('Elle est courte et lisible', /^[0-9a-f]{8}$/.test(a), a);
check('Deux lectures de suite donnent la même', empreinteDes(WEBAPP) === a);
// Un fichier de plus, c'est un contenu de plus : l'empreinte doit bouger.
check('Un fichier différent donne une autre empreinte',
  empreinteDes(WEBAPP, ['js/app.js']) !== a);
check("Et un fichier absent ne la fait pas planter",
  /^[0-9a-f]{8}$/.test(empreinteDes(WEBAPP, ['js/nexistepas.js'])));

console.log('\n── Ce qui est versionné, et ce qui ne l est pas ────');

const html = versionner(
  '<link rel="stylesheet" href="/css/style.css">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com">' +
  '<script src="https://telegram.org/js/telegram-web-app.js"></script>' +
  '<script src="/js/app.js" type="module"></script>',
  'abcd1234'
);
check('Le style local est versionné', html.includes('/css/style.css?v=abcd1234'));
check('Le script local aussi', html.includes('/js/app.js?v=abcd1234'));
// Coller notre empreinte sur un fichier qui n'est pas à nous ne ferait que
// casser SON cache, sans rien nous apporter.
check("Le script de Telegram est laissé tranquille",
  html.includes('telegram.org/js/telegram-web-app.js"') &&
  !/telegram-web-app\.js\?v=/.test(html));
check('Et une adresse qui n est pas un script ou un style non plus',
  html.includes('fonts.gstatic.com">'), '');

console.log('\n── Ce que le serveur sert vraiment ─────────────────');

for (const [nom, chemin, script] of [
  ['la boutique', '/', '/js/app.js'],
  ['le panneau', '/admin.html', '/js/admin.js'],
]) {
  const r = await fetch(`${BASE}${chemin}`);
  const page = await r.text();
  check(`${nom} répond`, r.ok, `HTTP ${r.status}`);
  const trouve = page.match(new RegExp(`${script.replace('/', '\\/')}\\?v=([0-9a-f]{8})`));
  check(`${nom} sert son script versionné`, Boolean(trouve), trouve?.[0] ?? 'sans version');
  check(`${nom} sert la version en cours`, trouve?.[1] === a, `${trouve?.[1]} / ${a}`);
  // La page ne doit pas être gardée : c'est elle qui porte les versions.
  const cache = r.headers.get('cache-control') ?? '';
  check(`${nom} n est pas mise en cache`, /no-cache|no-store/.test(cache), cache || '(aucun en-tête)');
}

// Le fichier reste servi sans la version, pour qui l'appelle directement :
// on ajoute une adresse, on n'en retire pas.
const brut = await fetch(`${BASE}/js/app.js`);
check('Le script reste joignable sans version', brut.ok, `HTTP ${brut.status}`);
const versionne = await fetch(`${BASE}/js/app.js?v=${a}`);
check('Et avec la version, il rend la même chose',
  versionne.ok && (await versionne.text()) === (await brut.text()), `HTTP ${versionne.status}`);

console.log(`\nPages versionnées : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
