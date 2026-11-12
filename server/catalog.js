import { createStore } from './store.js';
import { products as seedProducts, categories as seedCategories } from './data/products.js';

/**
 * Catalogue modifiable depuis l'espace admin.
 *
 * Au premier démarrage, `data/catalog.json` est créé à partir du catalogue
 * d'exemple de `data/products.js`. Ensuite, c'est le fichier JSON qui fait foi :
 * le module d'exemple ne sert plus que de graine.
 */
const store = createStore('catalog.json', () => {
  // Les produits d'exemple reçoivent tous la date d'installation : le tri
  // « nouveautés » les laisse donc dans l'ordre du catalogue, et le premier
  // produit que le vendeur ajoute passe naturellement devant.
  const installe = new Date().toISOString();
  return {
    products: structuredClone(seedProducts).map((p) => ({ visible: true, createdAt: installe, ...p })),
    categories: structuredClone(seedCategories),
  };
});

/* ── Lecture ─────────────────────────────────────────────── */

export async function getCatalog({ includeHidden = false } = {}) {
  const data = await store.read();
  const products = includeHidden ? data.products : data.products.filter((p) => p.visible !== false);
  return { products, categories: data.categories, farms: data.farms ?? [] };
}

export async function getProduct(id, { includeHidden = true } = {}) {
  const data = await store.read();
  const product = data.products.find((p) => p.id === id);
  if (!product) return null;
  if (!includeHidden && product.visible === false) return null;
  return product;
}

/** Stock disponible pour un produit, ou pour une de ses variantes. */
export function stockOf(product, variantId = null) {
  if (product.variants?.length) {
    const variant = product.variants.find((v) => v.id === variantId);
    return variant ? Number(variant.stock ?? 0) : 0;
  }
  return Number(product.stock ?? 0);
}

/** Prix effectif d'un produit pour une variante donnée. */
/**
 * Le prix payé : celui du format, moins la promo du produit.
 *
 * Le même calcul que la boutique (`webapp/js/panier.js`, `apresRemise`) : le
 * client voit 10,80 €, la commande enregistre 10,80 €. Les prix enregistrés
 * restent les prix pleins.
 */
export function priceOf(product, variantId = null) {
  const variant = product.variants?.find((v) => v.id === variantId);
  const plein = variant ? variant.price : product.price;
  const remise = Number(product.remise) || 0;
  return remise > 0 ? Math.round((plein * (100 - remise)) / 100) : plein;
}

/* ── Écriture : produits ─────────────────────────────────── */

export async function createProduct(input) {
  return store.update((data) => {
    const product = normalizeProduct(input);
    if (data.products.some((p) => p.id === product.id)) {
      throw new HttpError(409, `L'identifiant « ${product.id} » est déjà utilisé.`);
    }
    data.products.push(product);
    return product;
  });
}

/**
 * Duplique une fiche produit.
 *
 * Le vendeur saisit vingt variétés qui ne diffèrent que par le nom et la
 * photo : mêmes formats, mêmes prix, même structure de description, mêmes
 * caractéristiques. Tout retaper à chaque fois, c'est une demi-heure par
 * produit et une faute de frappe sur le troisième.
 *
 * Trois choses ne se copient JAMAIS, et ce sont elles qui rendent la copie
 * sûre :
 *
 * - **le stock**, remis à zéro sur la fiche et sur chaque format. Un stock
 *   copié, c'est de la marchandise annoncée qui n'existe pas, et un client
 *   qui commande ce qu'on ne peut pas lui remettre.
 * - **la visibilité** : la copie naît masquée. Elle n'est ni au catalogue,
 *   ni annoncée, tant que le vendeur ne l'a pas relue. C'est ce qui permet
 *   de dupliquer vingt fois de suite sans rien montrer d'à moitié fait.
 * - **la date d'entrée**, qui redevient aujourd'hui : sinon la copie
 *   arriverait au milieu des « nouveautés » avec l'ancienneté de l'original.
 *
 * Les photos, elles, suivent. Deux fiches peuvent montrer la même image le
 * temps que le vendeur remplace celle de la copie — c'est réparable d'un
 * geste, alors qu'une galerie à refaire est une galerie qu'on ne refait pas.
 */
