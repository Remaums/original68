/* ══════════════════════════════════════════════════════════════
   Le panier, et les prix remisés.

   Aucune dépendance à la page : tout ce qui décide (ce qu'on peut
   ajouter, combien, à quel prix, ce que dit le récapitulatif) est ici,
   et se teste sans navigateur. `app.js` ne fait que l'afficher.

   Le panier vit dans le téléphone du client et nulle part ailleurs :
   la commande se passe sur Snapchat, l'application ne la reçoit pas.
   Il ne réserve donc rien — le stock affiché est celui du serveur, et
   le panier ne fait que ne pas le dépasser.
   ══════════════════════════════════════════════════════════════ */

export const PANIER_CLEF = 'o68.panier.v1';

/** Par ligne : au-delà, c'est un doigt resté appuyé, pas une commande. */
export const QTE_MAX = 20;

/** Un prix après la promo du produit, arrondi au centime. */
export function apresRemise(cents, remise) {
  const r = Number(remise) || 0;
  return r > 0 ? Math.round((cents * (100 - r)) / 100) : cents;
}

/**
 * Le prix d'un format : celui qu'on paie, et l'ancien quand il y a promo.
 * Sans format (produit simple), c'est le prix du produit.
 */
export function prixDuFormat(produit, variantId) {
  const variante = produit?.variants?.find((v) => v.id === variantId);
  const base = variante?.price ?? produit?.price ?? 0;
  const remise = Number(produit?.remise) || 0;
  return { prix: apresRemise(base, remise), avant: remise > 0 ? base : null };
}

/** Ce qu'il reste en stock pour ce format, ou pour le produit simple. */
export function stockDe(produit, variantId) {
  if (produit?.variants?.length) {
    const variante = produit.variants.find((v) => v.id === variantId);
    return Math.max(0, Number(variante?.stock ?? 0));
  }
  return Math.max(0, Number(produit?.stock ?? 0));
}

/**
 * Le prix d'appel d'une carte : le moins cher des formats encore en stock,
 * ou de tous s'ils sont tous épuisés. `plusieurs` dit s'il faut écrire
 * « dès » devant.
 */
export function prixDAppel(produit) {
  const formats = produit?.variants ?? [];
  if (!formats.length) return { ...prixDuFormat(produit, null), plusieurs: false };
  const dispo = formats.filter((v) => Number(v.stock ?? 0) > 0);
  const parmi = dispo.length ? dispo : formats;
  const moinsCher = parmi.reduce((a, b) => (b.price < a.price ? b : a));
  const prix = new Set(formats.map((v) => v.price));
  return { ...prixDuFormat(produit, moinsCher.id), plusieurs: prix.size > 1 };
}

/** Le format qu'on ajoute d'un appui : le seul, ou rien s'il faut choisir. */
export function formatParDefaut(produit) {
  const formats = produit?.variants ?? [];
  if (!formats.length) return { variantId: null, aChoisir: false };
  if (formats.length === 1) return { variantId: formats[0].id, aChoisir: false };
  return { variantId: null, aChoisir: true };
}

const memeLigne = (a, b) => a.id === b.id && (a.variantId ?? null) === (b.variantId ?? null);

/**
 * Remet un panier relu (du téléphone) d'accord avec le catalogue.
 *
 * Un produit retiré, un format supprimé, un stock qui a baissé depuis la
 * dernière visite : la ligne disparaît ou rétrécit, sans un mot. Garder une
 * ligne que la boutique ne peut plus servir ferait commander l'impossible.
 */
export function nettoyer(lignes, produits) {
  const parId = new Map((produits ?? []).map((p) => [p.id, p]));
  const propres = [];
  for (const brute of Array.isArray(lignes) ? lignes : []) {
    const produit = parId.get(brute?.id);
    if (!produit) continue;
    const variantId = brute.variantId ?? null;
    if (produit.variants?.length && !produit.variants.some((v) => v.id === variantId)) continue;
    if (!produit.variants?.length && variantId !== null) continue;
    const deja = propres.find((l) => memeLigne(l, { id: produit.id, variantId }));
    const voulu = Math.floor(Number(brute.qte) || 0) + (deja?.qte ?? 0);
    const qte = Math.min(voulu, QTE_MAX, stockDe(produit, variantId));
    if (deja) deja.qte = qte;
    else if (qte > 0) propres.push({ id: produit.id, variantId, qte });
  }
  return propres.filter((l) => l.qte > 0);
}

