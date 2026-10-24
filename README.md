# Créer des présentations HTML interactives avec Codex et Claude Code

Skill pour créer et retoucher des présentations HTML interactives visuellement soignées à partir d’un document Markdown structuré.

## Ce que produit la skill

Le livrable principal est une **présentation web**. Elle peut inclure :

- une navigation intuitive au clavier, à la souris ou au toucher ;
- des apparitions progressives et des animations ;
- des notes pour l’intervenant et un mode présentation ;
- un affichage adapté aux ordinateurs, mobiles et tablettes ;
- des présentations en plusieurs langues ;
- des outils comme un minuteur ou un calendrier interactif ;
- trois modèles graphiques ou une direction visuelle personnalisée ;
- sur demande, un export **PowerPoint** et/ou une **vidéo MP4 animée**.

## Déroulement d’une création

Avant une création ou une refonte complète, l’agent regroupe dans un seul message les informations encore manquantes :

1. **Modèle** : modèle 1, 2, 3 ou direction personnalisée ;
2. **Langues** : présentation monolingue ou langues à proposer ;
3. **Exports** : PowerPoint, vidéo, les deux ou aucun export supplémentaire ;
4. **Contenu** : présentation au format texte, sous forme de plan, de notes ou de slides déjà découpées.

Une information déjà fournie n’est pas redemandée. Une retouche ciblée ne déclenche pas le questionnaire complet : l’agent établit seulement le périmètre exact de la modification et préserve le reste.

Le workflow est ensuite le suivant :

1. inventorier les sources et les éléments à conserver mot pour mot ;
2. construire un contrat éditorial slide par slide, séparant texte projeté et notes orales ;
3. définir le storyboard, les interactions et l’ordre des apparitions ;
4. générer la présentation à partir du modèle choisi ou de la direction demandée ;
5. exécuter le validateur statique ;
6. ouvrir la présentation dans un vrai navigateur et contrôler toutes les slides, tous les builds et les formats requis ;
7. corriger jusqu’à disparition des débordements, collisions, erreurs console et contrôles inactifs ;
8. produire les exports demandés à partir de la version web validée.

## Format Markdown pris en charge

La skill reconnaît une note structurée avec un titre de présentation, une section par slide, des champs explicites et un bloc éditorial :

````markdown
# Présentation

## Slide 1

Titre : [Titre de la slide]
Sous-titre : [Sous-titre éventuel]
Intervenant : [Nom de l’intervenant]

```bash
# Description de la slide 1

[Description éditoriale, visuelle et narrative de la slide]

# Notes de l’intervenant

[Notes orales associées à la slide]
```

---

## Slide 2

[Même structure pour la slide suivante]
````

Le bloc reste du texte éditorial même s’il porte l’étiquette `bash` : l’agent ne l’exécute jamais. La section `# Description de la slide N` guide la composition, le visuel et les animations. La section `# Notes de l’intervenant` alimente les notes orales de la slide et n’est jamais projetée automatiquement. Les artefacts de copie Markdown comme `&#x20;`, les antislashs de saut de ligne ou `\---` sont normalisés avant l’analyse.

## Principes de conception

### Contenu et mouvement

- Le titre reste visible ; les paragraphes, listes, cartes, étapes, visuels et conclusions apparaissent selon un ordre explicite.
- En projection, la navigation parcourt tous les builds avant de changer de slide ; la navigation arrière les masque dans l’ordre inverse.
- Hors projection, tout le contenu est visible afin de faciliter la lecture et la retouche.
- `prefers-reduced-motion` rend les transitions instantanées sans supprimer le séquençage ni le contenu.
- Les animations sémantiques se lancent quand leur slide devient active et se réinitialisent lors d’une nouvelle visite.

### Mise en page

- Les modèles utilisent un cadre de dessin fixe de `1310 × 700 px`, mis à l’échelle comme un seul bloc.
- Au-dessus du seuil mobile, la composition reste identique quelle que soit la fenêtre ; elle n’est pas restructurée par des règles dépendant du viewport.
- Sous le seuil étroit, la skill abandonne le cadre fixe au profit d’une largeur fluide, d’un empilement logique et d’un défilement vertical.
- Les débordements, pop-ups, retours à la ligne et marges sont contrôlés par la mesure, pas seulement à l’œil.

