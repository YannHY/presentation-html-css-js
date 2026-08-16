# Modèle visuel 1

Utiliser ce modèle seulement lorsqu'il est demandé explicitement ou déjà présent dans la présentation. Pour une nouvelle présentation, copier `assets/presentation-template-1/` et conserver ses trois fichiers séparés.

## Palette et tokens

```css
--bg: #f8fafc;
--surface: #ffffff;
--ink: #0f172a;
--muted: #64748b;
--subtle: #94a3b8;
--line: #e2e8f0;
--blue: #3b82f6;
--blue-dark: #2563eb;
--blue-soft: #eff6ff;
--green: #10b981;
--green-dark: #047857;
--green-soft: #ecfdf5;
--navy: #0f172a;
--radius: 20px;
--shadow: 0 1px 3px rgba(15, 23, 42, .06), 0 12px 32px rgba(15, 23, 42, .035);
```

- Employer l'encre bleu-noir pour les titres et le gris ardoise pour le texte secondaire.
- Réserver le bleu aux repères, surtitres et actions ; réserver le vert aux états positifs et à la progression.
- Utiliser les fonds sombres uniquement pour un diagramme, un écran ou un phénomène qui l'exige.

## Fond cadrillé

- Conserver un fond global `#f8fafc`.
- Dessiner une grille de `40px` avec des lignes `rgba(148,163,184,.14)` d'un pixel.
- Atténuer la grille avec un masque radial pour qu'elle structure sans concurrencer le contenu.
- Afficher le cadrillage sur toutes les slides, y compris la couverture, sauf demande contraire.

## Métadonnées et typographie

- Afficher l'institution et l'année en haut à gauche, puis l'auteur en haut à droite, sauf sur la couverture si celle-ci les intègre déjà.
- Employer une police sans sérif système proche d'Inter et une monospace système pour les métadonnées, numéros et raccourcis.
- Composer les titres en bleu-noir, grands et serrés ; augmenter légèrement l'approche seulement quand l'utilisateur le demande.
- Composer les surtitres en bleu, capitales visuelles, `14px`, graisse `700`, approche `.08em`.
- Faire apporter au surtitre un angle absent du titre. Proposer plusieurs formulations avant de l'ajouter lorsqu'aucun texte n'est imposé.

## Surfaces

- Utiliser des cartes blanches, une bordure `#e2e8f0`, un rayon de `20px` et une ombre très légère.
- Aérer les cartes ; ne pas ajouter de badges, étiquettes ou icônes décoratives sans fonction.
- Lorsqu'un texte devient surtitre, retirer sa répétition dans le contenu sans supprimer le cadre ou l'illustration qui le contenait.

## Barre inférieure

- Fixer une barre blanche translucide de `52px` avec flou, bordure supérieure et trois zones : chapitres à gauche, transport au centre, utilitaires à droite.
- Placer une progression de `2px` sur son bord supérieur, en dégradé bleu vers vert.
- Utiliser des boutons circulaires de `36px`, sans fond au repos, avec un fond bleu pâle pour l'état actif.
- Ordonner les utilitaires : raccourcis clavier, notes, plein écran.
- Afficher les panneaux de notes et de raccourcis au-dessus de la barre, alignés à droite, sur fond bleu nuit.

## Raccourcis et plateforme

- Implémenter réellement `ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Space`, `Home`, `End`, `F`, `N` et `Escape`.
- Sur Mac, afficher `fn + ←` pour `Home` et `fn + →` pour `End` plutôt que les noms techniques seuls.
- Garder le panneau de raccourcis et le panneau de notes mutuellement exclusifs.

## Apparitions et plein écran

- Sur chaque slide contenant plusieurs unités de contenu, conserver le titre visible puis révéler obligatoirement une unité sémantique par action clavier ; vérifier chaque état, pas seulement le premier et le dernier.
- Faire parcourir les builds avant le changement de slide avec `ArrowRight`, `PageDown` et `Space`, puis les masquer dans l'ordre inverse avec `ArrowLeft` et `PageUp`.
- Conserver une position finale stable pour toutes les animations.
- En plein écran, calculer l'échelle depuis une scène de référence `1366×768`, plafonnée à `2.2`.
- Tester le navigateur réellement utilisé. Pour Safari, éviter les trajectoires SVG fondées sur `transform-box`; animer directement `cx`, `cy`, `x`, `y` ou un autre attribut géométrique SVG.

## Invariants du modèle

- Conserver le cadrillage, les métadonnées, la progression, le compteur, les commandes, les raccourcis, le geste tactile, les notes, le hash stable et le plein écran.
- Remplacer les slides d'exemple, les chapitres, l'année, l'auteur et les notes par les contenus du projet.
- Ne pas recopier automatiquement les choix éditoriaux d'une ancienne présentation : titres, pictogrammes, animations et nombres de slides restent propres au nouveau sujet.