export async function duplicateProduct(id, { name, id: nouvelId } = {}) {
  return store.update((data) => {
    const source = data.products.find((p) => p.id === id);
    if (!source) throw new HttpError(404, 'Produit introuvable.');

    const nom = String(name ?? '').trim();
    if (!nom) throw new HttpError(400, 'La copie a besoin de son propre nom.');

    const copie = normalizeProduct({
      ...source,
      // L'identifiant se déduit du nouveau nom, et ne bougera plus : il sert
      // de clé dans les commandes déjà passées. Le demander maintenant évite
      // une fiche qui gardera « -copie » dans son adresse pour toujours.
      id: nouvelId || slug(nom),
      name: nom,
      createdAt: new Date().toISOString(),
      stock: 0,
      variants: source.variants?.map((v) => ({ ...v, stock: 0 })) ?? null,
      visible: false,
    });

    if (data.products.some((p) => p.id === copie.id)) {
      throw new HttpError(409, `Un produit porte déjà l'identifiant « ${copie.id} ».`);
    }
    data.products.push(copie);
    return copie;
  });
}

export async function updateProduct(id, patch) {
  return store.update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Produit introuvable.');
    // L'identifiant sert de clé dans les commandes déjà passées : il ne bouge pas.
    const merged = normalizeProduct({ ...data.products[index], ...patch, id });
    data.products[index] = merged;
    return merged;
  });
}

/**
 * Rattache une photo envoyée au bot à un produit.
 *
 * On enregistre la référence du fichier chez Telegram, pas le fichier : rien
 * à écrire sur le disque (impossible en serverless), rien à sauvegarder, et
 * la photo suit la boutique si elle change d'hébergeur. Le paramètre `v`
 * force les navigateurs à recharger l'image après un changement.
 */
export async function setProductPhoto(id, fileId) {
  return store.update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Produit introuvable.');

    data.products[index] = normalizeProduct({
      ...data.products[index],
      id,
      photoFileId: fileId,
      image: `/api/photo/${id}?v=${Date.now().toString(36)}`,
    });
    return data.products[index];
  });
}

/**
 * Ajoute un média à la galerie d'un produit.
 *
 * La première photo ajoutée sert aussi de vignette si le produit n'en avait
 * pas : sans ça, le vendeur envoie sa photo, voit la fiche s'enrichir, et se
 * demande pourquoi la grille montre encore un dessin.
 */
export async function addProductMedia(id, media) {
  return store.update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Produit introuvable.');

    const produit = data.products[index];
    const avant = produit.media ?? [];

    // Deux raisons de ne rien ajouter, et deux messages : « galerie pleine »
    // sur une adresse refusée enverrait chercher au mauvais endroit.
    if (!normalizeMedia([media]).length) {
      throw new HttpError(
        400,
        "Cette adresse n'est pas utilisable : il faut un chemin commençant par « / » " +
          'ou une adresse en « https:// ».'
      );
    }
    if (avant.length >= MEDIA_MAX) {
      throw new HttpError(400, `La galerie est pleine (${MEDIA_MAX} médias au maximum).`);
    }

    const galerie = normalizeMedia([...avant, media], produit.variants);

    const ajoute = galerie[galerie.length - 1];
    const suite = { ...produit, media: galerie };

    // Vignette reprise du premier média photo, tant que le vendeur n'en a pas
    // choisi une lui-même.
    const sansVignette = !produit.photoFileId && String(produit.image ?? '').startsWith('/assets/');
    if (sansVignette && ajoute.kind === 'photo') {
      if (ajoute.fileId) {
        suite.photoFileId = ajoute.fileId;
        suite.image = `/api/photo/${id}?v=${Date.now().toString(36)}`;
      } else {
        suite.image = ajoute.url;
      }
    }

    data.products[index] = normalizeProduct({ ...suite, id });
    return data.products[index];
  });
}

/**
 * Note la vignette d'une vidéo déjà en galerie.
 *
 * Pour les vidéos ajoutées avant que la boutique ne pense à la garder : sans
 * elle, la carte reste vide le temps que la vidéo arrive.
 */
export async function setProductMediaThumb(id, position, thumbFileId) {
  return store.update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Produit introuvable.');

    const galerie = [...(data.products[index].media ?? [])];
    const rang = Number(position);
    if (!Number.isInteger(rang) || rang < 0 || rang >= galerie.length) {
      throw new HttpError(400, "Ce média n'existe pas.");
    }
    galerie[rang] = { ...galerie[rang], thumbFileId };

    data.products[index] = normalizeProduct({ ...data.products[index], id, media: galerie });
    return data.products[index];
  });
}