### Interface et accessibilité

- Les raccourcis prévus sont `ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Home`, `End`, `Space`, `F` et `Escape`.
- Les contrôles possèdent un focus visible, un nom accessible et une zone tactile suffisante.
- Aucun bouton ou menu décoratif n’est conservé : un contrôle visible doit fonctionner réellement.
- Les notes sont modifiables dans le navigateur et persistées par slide dans `localStorage` ; cette édition ne réécrit pas le fichier HTML source.

## Modèles fournis

| Modèle | Direction visuelle | Dossier |
| --- | --- | --- |
| **1** | Fond clair cadrillé, palette bleu–vert, métadonnées en haut et barre de commandes en bas | `assets/presentation-template-1/` |
| **2** | Fond clair, cambré SVG bleu à gauche, deux bleus de marque, logo, établissement et date configurables | `assets/presentation-template-2/` |
| **3** | Variante sombre du modèle 1, semis de points, cartes sombres et accents bleu clair et vert | `assets/presentation-template-3/` |

Le fichier `assets/presentation-template-2/logo.svg` est un logo générique à remplacer. Les trois modèles partagent les interactions essentielles, le cadre fixe, le repli mobile, les notes, le minuteur et le système d’apparitions.

Une direction personnalisée peut remplacer ces modèles lorsqu’une référence visuelle ou une charte est fournie.

## Présentations multilingues

Chaque langue constitue un état complet du deck. La skill traduit à partir de clés stables et couvre :

- les textes projetés ;
- les notes d’intervenant ;
- les chapitres et la navigation ;
- les boutons, infobulles et libellés accessibles ;
- les messages dynamiques, légendes et états interactifs.

Le nombre de slides, l’ordre des builds et les identifiants restent identiques entre les langues. La composition et l’accessibilité sont revérifiées dans chaque langue, car une traduction plus longue peut créer un débordement absent dans la version source.

## Compatibilité mobile et tablette

Le repli étroit tient compte des zones sûres, du chrome mobile, de l’orientation et de la barre de commandes. La matrice minimale de vérification couvre un téléphone étroit, un grand téléphone, un téléphone en paysage et une tablette dans les deux orientations.

Lorsque l’API Fullscreen n’est pas disponible, la présentation propose un **mode présentation** dans le viewport au lieu d’afficher un faux bouton « plein écran ».

## Installation

Cloner le dépôt dans le dossier des skills personnelles de l’outil utilisé. Le dossier doit porter le nom exact `create-interactive-html-presentations`.

### Claude Code

```bash
git clone https://github.com/YannHY/presentation-html-css-js.git \
  ~/.claude/skills/create-interactive-html-presentations
```

### Codex

```bash
git clone https://github.com/YannHY/presentation-html-css-js.git \
  ~/.codex/skills/create-interactive-html-presentations
```

La skill se déclenche ensuite automatiquement pour une demande de création, de refonte ou de retouche d’une présentation HTML.

### Mise à jour

```bash
# Claude Code
git -C ~/.claude/skills/create-interactive-html-presentations pull

# Codex
git -C ~/.codex/skills/create-interactive-html-presentations pull
```

## Exemples de demandes

```text
Crée une présentation HTML interactive à partir de ces notes.
```

```text
Crée une nouvelle présentation avec le modèle visuel 1.
```

```text
Sur la slide 4, fais apparaître les trois cartes successivement au clic.
```

```text
Ajoute une slide présentant un calendrier annuel, avec des vues mois et semaine.
```

```text
Ajoute un minuteur de cinq minutes sur les slides d’atelier, avec pause et remise à zéro.
```

```text
Traduis toute la présentation en anglais et en allemand, interface et notes comprises.
```

```text
Adapte et vérifie la présentation pour téléphone et tablette, dans les deux orientations.
```

```text
Exporte la présentation validée en PowerPoint et en vidéo MP4.
```

## Validation

Le validateur contrôle notamment la structure, les références internes, les conteneurs vides et, si demandé, le nombre de slides fixé par le contrat éditorial :

```bash
python3 scripts/validate_presentation.py chemin/vers/index.html \
  --expected-slides 14
```

