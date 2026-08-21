# Create Interactive HTML Presentations

Skill Codex pour créer des présentations HTML interactives visuellement soignées avec une attention particulière portée à la mise en page du contenu et au rythme des apparitions.

Claude Code et Codex lisent le même `SKILL.md` et les mêmes références. Seuls diffèrent le dossier d’installation et le fichier `agents/openai.yaml`, propre à Codex, que Claude Code ignore.

## Fonctionnalités

- transformation de notes ou d’un plan en présentation web ;
- navigation au clavier, au clic et au toucher ;
- apparitions successives et animations narratives ;
- notes de l’intervenant éditables d’un clic, sauvegardées localement par slide, et mode plein écran ;
- minuteur optionnel par slide, avec durée réglable, pause et réinitialisation ;
- retouches précises sans modifier les éléments non demandés ;
- validation statique de la structure et des interactions ;
- vérification visuelle à plusieurs résolutions, et mesure de la réserve verticale de chaque slide ;
- calendriers interactifs à vues semaine, mois et année réellement navigables ;
- trois modèles graphiques optionnels et réutilisables, dont une variante sombre.

Le livrable par défaut est une **page web**. Un export **PowerPoint** est disponible en option : par captures fidèles de chaque état, ou en formes natives éditables pour un deck purement textuel.

## Installation

Cloner le dépôt dans le dossier des skills personnelles de son outil.

**Claude Code** :

```bash
git clone https://github.com/YannHY/presentation-html-css-js.git \
  ~/.claude/skills/create-interactive-html-presentations
```

**Codex** :

```bash
git clone https://github.com/YannHY/presentation-html-css-js.git \
  ~/.codex/skills/create-interactive-html-presentations
```

Le dossier doit porter ce nom exact. La skill est ensuite disponible sous le nom `create-interactive-html-presentations`, et se déclenche d'elle-même sur une demande de présentation HTML.

Pour récupérer les mises à jour :

```bash
git -C ~/.claude/skills/create-interactive-html-presentations pull
```

## Utilisation

Exemples de demandes :

```text
Crée une présentation HTML interactive à partir de ces notes.
```

```text
Sur la slide 4, fais apparaître les trois cartes successivement au clic.
```

```text
Crée une nouvelle présentation avec le modèle visuel 1.
```

```text
Ajoute une slide présentant le calendrier de l’année, avec des vues mois et semaine.
```

```text
Ajoute un minuteur de cinq minutes sur les slides d’atelier, avec pause et remise à zéro.
```

## Structure

```text
.
├── SKILL.md                  point d'entrée, lu par Claude Code et Codex
├── agents/
│   └── openai.yaml           manifeste propre à Codex
├── assets/
│   ├── presentation-template-1/   socle du modèle 1
│   ├── presentation-template-2/   socle du modèle 2, logo générique à remplacer
│   └── presentation-template-3/   socle du modèle 3, variante sombre
├── references/
│   ├── design-language.md         grammaire visuelle
│   ├── editorial-contract.md      contenu, notes, contenus figés
│   ├── targeted-edits.md          retouches sans effets collatéraux
│   ├── verification-mesuree.md    mesurer plutôt que regarder
│   ├── export-powerpoint.md       export .pptx : périmètre et limites
│   ├── interactive-calendar.md    vues semaine, mois et année
│   ├── slide-timers.md            minuteur optionnel par slide
│   ├── presentation-model-1.md
│   ├── presentation-model-2.md
│   └── presentation-model-3.md
└── scripts/
    ├── validate_presentation.py   contrôle statique
    └── export_pptx.py             export PowerPoint, optionnel
```

## Validation

Le script fourni contrôle la structure d’une présentation :

```bash
python3 scripts/validate_presentation.py chemin/vers/index.html --expected-slides 14
```

La vérification visuelle dans un navigateur reste obligatoire, notamment pour les animations, les étapes d’apparition et le plein écran.

## Minuteur par slide

Le minuteur est une option activée uniquement sur les slides qui en ont besoin. L’intervenant choisit la durée depuis un panneau ouvert par le bouton horloge, en bas à droite, puis peut démarrer, mettre en pause ou remettre le décompte à zéro.

Sur la slide, seul un cadre compact apparaît en haut à droite : le temps restant est centré au-dessus d’une barre de progression. Les réglages ne sont jamais projetés dans le contenu. Le minuteur ne démarre pas automatiquement et les durées modifiées dans l’interface restent limitées à la session.

Le composant est fourni dans les trois modèles. Son intégration et les comportements à vérifier sont documentés dans `references/slide-timers.md`.

## Modèle 1

Le modèle optionnel documente notamment :

- la palette bleu–vert ;
- le fond blanc cadrillé ;
- les métadonnées d’en-tête ;
- la barre de progression et les commandes inférieures ;
- les raccourcis, les notes et le plein écran ;
- les précautions nécessaires pour Safari.

Un modèle HTML, CSS et JavaScript prêt à adapter est fourni dans `assets/presentation-template-1/`.

## Modèle 2

Second modèle optionnel, dérivé d'un gabarit institutionnel :

- un cambré en SVG pleine hauteur sur le bord gauche, dont la géométrie commande le décalage du contenu ;
- deux bleus de marque et un fond uni, sans cadrillage ;
- une barre d'en-tête portée par `body`, qui échappe au zoom du plein écran.

Le socle est dans `assets/presentation-template-2/`. Il partage le `presentation.js` du modèle 1 sans modification. **Le logo livré n'est qu'un repère géométrique neutre** : remplacer `logo.svg` par celui de l'établissement, et renseigner `data-institution` dans `index.html`.

## Modèle 3

Variante **sombre** du modèle 1 : mêmes classes, mêmes slides, même `presentation.js`. Seules changent la palette et les surfaces.

- fond `#0b1220`, cartes `#141c2e`, cadrillage clair à faible opacité ;
- hiérarchie des teintes inversée — sur fond sombre, c'est la teinte la plus claire qui ressort ;
- fonds d'accent en voiles translucides plutôt qu'en aplats pâles ;
- panneaux de notes plus clairs que le fond d'un cran, jamais blancs, pour ne pas éblouir en salle obscurcie ;
- ratios de contraste mesurés et documentés, le plus faible à 4,30 pour un seuil de 3,0.

Le socle est dans `assets/presentation-template-3/`.

## Export PowerPoint

Optionnel, sur demande.

```bash
pip install --user python-pptx
python3 scripts/export_pptx.py chemin/vers/index.html -o sortie.pptx
```

Le mode par défaut, `images`, capture chaque état avec Chrome et le pose en pleine page : le rendu est **identique au web** — SVG, cambré, trames de données, calendrier, icônes. Une slide est émise par étape d'apparition, ce qui préserve le déroulé, et les notes d'intervenant sont conservées. En contrepartie les textes ne sont pas éditables et le fichier est lourd.

Le mode `--mode natif` produit de vraies formes PowerPoint éditables, mais ne porte que du texte : sur une présentation visuelle il ne rend qu'un squelette. À réserver à un deck purement textuel.

Compter environ 2,5 s par état — près de deux minutes et demie pour un deck de 17 slides à 39 états. À lancer en arrière-plan. Aucun serveur n'est nécessaire : la capture se fait en `file://`.

## Auteur

Yann Houry
