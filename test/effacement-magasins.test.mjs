/**
 * Aucun magasin ne doit échapper à l'effacement d'une personne.
 *
 * C'est la suite la plus importante des deux, et elle ne teste rien qui
 * tourne : elle lit le code. La raison tient en une phrase — **un effacement
 * partiel est pire que pas d'effacement du tout**, parce qu'il annonce que
 * c'est fait. Le vendeur répond « c'est effacé » à son client, et un numéro
 * de téléphone dort toujours dans un magasin ajouté six mois plus tard par
 * quelqu'un qui n'a jamais entendu parler de cette fonctionnalité.
 *
 * On compare donc la liste `MAGASINS` de `effacement.js` aux `createStore()`
 * que le serveur appelle vraiment. Un magasin qui apparaît sans y figurer
 * fait tomber cette suite, et celui qui l'a ajouté doit écrire ce qu'il
 * advient de son contenu quand quelqu'un demande à partir — même si la
 * réponse est « rien, il n'y a personne dedans ».
 *
 * Aucun serveur : on lit les fichiers.
 *
 * Usage :  node test/effacement-magasins.test.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAGASINS } from '../server/effacement.js';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK   ' : 'ÉCHEC'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

console.log('\n── Les magasins que le code ouvre vraiment ─────────');

const fichiers = (await fs.readdir(path.join(RACINE, 'server')))
  .filter((f) => f.endsWith('.js'));

const trouves = new Map();
for (const f of fichiers) {
  // `json-store.js` et `pg-store.js` DÉFINISSENT `createStore` : leur
  // signature n'est pas un appel, et l'y compter ferait tomber la suite sur
  // un magasin nommé « filename ».
  if (f === 'json-store.js' || f === 'pg-store.js') continue;
  const source = await fs.readFile(path.join(RACINE, 'server', f), 'utf8');
  for (const m of source.matchAll(/createStore\(\s*'([^']+)'/g)) {
    trouves.set(m[1], f);
  }
}

check('On a bien trouvé des magasins', trouves.size > 5, `${trouves.size} magasins`);
console.log(`   ${[...trouves.keys()].sort().join(', ')}`);

console.log('\n── Chacun est déclaré, et dit ce qu il devient ─────');

const declares = new Map(MAGASINS.map((m) => [m.fichier, m]));

const oublies = [...trouves.keys()].filter((f) => !declares.has(f));
check("Aucun magasin n'échappe à la liste", oublies.length === 0,
  oublies.length
    ? `${oublies.join(', ')} — ajoute-les à MAGASINS dans server/effacement.js en disant ` +
      "ce qu'il advient de leur contenu quand quelqu'un demande à partir"
    : 'tous déclarés');

// L'inverse compte aussi : un magasin déclaré qui n'existe plus laisse croire
// qu'on efface quelque chose qui n'est plus là.
const fantomes = [...declares.keys()].filter((f) => !trouves.has(f));
check('Et aucun déclaré ne manque à l appel', fantomes.length === 0,
  fantomes.join(', ') || 'aucun');

for (const m of MAGASINS) {
  const dit = m.personnel ? Boolean(m.quoi) : Boolean(m.pourquoi);
  if (!dit) check(`${m.fichier} dit ce qu'il contient`, false,
    m.personnel ? 'il manque `quoi`' : 'il manque `pourquoi`');
}
check('Chaque magasin dit ce qu il contient',
  MAGASINS.every((m) => (m.personnel ? Boolean(m.quoi) : Boolean(m.pourquoi))));

console.log('\n── Ce qui reste volontairement ─────────────────────');

// Le blocage n'est pas levé par un effacement : sinon l'effacement devient le
// moyen de se débloquer soi-même. Ce n'est pas un oubli, c'est un choix — et
// un choix doit être écrit quelque part, sans quoi on le « corrige » un jour.
const bloc = declares.get('settings.json');
check('Le blocage est déclaré comme gardé', Boolean(bloc?.garde), bloc?.garde ?? 'rien');

console.log(`\nMagasins couverts par l'effacement : ${failures ? `${failures} ÉCHEC(S)` : 'OK'}`);
process.exit(failures ? 1 : 0);