/**
 * Ajoute un article. Rend le nouveau panier et combien ont vraiment été
 * ajoutés : zéro quand le stock ou le plafond est déjà atteint, et l'écran
 * le dit plutôt que de faire semblant.
 */
export function ajouter(lignes, produit, variantId = null, qte = 1) {
  const panier = lignes.map((l) => ({ ...l }));
  const cible = { id: produit.id, variantId: variantId ?? null };
  const ligne = panier.find((l) => memeLigne(l, cible));
  const avant = ligne?.qte ?? 0;
  const plafond = Math.min(QTE_MAX, stockDe(produit, cible.variantId));
  const apres = Math.min(plafond, avant + Math.max(0, Math.floor(qte)));
  if (ligne) ligne.qte = apres;
  else if (apres > 0) panier.push({ ...cible, qte: apres });
  return { lignes: panier, ajoutes: apres - avant };
}

/** Change la quantité d'une ligne ; zéro la retire. */
export function changerQte(lignes, index, qte, produits) {
  const panier = lignes.map((l) => ({ ...l }));
  const ligne = panier[index];
  if (!ligne) return panier;
  const produit = (produits ?? []).find((p) => p.id === ligne.id);
  const plafond = produit ? Math.min(QTE_MAX, stockDe(produit, ligne.variantId)) : 0;
  ligne.qte = Math.max(0, Math.min(plafond, Math.floor(Number(qte) || 0)));
  return panier.filter((l) => l.qte > 0);
}

/** Le nombre d'articles, pour la pastille de l'onglet. */
export function nombreDArticles(lignes) {
  return (lignes ?? []).reduce((n, l) => n + l.qte, 0);
}

/**
 * Le panier chiffré, ligne par ligne, avec le total et ce que la promo
 * fait économiser. Les lignes dont le produit a disparu sont ignorées.
 */
export function detailler(lignes, produits) {
  const parId = new Map((produits ?? []).map((p) => [p.id, p]));
  const detail = [];
  for (const ligne of lignes ?? []) {
    const produit = parId.get(ligne.id);
    if (!produit) continue;
    const variante = produit.variants?.find((v) => v.id === ligne.variantId) ?? null;
    const { prix, avant } = prixDuFormat(produit, ligne.variantId);
    detail.push({
      produit, variante, qte: ligne.qte, prix, avant,
      total: prix * ligne.qte,
      economie: avant ? (avant - prix) * ligne.qte : 0,
    });
  }
  return {
    detail,
    total: detail.reduce((s, d) => s + d.total, 0),
    economie: detail.reduce((s, d) => s + d.economie, 0),
  };
}

/**
 * Le texte à envoyer au vendeur. Sobre et sans mise en forme : il sera
 * collé dans Snapchat, qui n'interprète rien.
 */
export function recapitulatif({ detail, total, economie }, { boutique, titre, totalMot, formatPrix }) {
  const lignes = detail.map((d) => {
    const format = d.variante ? ` (${d.variante.label})` : '';
    return `• ${d.qte} × ${d.produit.name}${format} — ${formatPrix(d.total)}`;
  });
  const fin = [`${totalMot} : ${formatPrix(total)}`];
  if (economie > 0) fin[0] += ` (−${formatPrix(economie)})`;
  return [`${titre} — ${boutique}`, '', ...lignes, '', ...fin].join('\n');
}

/** La plus forte promo du catalogue, pour le titre du bandeau. */
export function plusFortePromo(produits) {
  return (produits ?? []).reduce((m, p) => Math.max(m, Number(p.remise) || 0), 0);
}
