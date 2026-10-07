# Bloknot — site officiel

Vitrine française de l’application Bloknot, bientôt disponible sur iPhone, iPad et Mac. HTML sémantique, CSS responsive et JavaScript léger, sans framework ni service tiers à l’exécution.

## Pages

- `index.html` : présentation, exemples de notes, 22 types de blocs, organisation, confidentialité, FAQ et disponibilité.
- `contact.html` : contact et assistance ; demande de notification par e-mail.
- `confidentialite.html` : politique de l’application en français et anglais, issue du projet iOS, et confidentialité du site.
- `mentions-legales.html` : informations de Carib Tech Studio et de GitHub Pages.
- `404.html` : page d’erreur avec liens fonctionnels même depuis une URL imbriquée.

## Développement

Node.js 22 ou plus récent.

```sh
npm ci
npm run dev
```

Ouvrir http://127.0.0.1:4173/bloknote-website/.

```sh
npm run check
npm run build
npx playwright install chromium webkit
QA_WEBKIT=1 npm run test:browser
```

Les captures et le rapport de vérification sont écrits dans `qa/` (ignoré par Git). Les dépendances Playwright et axe servent uniquement aux vérifications. Aucun script tiers n’est chargé par le site.

## Publication GitHub Pages

Le workflow `.github/workflows/pages.yml` vérifie les pages, leur accessibilité et leurs interactions, génère `dist/`, puis publie sur GitHub Pages à chaque push sur `main`.

Dans **Settings → Pages → Build and deployment → Source**, choisir **GitHub Actions**. La première activation doit être réalisée par un administrateur du dépôt.

Adresse par défaut : https://caribtechstudio.github.io/bloknote-website/

Pour un futur domaine personnalisé, définir `SITE_URL=https://votre-domaine.fr/` avant `npm run build`. Cela adapte les canonical, sitemap et liens absolus de la 404. Configurer ensuite ce domaine dans GitHub Pages ; ne pas ajouter de CNAME tant que le domaine n’est pas confirmé.

## Au lancement de l’application

1. Ajouter le lien App Store officiel à la section `#disponibilite` et aux boutons de téléchargement.
2. Remplacer les textes « Bientôt disponible » et les réponses de la FAQ sur le lancement, le prix et la compatibilité par les informations validées.
3. La notification actuelle est une **demande par e-mail** : le visiteur ouvre sa messagerie et envoie lui-même le message. Il n’y a pas de formulaire, liste d’attente automatique ou envoi d’e-mail côté serveur.
4. Garder la politique de confidentialité du site et celle de l’application à jour.

## Visuels et sources

- Logo : icône actuelle de Bloknot dans le projet iOS.
- Aperçus : maquettes illustratives générées à partir des blocs, couleurs et notes d’exemple du projet iOS, clairement identifiées comme démonstrations. Le simulateur natif ne produisait que des écrans noirs. Régénération : `node scripts/render-demo.mjs`, puis conversion en WebP. Remplacer ces visuels par les captures natives définitives avant le lancement.
- Fonctions : `BlockKind`, widgets, Siri, exports, recherche et politique de confidentialité du projet iOS.
- Inspiration de composition : [Lumio par JAISURIYA](https://dribbble.com/shots/27704348-Lumio-an-Ai-Productivity-SaaS). Aucun texte, logo, témoignage ni visuel Lumio n’a été réutilisé.
- Icônes : SVG officiels [Lucide](https://lucide.dev/), auto-hébergés et intégrés directement dans le HTML. Sources, commit et licences ISC / MIT dans `assets/icons/`. Régénération : `npm run icons:sync`. Le logo de Bloknot reste celui de l’application.
- Police Inter : auto-hébergée, licence SIL OFL dans `assets/fonts/LICENSE.txt`.

## Choix de confidentialité et accessibilité

Aucun cookie, localStorage, analytics ou pixel publicitaire. Polices et images auto-hébergées. GitHub peut enregistrer les requêtes techniques nécessaires à son hébergement, comme décrit dans la politique du site. Les liens de contact passent par `mailto:`.

Apparitions au scroll, transitions des aperçus, dégradés des titres en mouvement fluide de gauche à droite (boucle de 12 secondes), dégradés interactifs et progression discrète de lecture. Toutes les animations respectent le réglage de réduction des mouvements et les contenus restent accessibles au clavier.

Navigation au clavier, lien d’évitement, focus visible, onglets avec touches fléchées, filtres annoncés aux lecteurs d’écran, FAQ native, respect de `prefers-reduced-motion`, catalogue et navigation accessibles sans JavaScript. Métadonnées SEO, Open Graph textuel, sitemap, favicon, et politique de sécurité des contenus.
