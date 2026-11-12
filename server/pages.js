/**
 * Les deux pages, servies avec une empreinte sur leurs fichiers.
 *
 * Le défaut qu'on ferme ici : `index.html` chargeait `/js/app.js` sans rien
 * qui change d'une version à l'autre. Un téléphone qui gardait l'ancien
 * fichier continuait donc de le lire — et le jour où un champ de l'API a été
 * renommé, ce fichier-là cherchait un champ qui n'existait plus. Le bouton
 * « Commander » retombait sur Telegram sans que rien ne le dise, et recharger
 * la page ne changeait rien puisque c'est le script qui était vieux, pas la
 * page.
 *
 * On colle donc une empreinte des fichiers dans leur adresse :
 * `/js/app.js?v=a1b2c3`. Le contenu change, l'adresse change, le cache ne
 * peut plus servir l'ancien. Le contenu ne change pas, l'adresse non plus, et
 * le cache fait son travail.
 *
 * L'empreinte est gardée, et refaite quand un fichier a bougé — quatre dates
 * de modification suffisent à le savoir, et c'est autrement moins cher que de
 * relire les fichiers à chaque visite. La calculer une fois au démarrage
 * aurait marché en production, où un déploiement redémarre le serveur ; mais
 * en développement on modifie un script et on rafraîchit sans redémarrer, et
 * la page aurait alors annoncé une version périmée — exactement le défaut
 * qu'on répare ici, reproduit par le remède.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/** Les fichiers dont le contenu décide de l'empreinte. */
const SUIVIS = ['js/app.js', 'js/admin.js', 'css/style.css', 'css/admin.css'];

/** Six caractères suffisent : on distingue des versions, on ne signe rien. */
export function empreinteDes(dossier, fichiers = SUIVIS) {
  const somme = crypto.createHash('sha256');
  for (const relatif of fichiers) {
    try {
      somme.update(fs.readFileSync(path.join(dossier, relatif)));
    } catch {
      // Un fichier absent n'empêche pas de servir la page : il fera juste
      // partie de l'empreinte par son absence.
      somme.update(`absent:${relatif}`);
    }
  }
  return somme.digest('hex').slice(0, 8);
}

/**
 * Pose l'empreinte sur les adresses locales de scripts et de styles.
 *
 * Seulement celles qui commencent par `/` : une feuille de style venue d'un
 * autre domaine ne nous appartient pas, et lui coller notre empreinte ne
 * ferait que casser son propre cache.
 */
export function versionner(html, empreinte) {
  return html
    .replace(/(<script[^>]+src=")(\/[^"?]+)(")/g, `$1$2?v=${empreinte}$3`)
    .replace(/(<link[^>]+href=")(\/[^"?]+\.css)(")/g, `$1$2?v=${empreinte}$3`);
}

/**
 * Un servant pour une page, monté AVANT `express.static`.
 *
 * La page elle-même n'est jamais mise en cache — c'est elle qui porte les
 * adresses versionnées, et une page en cache annoncerait l'ancienne version
 * des scripts. Les scripts, eux, peuvent être gardés longtemps : leur adresse
 * change quand leur contenu change.
 */
export function servirLaPage(dossier, fichier) {
  let signature = null;   // les dates de modification, la dernière fois
  let html = null;

  /** Ce qui dit qu'un fichier a bougé, sans le relire. */
  const dates = () =>
    [fichier, ...SUIVIS]
      .map((relatif) => {
        try {
          return String(fs.statSync(path.join(dossier, relatif)).mtimeMs);
        } catch {
          return 'absent';
        }
      })
      .join('|');

  return (req, res, next) => {
    try {
      const maintenant = dates();
      if (html === null || maintenant !== signature) {
        signature = maintenant;
        html = versionner(
          fs.readFileSync(path.join(dossier, fichier), 'utf8'),
          empreinteDes(dossier)
        );
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      return next(err);
    }
  };
}
