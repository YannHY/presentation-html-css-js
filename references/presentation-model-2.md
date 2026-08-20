# Modèle visuel 2 — cambré institutionnel

Utiliser ce modèle seulement lorsqu'il est demandé explicitement ou déjà présent dans la présentation. Pour une nouvelle présentation, copier `assets/presentation-template-2/` et conserver ses quatre fichiers séparés. Ne jamais appliquer ce modèle par défaut à un autre projet.

Le modèle 2 dérive d'un gabarit PowerPoint institutionnel : sa signature est un **cambré** en pleine hauteur sur le bord gauche, repris de la hampe du « f » du logo agrandie jusqu'à ce qu'il n'en reste que la courbe montante.

## Palette et tokens

```css
--bg: #f8fafc;
--surface: #ffffff;
--ink: #0f172a;
--muted: #64748b;
--subtle: #94a3b8;
--line: #e2e8f0;

--brand-deep: #0b4295;   /* bleu de la hampe du logo */
--brand: #006eb7;        /* bleu de la bande du gabarit */
--brand-soft: #eaf3fb;
--brand-line: #bcd8ee;

--radius: 20px;
--shadow: 0 1px 3px rgba(11, 66, 149, .07), 0 12px 32px rgba(11, 66, 149, .04);
```

- Le modèle emploie **deux bleus institutionnels distincts**, et non un seul décliné : `--brand-deep` pour la hampe du logo, `--brand` pour la bande. Les vérifier avant de les remplacer par une teinte approchante.
- Réserver `--brand-deep` aux surtitres, chapitres actifs et états ; `--brand` aux numéros, à la progression et aux accents de titre.
- Ne pas introduire de vert : contrairement au modèle 1, la progression et les états visités restent dans les deux bleus.

## Fond

- Le fond est **uni** `#f8fafc`, sans cadrillage. C'est une différence assumée avec le modèle 1 : le cambré porte seul la structure visuelle, et superposer les deux surchargerait le bord gauche.
- `.slide::before` est donc libre dans ce modèle, contrairement au modèle 1 qui l'emploie pour la grille.
- Ne pas compenser l'absence de grille par une autre texture de fond.

## Cambré

- Le tracé est un **SVG inline**, jamais une image : il reste net à toute échelle et suit la couleur en CSS.
- Le contour d'origine est monotone ; il descend de la pleine largeur au sommet jusqu'à une pointe en bas à gauche. Repères en pourcentage de la largeur de bande : `0 % → 100 %`, `10 % → 77 %`, `25 % → 61 %`, `50 % → 47 %`, `90 % → 19 %`, `100 % → 0 %`.
- Conserver le `viewBox="0 0 830 3508"` et le ratio `830/3508`. C'est ce ratio qui reproduit exactement la largeur du gabarit d'origine sur une scène 16/9.
- Remplir avec un dégradé vertical `--brand-deep` → `--brand`, le foncé au sommet et le clair à la pointe.
- Poser le cambré comme **dernier enfant de `.stage`**, une seule fois, jamais répété par slide. L'empilement le place alors au-dessus des fonds de slide et sous le contenu (`z-index: 1`). Il reste ainsi immobile pendant les transitions au lieu de réapparaître à chaque changement.
- Lui donner `pointer-events: none` : il ne doit jamais intercepter un clic.
- Le masquer sous `980px` : sa largeur suit la hauteur de scène, il occuperait sinon près de la moitié d'un écran de téléphone.

## Dégagement du contenu

- Dériver le décalage du contenu de la géométrie du cambré, jamais en dur :

```css
--swash-w: calc((100vh - 52px) * 830 / 3508);
--pad-left: calc(var(--swash-w) + clamp(28px, 3vw, 44px));
```

- Appliquer `--pad-left` au padding gauche des slides **et** à la barre d'en-tête, pour qu'ils ne puissent pas diverger.
- Vérifier que le contenu dégage le bord droit du cambré à sa largeur maximale, c'est-à-dire au sommet.
- La colonne de contenu se resserre d'environ 120 px par rapport au modèle 1. Contrôler les slides denses : ce qui tenait sur une ligne peut se replier et déborder en hauteur. Corriger dans une règle `max-height` dédiée plutôt qu'en réduisant le cambré.

## Barre d'en-tête