/** Retire le média à cette position. */
export async function removeProductMedia(id, position) {
  return store.update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Produit introuvable.');

    const galerie = [...(data.products[index].media ?? [])];
    const rang = Number(position);
    if (!Number.isInteger(rang) || rang < 0 || rang >= galerie.length) {
      throw new HttpError(400, 'Ce média n\'existe pas.');
    }
    galerie.splice(rang, 1);

    data.products[index] = normalizeProduct({ ...data.products[index], id, media: galerie });
    return data.products[index];
  });
}

/**
 * Range le catalogue dans l'ordre voulu par le vendeur.
 *
 * C'est cet ordre-là que voit le client : le tri « par défaut » de la
 * boutique suit le tableau, en repoussant seulement les articles épuisés en
 * fin de liste. Mettre un produit en avant, c'est donc le remonter ici.
 *
 * On exige la liste ENTIÈRE, et on vérifie que c'est une permutation exacte
 * de ce qui existe : ni ajout, ni perte, ni doublon. Accepter une liste
 * partielle paraît plus commode — « monte celui-ci » — mais deux vendeurs
 * qui réordonnent en même temps, ou un écran resté ouvert sur un catalogue
 * d'avant-hier, feraient alors disparaître les produits que leur liste ne
 * nomme pas. Une permutation ne peut rien perdre.
 *
 * Le refus nomme ce qui cloche : un identifiant inconnu et un identifiant
 * manquant ne se corrigent pas de la même façon.
 */
export async function reordonnerProduits(ids) {
  if (!Array.isArray(ids)) throw new HttpError(400, "L'ordre attendu est une liste d'identifiants.");

  return store.update((data) => {
    const voulus = ids.map(String);
    const connus = new Set(data.products.map((p) => p.id));

    if (new Set(voulus).size !== voulus.length) {
      throw new HttpError(400, 'Un même produit est nommé deux fois dans cet ordre.');
    }
    const inconnus = voulus.filter((id) => !connus.has(id));
    if (inconnus.length) {
      throw new HttpError(400, `Produit inconnu dans cet ordre : ${inconnus.join(', ')}.`);
    }
    if (voulus.length !== data.products.length) {
      const manquants = [...connus].filter((id) => !voulus.includes(id));
      throw new HttpError(
        400,
        `Il manque ${manquants.length} produit(s) dans cet ordre : ${manquants.slice(0, 5).join(', ')}.`
      );
    }

    const parId = new Map(data.products.map((p) => [p.id, p]));
    data.products = voulus.map((id) => parId.get(id));
    return data.products.map((p) => p.id);
  });
}

export async function deleteProduct(id) {
  return store.update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Produit introuvable.');
    return data.products.splice(index, 1)[0];
  });
}

/** Fixe le stock d'un produit ou d'une variante à une valeur absolue. */
export async function setStock(id, variantId, quantity) {
  const value = Math.max(0, Math.floor(Number(quantity)));
  if (!Number.isFinite(value)) throw new HttpError(400, 'Quantité invalide.');

  return store.update((data) => {
    const product = data.products.find((p) => p.id === id);
    if (!product) throw new HttpError(404, 'Produit introuvable.');

    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (!variant) throw new HttpError(404, 'Variante introuvable.');
      variant.stock = value;
    } else {
      if (product.variants?.length) {
        throw new HttpError(400, 'Ce produit a des variantes : précise laquelle.');
      }
      product.stock = value;
    }
    return product;
  });
}

/**
 * Décrémente le stock pour les lignes d'une commande, en tout ou rien.
 *
 * La vérification et l'écriture se font dans la même mutation : deux commandes
 * simultanées ne peuvent pas passer toutes les deux sur le dernier article.
 */
export async function reserveStock(lines) {
  return store.update((data) => {
    const insufficient = [];

    for (const line of lines) {
      const product = data.products.find((p) => p.id === line.id);
      if (!product) throw new HttpError(400, `Produit inconnu : ${line.id}`);
      const available = stockOf(product, line.variantId);
      if (available < line.quantity) {
        insufficient.push({ name: product.name, variantId: line.variantId, available });
      }
    }

    if (insufficient.length) {
      const details = insufficient
        .map((i) => `${i.name} (reste ${i.available})`)
        .join(', ');
      throw new HttpError(409, `Stock insuffisant : ${details}`);
    }

    // On renvoie ce qui reste après coup : c'est l'appelant qui décide
    // d'alerter, la couche catalogue ne connaît pas Telegram.
    const remaining = [];
    for (const line of lines) {
      const product = data.products.find((p) => p.id === line.id);
      if (product.variants?.length) {
        const variant = product.variants.find((v) => v.id === line.variantId);
        variant.stock = Number(variant.stock ?? 0) - line.quantity;
        remaining.push({ id: product.id, name: product.name, variantLabel: variant.label, left: variant.stock });
      } else {
        product.stock = Number(product.stock ?? 0) - line.quantity;
        remaining.push({ id: product.id, name: product.name, variantLabel: null, left: product.stock });
      }
    }
    return remaining;
  });
}