Ce contrôle statique ne remplace pas l’inspection dans un navigateur. Une création ou une refonte doit aussi être parcourue avec tous les builds révélés aux formats `1366 × 768`, `1600 × 900`, `1280 × 720`, `2560 × 1440` et dans les formats étroits pertinents. Il faut également vérifier le clavier, le tactile, les langues, les notes, le plein écran ou mode présentation, le focus et la console.

Pour une retouche ciblée, la skill compare la slide avant et après au même viewport, contrôle les slides voisines et confirme que seuls les éléments demandés ont changé.

## Minuteur par slide

Le minuteur est activé uniquement sur les slides qui en ont besoin. L’intervenant choisit la durée depuis un panneau ouvert par le bouton horloge, puis peut démarrer, mettre en pause, reprendre ou réinitialiser le décompte.

Sur la slide, seul un cadre compact apparaît : temps restant et barre de progression. Le minuteur ne démarre jamais automatiquement et se met en pause lorsque l’on quitte la slide, sans perdre le temps restant. Les durées modifiées dans l’interface restent limitées à la session.

## Export PowerPoint

L’export `.pptx` est optionnel et intervient après validation de la présentation web.

### Mode images, recommandé

Chaque état d’apparition est capturé par Chrome, Chromium ou Edge et placé en pleine page. Le rendu reste fidèle au web — SVG, calendriers, trames, dégradés et icônes — et les notes sont conservées. En contrepartie, les textes ne sont pas éditables et le fichier est plus lourd.

```bash
pip install --user python-pptx
python3 scripts/export_pptx.py chemin/vers/index.html -o sortie.pptx
```

Une slide PowerPoint est produite par étape d’apparition. L’option `--final-only` conserve uniquement l’état final de chaque slide. `--largeur` et `--echelle` règlent la capture.

### Mode natif, pour les decks textuels

```bash
python3 scripts/export_pptx.py chemin/vers/index.html \
  -o sortie.pptx \
  --mode natif
```

Ce mode produit des formes et textes PowerPoint éditables, mais ne reproduit pas fidèlement les visuels CSS, SVG ou canvas. Il est réservé aux présentations principalement textuelles et signale les éléments non convertis.

## Export vidéo

L’export vidéo enregistre la présentation réellement exécutée dans Chromium. Il conserve les animations CSS, SVG et JavaScript, les apparitions successives et les changements de slide ; ce n’est pas un assemblage de captures fixes.

Prérequis : Playwright, Chromium et FFmpeg.

```bash
pip install playwright
playwright install chromium
ffmpeg -version
```

Contrôler d’abord la chronologie :

```bash
python3 scripts/export_video.py chemin/vers/index.html --plan
```

Puis lancer l’export :

```bash
python3 scripts/export_video.py chemin/vers/index.html \
  -o sortie.mp4 \
  --width 1920 \
  --height 1080
```

Les attributs `data-video-duration` et `data-video-build-times` permettent d’ajuster le minutage slide par slide. Les options `--slide-duration`, `--build-delay` et `--final-hold` définissent les valeurs par défaut.

## Structure du dépôt

```text
.
├── SKILL.md                       instructions principales
├── agents/
│   └── openai.yaml                manifeste propre à Codex
├── assets/
│   ├── presentation-template-1/   modèle clair cadrillé
│   ├── presentation-template-2/   modèle clair avec cambré et logo
│   └── presentation-template-3/   modèle sombre
├── references/
│   ├── design-language.md         grammaire visuelle et mouvement
│   ├── editorial-contract.md      matrice de contenu et notes
│   ├── targeted-edits.md          retouches sans effets collatéraux
│   ├── verification-mesuree.md    contrôles géométriques et régression
│   ├── markdown-source-format.md  lecture des sources Markdown structurées
│   ├── multilingual-presentations.md
│   ├── mobile-and-tablet.md
│   ├── interactive-calendar.md
│   ├── slide-timers.md
│   ├── export-powerpoint.md
│   ├── export-video.md
│   ├── presentation-model-1.md
│   ├── presentation-model-2.md
│   └── presentation-model-3.md
└── scripts/
    ├── validate_presentation.py   validation statique
    ├── export_pptx.py             export PowerPoint optionnel
    └── export_video.py            export MP4 animé optionnel
```

## Exemple en vidéo

https://github.com/user-attachments/assets/dabf192b-055d-4ef2-8a0a-556a17273855

## Auteur

Yann Houry