- Afficher l'institution et la **date du jour de l'intervention** en haut à gauche, l'auteur en haut à droite, **sur toutes les slides y compris la couverture**.
- Le gabarit livre le repère `NOM DE L’ÉTABLISSEMENT · JJ MOIS AAAA` dans `data-institution`. Remplacer `JJ MOIS AAAA` par la date réelle, en capitales pour rester homogène avec le reste de la mention. Une année scolaire (`2026–2027`) convient si la présentation couvre l'année plutôt qu'une séance.
- Les porter par `body::before` et `body::after` alimentés par `data-institution` et `data-author` sur `<body>`. Posées sur `body`, ces mentions échappent au `zoom` du plein écran : aucun relais en deux temps n'est nécessaire.
- Placer le logo en `background-image` de `body::before`, hauteur `16px`, avec `padding-left: 23px`. Pour que le logo tienne dans la boîte sans rogner, la mention passe en `line-height: 16px` avec `top: 15px` — la compensation de 3 px laisse le texte exactement où le placerait `line-height: 1` avec `top: 18px`.
- Masquer l'auteur sous `440px` : c'est en dessous de cette largeur seulement que les deux mentions se chevauchent.
- Le logo est référencé par `--logo`. Le remplacer par le fichier de l'établissement concerné.

## Couverture

- La couverture porte un surtitre, un titre et son accent ; elle ne répète pas l'identité déjà affichée par la barre d'en-tête.
- Employer le surtitre pour l'occasion ou pour la thèse de la présentation — ni le nom de l'établissement ni la date, qui figurent déjà dans la barre d'en-tête.
- L'accent du titre se compose avec `em` dans le `h1`, rendu en `--brand` et non en italique.

## Surfaces, barre inférieure, raccourcis

Identiques au modèle 1, à trois différences près :

- les états actifs emploient `--brand-soft` et `--brand-deep` au lieu du bleu générique ;
- la progression est un dégradé `--brand-deep` → `--brand`, sans vert ;
- les panneaux de notes et de raccourcis sont sur bleu nuit institutionnel `rgba(8, 34, 66, .97)`.

Pour le reste — barre de `52px` à trois zones, boutons circulaires de `36px`, ordre des utilitaires, `ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Space`, `Home`, `End`, `F`, `N`, `Escape`, `fn + ←` et `fn + →` sur Mac, geste tactile, panneaux mutuellement exclusifs — se reporter à [presentation-model-1.md](presentation-model-1.md).

## Apparitions et plein écran

- `presentation.js` est **le même fichier que celui du modèle 1**, sans modification : il ne dépend que du contrat DOM (`.slide`, `data-chapter`, `data-chapter-label`, `data-notes`, `[data-build]`, identifiants des commandes). Corriger un comportement dans les deux copies.
- Sur chaque slide comportant plusieurs unités de contenu, garder le titre visible et révéler une unité par action clavier ; vérifier chaque état intermédiaire.
- L'échelle du cadre de maquette (`1310×700`, plafond `2.4`) se calcule depuis la **boîte de contenu** de la slide, `--pad-left` déduit : le cambré garde donc sa place quelle que soit l'échelle, et la colonne ne peut pas glisser dessous. Le vérifier après toute modification du padding.
- Le cambré est dimensionné en hauteur réelle de scène, hors du cadre mis à l'échelle : c'est voulu, un décor de bord doit suivre la fenêtre et non la maquette.

## Invariants du modèle

- Conserver le cambré, son ratio, son dégradé, son unicité dans `.stage` et son masquage sous `980px`.
- Conserver la dérivation de `--pad-left` depuis `--swash-w` : ne jamais figer le décalage en pixels.
- Conserver le **fond uni** : ne pas réintroduire le cadrillage du modèle 1, le cambré porte seul la structure visuelle.
- Conserver les métadonnées, la progression, le compteur, les commandes, les raccourcis, le geste tactile, les notes, le hash stable et le plein écran.
- Remplacer les slides d'exemple, les chapitres, l'établissement, la date, l'auteur et les notes par les éléments du projet.
- **Remplacer `logo.svg`** : le gabarit ne livre qu'un repère géométrique neutre, destiné à être remplacé par le logo de l'établissement. Conserver le nom du fichier, ou pointer `--logo` ailleurs.
- Ne pas recopier automatiquement les choix éditoriaux d'une ancienne présentation : titres, pictogrammes, animations et nombres de slides restent propres au nouveau sujet.