/** Remet le stock en place (annulation d'une commande). */
export async function restoreStock(lines) {
  return store.update((data) => {
    for (const line of lines) {
      const product = data.products.find((p) => p.id === line.id);
      if (!product) continue;
      if (product.variants?.length) {
        const variant = product.variants.find((v) => v.id === line.variantId);
        if (variant) variant.stock = Number(variant.stock ?? 0) + line.quantity;
      } else {
        product.stock = Number(product.stock ?? 0) + line.quantity;
      }
    }
    return true;
  });
}

/**
 * Remplace tout le catalogue d'un coup.
 *
 * Réservé à la restauration d'une sauvegarde : chaque produit repasse par la
 * normalisation, si bien qu'un fichier trafiqué ne peut pas glisser un prix
 * négatif ou un champ inattendu dans la boutique.
 */
export async function replaceCatalog({ products, categories, farms }) {
  if (!Array.isArray(products)) throw new HttpError(400, 'Catalogue invalide.');

  const propres = products.map((p) => normalizeProduct(p));
  const vus = new Set();
  for (const p of propres) {
    if (vus.has(p.id)) throw new HttpError(400, `Deux produits portent l'identifiant « ${p.id} ».`);
    vus.add(p.id);
  }

  return store.update((data) => {
    data.products = propres;
    if (Array.isArray(categories) && categories.length) {
      data.categories = categories.map((c) => ({
        id: slug(c.id ?? c.label),
        label: String(c.label ?? '').slice(0, 40),
        emoji: emojiDe(c.emoji),
      }));
    }
    if (Array.isArray(farms)) data.farms = farms.map((f) => normalizeFarm(f)).filter(Boolean);
    return { products: data.products.length, categories: data.categories.length };
  });
}

/**
 * L'icône d'une catégorie : un emoji, ou deux drapeaux côte à côte
 * (« 🇳🇱🇲🇦 »). Comptée en caractères et non en unités de code : un drapeau
 * en prend quatre, et la coupe d'avant, à quatre unités, n'en gardait qu'un —
 * ou en coupait un en deux.
 */
function emojiDe(valeur) {
  const texte = Array.from(String(valeur ?? '•').trim()).slice(0, 8).join('');
  return texte || '•';
}

/* ── Écriture : catégories ───────────────────────────────── */

export async function saveCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new HttpError(400, 'Il faut au moins une catégorie.');
  }
  return store.update((data) => {
    // Deux catégories de même nom donnent le même identifiant : les produits
    // de l'une se retrouveraient rangés dans l'autre, et le filtre afficherait
    // deux onglets qui montrent la même chose. On garde la première.
    const vus = new Set();
    const propres = [];
    for (const c of categories) {
      const label = String(c.label ?? '').trim().slice(0, 40);
      const id = slug(c.id ?? label);
      if (!id || !label || vus.has(id)) continue;
      vus.add(id);
      propres.push({ id, label, emoji: emojiDe(c.emoji) });
    }
    if (!propres.length) throw new HttpError(400, 'Il faut au moins une catégorie nommée.');

    data.categories = propres;
    return data.categories;
  });
}

/* ── Écriture : les farms ────────────────────────────────── */

/**
 * Une farm : un producteur, avec son nom et son logo.
 *
 * Le logo envoyé par l'admin part chez Telegram, comme les photos de
 * produits : on garde sa référence (`logoFileId`, qui ne sort jamais du
 * serveur) et l'adresse par laquelle la boutique le demande (`logo`). Un
 * logo peut aussi être une simple adresse, collée à la main.
 */
function normalizeFarm(f, avant = null) {
  const label = String(f?.label ?? '').trim().slice(0, 40);
  const id = slug(f?.id ?? label);
  if (!id || !label) return null;
  const adresse = String(f?.logo ?? '').trim().slice(0, 300);
  const logoFileId = f?.logoFileId ?? avant?.logoFileId;
  return {
    id,
    label,
    logo: adresse || avant?.logo || undefined,
    logoFileId: logoFileId ? String(logoFileId).slice(0, 200) : undefined,
  };
}

