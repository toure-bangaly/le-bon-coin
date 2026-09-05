# Le Bon Coin — Korhogo · Apsonic

Site web fonctionnel construit à partir de la maquette Claude Design
*« Le Bon Coin - Site v3 Modernist »*.

Site statique : HTML, CSS et JavaScript, sans build, sans dépendance.
Il s'ouvre tel quel et s'héberge n'importe où (Netlify, Vercel, GitHub Pages,
OVH, un simple dossier chez un hébergeur mutualisé…).

## Fichiers

```
index.html                  la page complète
assets/css/modernist.css    le design system (tokens + composants) — copie fidèle de la maquette
assets/css/site.css         la mise en page du site
assets/js/app.js            panier, questionnaire, newsletter, menu mobile
assets/img/                 les photos et le favicon
_handoff/                   le bundle d'origine exporté depuis Claude Design (référence)
```

`modernist.css` est la **source de vérité visuelle** : couleurs, typographie,
espacements, boutons, cartes, tags. Pour changer l'identité du site (une autre
couleur d'accent par exemple), c'est le seul fichier à toucher.

## Lancer en local

N'ouvrez pas `index.html` par double-clic : certains navigateurs bloquent les
scripts en `file://`. Servez le dossier en HTTP. Par exemple, avec Python :

```bash
python -m http.server 8000
```

Puis ouvrez <http://localhost:8000>.

## Mettre à jour le contenu

### Le numéro WhatsApp, le message par défaut, le domaine

En haut de `assets/js/app.js` :

```js
var CONFIG = {
  whatsapp: '0554320555',
  whatsappMessage: 'Bonjour Le Bon Coin, je suis intéressé par une moto vue sur votre site.',
  domain: 'leboncoin.com'
};
```

Le numéro est automatiquement mis au format international (`225…`) pour les
liens `wa.me`, et au format local (`05 54 32 05 55`) pour l'affichage.
Les liens marqués `data-wa` dans le HTML gardent une adresse `wa.me` correcte
même si le JavaScript ne se charge pas.

### Les motos

Chaque moto est un `<article class="card moto">` dans `index.html`. Les
attributs `data-` sont la source unique lue par le panier et le questionnaire :

```html
<article class="card moto"
         data-moto="m1"
         data-name="Apsonic F1D 150"
         data-amount="430000"
         data-meta="État 9/10 · garantie 6 mois">
```

Pour retirer une moto vendue, supprimez son `<article>` — le panier et le
questionnaire s'ajustent tout seuls. Pour en ajouter une, copiez un bloc
existant et donnez-lui une clé `data-moto` unique.

Le questionnaire renvoie vers ces mêmes clés (`assets/js/app.js`, objet
`motos`) : si vous changez une clé `data-moto`, mettez-la à jour là aussi.

## Ce que fait le site

- **Panier** — ajout depuis les fiches, retrait, total, conservé d'une visite à
  l'autre (`localStorage`). Le bouton « Commander sur WhatsApp » génère un
  message contenant la liste des motos, le total et une place pour le quartier.
- **Réserver un essai** — chaque fiche ouvre WhatsApp avec un message qui nomme
  la moto et son prix.
- **Questionnaire en 3 questions** — même logique de recommandation que la
  maquette ; le résultat propose un essai de la moto conseillée.
- **Newsletter** — validation de l'email, message d'erreur, état « merci »
  conservé d'une visite à l'autre. Aucun envoi : voir ci-dessous.
- **Menu mobile**, section active surlignée dans la navigation, panier
  fermable au clavier (`Échap`) avec le focus enfermé dans le tiroir.

## Limites à connaître

- **Aucun paiement en ligne.** C'est le parti pris de la maquette : tout se
  règle au point de vente ou à la livraison. Le panier sert à préparer un
  message WhatsApp, pas une transaction.
- **La newsletter ne part nulle part.** L'email est seulement gardé dans le
  navigateur du visiteur. Pour vraiment collecter les adresses, branchez le
  formulaire sur un service (Mailchimp, Brevo, Formspree, Omnisend…) :
  remplacez le `writeStore(STORAGE_NEWS, …)` de `assets/js/app.js` par un
  `fetch` vers votre point d'entrée.
- **Le stock est écrit en dur dans `index.html`.** C'est volontaire : la page
  reste lisible par les moteurs de recherche et fonctionne sans JavaScript. Si
  le stock bouge tous les jours, l'étape suivante serait un petit CMS.
