# Modèle visuel 3 — variante sombre du modèle 1

Utiliser ce modèle seulement lorsqu'il est demandé explicitement ou déjà présent dans la présentation. Pour une nouvelle présentation, copier `assets/presentation-template-3/`. Ne jamais appliquer ce modèle par défaut à un autre projet.

Le modèle 3 est le **modèle 1 en sombre** : mêmes classes, même structure de slides, même `presentation.js`, même contrat DOM. Un diff entre `presentation-template-1/styles.css` et `presentation-template-3/styles.css` ne doit montrer que la palette et le traitement des surfaces. Toute autre divergence est une dérive à corriger.

## Palette

```css
--bg: #0b1220;
--surface: #141c2e;
--surface-high: #1b2439;
--ink: #eef2f8;
--muted: #9aa8bd;
--subtle: #6b7a91;
--line: #263248;
--blue: #60a5fa;
--blue-strong: #93c5fd;
--blue-soft: rgba(96, 165, 250, .14);
--green: #34d399;
--green-strong: #6ee7b7;
--green-soft: rgba(52, 211, 153, .14);
--shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 18px 44px rgba(0, 0, 0, .38);
```

## Ce qui s'inverse par rapport au clair

- **La hiérarchie des teintes s'inverse.** En clair, c'est la couleur la plus foncée qui ressort ; en sombre, la plus claire. `--blue-dark` du modèle 1 devient donc `--blue-strong`, plus **clair** que `--blue`, et sert aux surtitres et aux états actifs.
- **Les fonds d'accent deviennent des voiles translucides.** Un aplat pâle comme `#eff6ff` est inutilisable : `--blue-soft` est un `rgba` à 14 % qui laisse voir le fond.
- **Les ombres ne suffisent plus à détacher une surface.** Sur fond sombre elles se voient à peine : la carte est identifiée par sa teinte propre et sa bordure, l'ombre n'ajoutant que de la profondeur.
- **Le cadrillage passe en clair sur fond sombre**, à une opacité plus basse qu'en clair (`.10` contre `.14`) : à opacité égale, des lignes claires sur fond sombre créent un moiré visible en projection.
- **Les panneaux de notes et de raccourcis ne s'inversent pas.** En clair ils étaient sombres pour se détacher ; en sombre, les passer en blanc éblouirait dans une salle obscurcie. Ils sont donc **plus clairs que le fond d'un seul cran** (`--surface-high`), avec une bordure franche.

## Contraste : à mesurer, pas à estimer

Un thème sombre échoue d'abord sur le contraste. Calculer le ratio de chaque paire texte/fond réellement employée avant de livrer, et viser `4.5:1` pour le texte courant, `3:1` pour les mentions secondaires et les repères non textuels.

Ratios du modèle, tous conformes — le plus faible étant les métadonnées d'en-tête à `4.30` pour un seuil de `3.0` :

| paire | ratio |
|---|---|
| texte principal sur fond | 16,67 |
| texte principal sur carte | 15,13 |
| texte secondaire sur carte | 7,05 |
| surtitre bleu sur fond | 10,38 |
| numéro bleu sur carte | 6,69 |
| vert de progression sur fond | 9,74 |
| texte de panneau | 11,43 |
| métadonnées d'en-tête sur fond | 4,30 |

Toute retouche de palette impose de refaire ce calcul : éclaircir un fond de carte dégrade le contraste de tous les textes qu'elle porte.

## Points communs conservés avec le modèle 1

- `meta name="theme-color"` suit le fond : `#0b1220`.
- Les métadonnées `data-institution` et `data-author` sont portées par `body::before` et `body::after`, et **s'effacent sur la couverture** — celle-ci intégrant déjà l'identité. Vérifier ce comportement en neutralisant la transition, sinon la lecture se fait en cours d'animation et renvoie une valeur transitoire.
- Barre inférieure de `52px` à trois zones, boutons circulaires de `36px`, progression en dégradé bleu vers vert, raccourcis, notes, plein écran, geste tactile : identiques.
- `presentation.js` est le **même fichier** que celui des modèles 1 et 2, sans modification. Corriger un comportement dans les trois copies.

## Invariants du modèle

- Conserver le fond sombre, la palette et l'inversion de hiérarchie des teintes.
- Conserver les panneaux plus clairs que le fond : ne jamais les passer en blanc.
- Refaire le calcul de contraste après toute modification de palette.
- Ne pas introduire de surface blanche pleine : en salle obscurcie elle éblouit et écrase le reste de la slide.
- Remplacer les slides d'exemple, les chapitres, l'établissement, l'auteur et les notes par les éléments du projet.
