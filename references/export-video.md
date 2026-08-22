# Export vidéo animé

L'export vidéo enregistre la présentation HTML réellement exécutée dans Chromium. Il conserve les animations CSS, SVG et JavaScript ainsi que les apparitions successives. Ne jamais le remplacer par un assemblage de captures fixes.

## Prérequis

```bash
pip install playwright
playwright install chromium
```

Installer aussi FFmpeg et vérifier `ffmpeg -version`.

## Minutage des slides

Chaque slide accepte deux attributs facultatifs :

- `data-video-duration="6"` : durée totale de la slide, en secondes ;
- `data-video-build-times="1.5,3"` : instants auxquels révéler les builds 2 et 3.

Le nombre de temps doit correspondre au nombre d'apparitions après l'état initial. Les valeurs sont croissantes et restent inférieures à la durée totale, avec une pause finale. Sans attributs, le script emploie cinq secondes par slide, 1,5 seconde entre les builds et 1,5 seconde de pause finale.

Vérifier le plan avant tout export long :

```bash
python3 scripts/export_video.py presentation/index.html --plan
```

## Export

```bash
python3 scripts/export_video.py presentation/index.html \
  -o presentation.mp4 \
  --width 1920 \
  --height 1080
```

Le script :

1. active `window.__presentationVideoExport` avant le chargement ;
2. masque les commandes et les panneaux ;
3. lance chaque slide depuis son état initial ;
4. déclenche les builds aux instants déclarés ;
5. enregistre le rendu continu avec Playwright ;
6. convertit la capture en MP4 H.264 avec FFmpeg.

Les minuteurs restent arrêtés, comme lors de l'ouverture normale d'une présentation. Ne pas utiliser leur durée comme durée vidéo.

## Animations personnalisées

Les animations liées à `.slide.active`, à `onSlideVisit()` ou à `presentation:build` sont enregistrées directement. Pour automatiser une interaction spécifique pendant l'export, écouter :

- `presentation:video-slide` à l'entrée sur une slide ;
- `presentation:video-build` après une apparition ;
- `presentation:video-end` à la fin du deck.

Une boucle infinie tourne pendant toute la durée déclarée de la slide. Une animation JavaScript longue ou interactive doit donc posséder un minutage vidéo explicite ; le navigateur ne peut pas deviner seul le moment narratif où il faut avancer.

## Vérification

- contrôler la durée, les dimensions et le codec avec `ffprobe` ;
- regarder le début, chaque changement de slide et la fin ;
- vérifier que chaque animation repart de zéro ;
- vérifier les builds un par un ;
- confirmer l'absence de barre de commandes, de panneaux et de frames de chargement ;
- comparer les mouvements à la présentation ouverte dans Chromium.

L'export est silencieux. Ajouter une piste audio séparément seulement sur demande explicite.