/**
 * Remplace la liste des farms. Une farm qui garde son identifiant garde son
 * logo : l'écran d'admin n'a pas à renvoyer ce qu'il n'a pas touché. La liste
 * peut être vide — une boutique peut se passer de farms.
 */
export async function saveFarms(farms) {
  if (!Array.isArray(farms)) throw new HttpError(400, 'Liste de farms invalide.');
  if (farms.length > 60) throw new HttpError(400, 'Pas plus de 60 farms.');
  return store.update((data) => {
    const avant = new Map((data.farms ?? []).map((f) => [f.id, f]));
    const vus = new Set();
    const propres = [];
    for (const brute of farms) {
      const id = slug(brute?.id ?? brute?.label ?? '');
      const farm = normalizeFarm(brute, avant.get(id));
      if (!farm || vus.has(farm.id)) continue;
      vus.add(farm.id);
      propres.push(farm);
    }
    data.farms = propres;
    return data.farms;
  });
}

/** Rattache un logo envoyé à Telegram à une farm. */
export async function setFarmLogo(id, fileId) {
  return store.update((data) => {
    const farm = (data.farms ?? []).find((f) => f.id === id);
    if (!farm) throw new HttpError(404, 'Farm introuvable.');
    farm.logoFileId = fileId;
    farm.logo = `/api/farm-logo/${id}?v=${Date.now().toString(36)}`;
    return farm;
  });
}

export async function getFarm(id) {
  const data = await store.read();
  return (data.farms ?? []).find((f) => f.id === id) ?? null;
}

/* ── Validation ──────────────────────────────────────────── */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Un montant en centimes, ou rien.
 *
 * `Number(null)` et `Number('')` valent zéro : sans ce filtre, un champ prix
 * resté vide créait un produit à 0 €, que n'importe qui pouvait alors
 * commander gratuitement. Un zéro délibérément saisi, lui, reste accepté.
 */
function montant(value, message) {
  const fourni =
    typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
  const cents = fourni ? Math.round(Number(value)) : NaN;
  if (!Number.isFinite(cents) || cents < 0) throw new HttpError(400, message);
  return cents;
}

/** Un pourcentage de remise entier entre 1 et 90, ou rien. */
function remiseDe(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return undefined;
  const n = Math.round(Number(valeur));
  if (!Number.isFinite(n) || n < 0 || n > 90) {
    throw new HttpError(400, 'La promo est un pourcentage entre 0 et 90.');
  }
  return n || undefined;
}

function normalizeProduct(input) {
  const name = String(input.name ?? '').trim();
  if (!name) throw new HttpError(400, 'Le nom est obligatoire.');

  const id = slug(input.id || name);
  if (!id) throw new HttpError(400, "L'identifiant est invalide.");

  const price = montant(input.price, 'Prix invalide.');

  const variants = Array.isArray(input.variants) && input.variants.length
    ? input.variants.map((v) => {
        const label = String(v.label ?? '').trim();
        if (!label) throw new HttpError(400, 'Chaque format doit avoir un libellé.');
        const vPrice = montant(v.price, `Prix invalide pour le format « ${label} ».`);
        return {
          id: slug(v.id || label),
          label,
          price: vPrice,
          stock: Math.max(0, Math.floor(Number(v.stock ?? 0))),
        };
      })
    : null;

  return {
    id,
    // Date d'entrée au catalogue, posée une fois puis conservée : sans elle,
    // « nouveautés » ne voudrait rien dire. Un produit déjà présent avant
    // cette version prend la date du jour où on le touche, faute de mieux.
    createdAt: input.createdAt ?? new Date().toISOString(),
    name: name.slice(0, 60),
    category: slug(input.category ?? 'all') || 'all',
    // Sans variante, le prix de la fiche fait foi ; avec variantes, on affiche
    // le prix du format le moins cher comme prix d'appel.
    price: variants ? Math.min(...variants.map((v) => v.price)) : price,
    stock: variants ? null : Math.max(0, Math.floor(Number(input.stock ?? 0))),
    image: String(input.image ?? '/assets/products/box.svg').slice(0, 300),
    // Photo envoyée au bot : on garde la référence Telegram, pas le fichier.
    photoFileId: input.photoFileId ? String(input.photoFileId).slice(0, 200) : undefined,
    // Galerie de la fiche produit : photos et vidéos mêlées, dans l'ordre où
    // le vendeur les a mises. La première photo sert aussi de vignette.
    media: normalizeMedia(input.media, variants),
    badge: input.badge ? String(input.badge).slice(0, 20) : undefined,
    // La farm qui produit ce qu'on vend : son identifiant, ou rien.
    farm: input.farm ? slug(input.farm) || undefined : undefined,
    // La promo, en pourcentage entier, appliquée à tous les formats. Les
    // prix enregistrés restent les prix pleins : c'est la boutique qui
    // affiche l'ancien barré et le nouveau, et retirer la promo ne demande
    // de retoucher aucun prix. Bornée à 90 : au-delà, c'est une faute de
    // frappe, pas une promo.
    remise: remiseDe(input.remise),
    tags: Array.isArray(input.tags) ? input.tags.slice(0, 6).map((t) => String(t).slice(0, 24)) : [],
    // Les caractéristiques, une par ligne sur la fiche. Elles ne remplacent
    // pas la description : celle-ci raconte, celles-là se lisent en diagonale.
    // Un client qui compare deux variétés lit six points, pas deux paragraphes.
    // Bornées en nombre et en longueur — une liste à rallonge redevient un
    // paragraphe, mal composé.
    points: Array.isArray(input.points)
      ? input.points.map((t) => String(t).trim().slice(0, 80)).filter(Boolean).slice(0, 6)
      : [],
    short: String(input.short ?? '').slice(0, 140),
    description: String(input.description ?? '').slice(0, 2000),
    visible: input.visible !== false,
    variants,
  };
}

