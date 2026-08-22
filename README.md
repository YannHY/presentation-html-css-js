# Create Interactive HTML Presentations — pour Codex et Claude Code

Skill pour Codex et Claude Code permettant de créer des présentations HTML interactives visuellement soignées, avec une attention particulière portée à la mise en page du contenu et au rythme des apparitions.

Claude Code et Codex lisent le même `SKILL.md` et les mêmes références. Seuls diffèrent le dossier d’installation et le fichier `agents/openai.yaml`, propre à Codex, que Claude Code ignore.

## Fonctionnalités

- transformation de notes ou d’un plan en présentation web ;
- navigation au clavier, au clic et au toucher ;
- apparitions successives et animations narratives ;
- notes de l’intervenant éditables d’un clic, sauvegardées localement par slide, et mode plein écran ;
- minuteur optionnel par slide, avec durée réglable, pause et réinitialisation ;
- calendriers interactifs à vues semaine, mois et année réellement navigables ;
- trois modèles graphiques optionnels et réutilisables, dont une variante sombre ;
- export vidéo MP4 conservant les animations réelles de chaque slide.

Le livrable par défaut est une **page web**. Des exports **PowerPoint** et **vidéo MP4 animée** sont disponibles en option.

## Fonctionnement

La skill part d’un contenu rédigé en texte simple. Il n’est pas nécessaire d’écrire du HTML ni de décrire chaque détail de mise en page.

1. Rédiger la présentation dans un éditeur comme **Obsidian**, de préférence en Markdown : un plan, des titres de slides, les idées à faire apparaître, les visuels souhaités et, si nécessaire, les notes de l’intervenant.
2. Donner ce texte ou le fichier Markdown à **Codex** ou à **Claude Code**.
3. Indiquer le modèle graphique souhaité et les éventuelles contraintes : nombre de slides, public, durée, animations, interactions ou export.
4. L’agent transforme le contenu en présentation HTML, organise la progression, crée les visuels et les interactions, puis vérifie le rendu à plusieurs résolutions.

Par exemple, le contenu source d’une slide de la présentation sur l’intelligence artificielle peut être écrit ainsi dans Obsidian :

```markdown
## Un agent = un modèle + un harnais

Un harnais fournit au modèle :
- des instructions ;
- des outils ;
- de la mémoire ;
- des contrôles.

Visuel : le modèle au centre, entouré de ces quatre fonctions.
```

On peut ensuite demander :

```text
À partir de ce document Markdown, crée une présentation HTML interactive
avec la skill create-interactive-html-presentations. Utilise le modèle 3,
fais apparaître progressivement les éléments importants et ajoute des
notes d’intervenant lorsque le texte source en fournit.
```

Le document source reste centré sur les idées. La skill se charge de les transformer en slides lisibles, de choisir les composants adaptés et d’appliquer le design system du modèle demandé.

## Exemple en vidéo


https://github.com/user-attachments/assets/dabf192b-055d-4ef2-8a0a-556a17273855


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
│   ├── export-video.md            export MP4 avec animations réelles
│   ├── interactive-calendar.md    vues semaine, mois et année
│   ├── slide-timers.md            minuteur optionnel par slide
│   ├── presentation-model-1.md
│   ├── presentation-model-2.md
│   └── presentation-model-3.md
└── scripts/
    ├── validate_presentation.py   contrôle statique
    ├── export_pptx.py             export PowerPoint, optionnel
    └── export_video.py            export vidéo animé, optionnel
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

- fond clair cadrillé ;
- palette bleu–vert ;
- métadonnées en haut ;
- navigation, notes, minuteur et plein écran dans la barre inférieure.

Fichiers : `assets/presentation-template-1/`.

## Modèle 2

- fond clair uni ;
- cambré SVG bleu sur le bord gauche ;
- palette à deux bleus ;
- logo, établissement et date configurables.

Fichiers : `assets/presentation-template-2/`. Le fichier `logo.svg` est un logo générique à remplacer.

## Modèle 3

- fond sombre cadrillé ;
- cartes et panneaux sombres ;
- accents bleu clair et vert ;
- même structure et mêmes interactions que le modèle 1.

Fichiers : `assets/presentation-template-3/`.

## Export PowerPoint

Optionnel, sur demande.

```bash
pip install --user python-pptx
python3 scripts/export_pptx.py chemin/vers/index.html -o sortie.pptx
```

Le mode par défaut, `images`, capture chaque état avec Chrome et le pose en pleine page : le rendu est **identique au web** — SVG, cambré, trames de données, calendrier, icônes. Une slide est émise par étape d'apparition, ce qui préserve le déroulé, et les notes d'intervenant sont conservées. En contrepartie les textes ne sont pas éditables et le fichier est lourd.

Le mode `--mode natif` produit de vraies formes PowerPoint éditables, mais ne porte que du texte : sur une présentation visuelle il ne rend qu'un squelette. À réserver à un deck purement textuel.

Compter environ 2,5 s par état — près de deux minutes et demie pour un deck de 17 slides à 39 états. À lancer en arrière-plan. Aucun serveur n'est nécessaire : la capture se fait en `file://`.

## Export vidéo

L'export vidéo enregistre la présentation exécutée dans Chromium : animations CSS, SVG et JavaScript, apparitions successives et changements de slide. Il ne fabrique pas une vidéo à partir de captures fixes.

```bash
pip install playwright
playwright install chromium
python3 scripts/export_video.py chemin/vers/index.html -o sortie.mp4
```

Le MP4 est encodé par FFmpeg. Les attributs `data-video-duration` et `data-video-build-times` règlent le minutage de chaque slide. Utiliser `--plan` pour contrôler la chronologie avant l'enregistrement.

## Auteur

Yann Houry