/** Ce qu'une galerie de produit peut contenir. */
export const MEDIA_MAX = 8;

/**
 * Range la galerie d'un produit.
 *
 * Deux origines possibles pour un média : une référence Telegram, quand le
 * vendeur a envoyé la photo ou la vidéo au bot, et une adresse, quand il
 * héberge ses visuels ailleurs. Les deux cohabitent dans la même liste, parce
 * que du point de vue du client ce sont les mêmes vignettes à faire défiler.
 *
 * Le nombre est borné : une fiche produit n'est pas un album, et chaque média
 * est une requête de plus à servir sur un VPS modeste.
 *
 * Un média peut être rattaché à un format (`variantId`). C'est ce qui permet à
 * la fiche de montrer la bonne photo quand le client choisit sa variété : sans
 * ce lien, une galerie de cinq photos oblige à deviner laquelle correspond au
 * format sélectionné, et autant vendre sans photo.
 */
export function normalizeMedia(input, variantes = []) {
  // Les identifiants de format connus : un média rattaché à un format qui
  // n'existe plus doit redevenir un média de la galerie générale, pas pointer
  // dans le vide.
  const formats = new Set((variantes ?? []).map((v) => String(v.id)));
  if (!Array.isArray(input)) return [];

  const propres = [];
  for (const brut of input.slice(0, MEDIA_MAX * 2)) {
    if (!brut) continue;
    // Trois natures, et une seule liste blanche : ce qui n'est pas reconnu
    // retombe sur la photo, qui est la seule à s'afficher sans rien jouer.
    const kind = brut.kind === 'video' ? 'video' : brut.kind === 'gif' ? 'gif' : 'photo';
    const fileId = brut.fileId ? String(brut.fileId).slice(0, 200) : '';
    const url = brut.url ? String(brut.url).trim().slice(0, 300) : '';

    // Sans l'un ou l'autre, le média ne désigne rien : on l'écarte plutôt que
    // de laisser une vignette vide dans la fiche.
    if (!fileId && !url) continue;

    // Une adresse doit rester une adresse : `javascript:` dans un `src`
    // s'exécuterait, et un chemin qui remonte l'arborescence n'a rien à faire
    // là. On n'accepte que le relatif à la racine et le HTTPS.
    if (url && !/^\/[^/]/.test(url) && !/^https:\/\//i.test(url)) continue;
    if (url.includes('..')) continue;

    const media = { kind };
    if (fileId) media.fileId = fileId;
    if (url) media.url = url;
    // La vignette d'une vidéo : une petite image que Telegram fabrique
    // lui-même, affichée en attendant que la vidéo arrive.
    if (brut.thumbFileId) media.thumbFileId = String(brut.thumbFileId).slice(0, 200);
    if (brut.legende) media.legende = String(brut.legende).slice(0, 80);
    if (brut.variantId && formats.has(String(brut.variantId))) {
      media.variantId = String(brut.variantId);
    }
    propres.push(media);

    if (propres.length >= MEDIA_MAX) break;
  }
  return propres;
}

/** Transforme un texte libre en identifiant utilisable dans une URL. */
function slug(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
