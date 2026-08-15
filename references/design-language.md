# Grammaire visuelle

## Références d'abord

Traiter tout site, vidéo, timestamp, deck ou capture fourni comme un cahier des charges. L'examiner réellement avant de dessiner. Relever :

- palette et répartition des couleurs ;
- typographies, tailles et contrastes ;
- largeur utile, marges, espacements et densité ;
- rayons, bordures, ombres et niveaux de surfaces ;
- types de compositions ;
- ordre, durée et nature des animations.

Reproduire les principes, pas une imitation superficielle. Les références explicites priment sur les valeurs par défaut ci-dessous.

## Direction par défaut

- Employer un fond blanc ou gris très clair et une encre bleu-noir.
- Éviter les dominantes beige, crème, violette ou les grands aplats colorés arbitraires.
- Utiliser le bleu, le cyan, le vert ou une autre couleur issue de la référence comme accents, pas comme remplissage systématique.
- Employer des cadres blancs arrondis lorsqu'un contenant est utile, avec bordure fine et ombre légère ou absente.
- Garder beaucoup d'espace et une hiérarchie lisible en moins de deux secondes.

## Hiérarchie et densité

- Affecter une idée principale à chaque slide.
- Viser 6 à 12 mots pour le titre et une seule courte phrase d'appui au maximum.
- Afficher une phrase seulement si elle ajoute une information absente du titre et du visuel.
- Traiter de façon homogène les éléments de même niveau : dimensions, alignement, rayon, espacement, numérotation et ordre d'apparition.
- Préférer une comparaison, une matrice, un diagramme ou une preuve visuelle à un paragraphe encadré.
- Ne pas réduire fortement la police pour faire entrer trop de contenu ; simplifier ou répartir.

## Règle des surfaces

Limiter chaque unité sémantique à **un seul contenant décoratif principal**.

- Éviter `slide → carte → cadre de visuel → faux document → illustration`.
- Distinguer le cadre décoratif de la limite intrinsèque d'un objet : cellules d'une grille, écran d'une interface ou fond nocturne d'une éclipse ne sont pas des cartes supplémentaires.
- Ne pas retirer un fond, une bordure ou un rayon approuvé lors d'une correction portant sur un enfant du composant.
- Garder des rayons visibles et cohérents. Ne pas perdre les arrondis en remplaçant ou en aplatissant un SVG.
- Ne pas ajouter de grand fond bleu derrière une illustration sauf nécessité sémantique, référence explicite ou choix déjà approuvé.

## Compositions utiles

- **Ouverture** : titre court, image mentale dominante, très peu de métadonnées.
- **Grand chiffre** : donnée, unité et interprétation brève.
- **Comparaison** : deux ou trois colonnes partageant exactement les mêmes repères.
- **Étapes** : séquence numérotée dont la progression est immédiatement perceptible.
- **Carte + preuve** : affirmation d'un côté, donnée, image ou mini-graphique de l'autre.
- **Tableau éditorial** : peu de lignes, colonnes distinctes et cellules aérées.
- **Conclusion** : une idée mémorable ; déplacer les remerciements sur une slide dédiée si le contenu final mérite toute la surface.

Varier les compositions tout en réutilisant les mêmes tokens.

## Intégrité des représentations

Faire respecter à chaque visuel les contraintes de ce qu'il représente.

- Une grille de mots croisés doit posséder de vrais croisements, sans contacts parasites ni lettres collées.
- Une onde audio doit ressembler à une forme d'onde, pas à une courbe statistique.
- Une trajectoire d'éclipse doit montrer un transit crédible, lisible et correctement rythmé.
- Un graphique doit conserver des proportions et des libellés exacts.
- Une comparaison visuelle doit montrer la différence ; une ligne de texte dans un cadre ne suffit pas.

Ne jamais ajouter un contrôle graphique inerte pour rendre une illustration « réaliste ». Un bouton de lecture sans audio, un faux sélecteur ou une fausse puce de filtre dégrade la compréhension.

## Mouvement narratif

Définir les étapes à partir de l'ordre de parole, pas à partir du nombre d'éléments DOM.

- Garder les slides statiques quand la simultanéité aide la compréhension.
- Viser généralement 0 à 3 clics significatifs par slide ; dépasser ce nombre seulement pour une démonstration dense assumée.
- Révéler une unité sémantique par clic, pas chaque mot ni chaque décoration.
- Faire apparaître successivement les blocs présentés successivement.
- Déclencher l'animation interne seulement lorsque son bloc devient visible.
- Conserver la géométrie finale dès le premier état pour éviter les sauts.
- Terminer dans un état stable et éviter les boucles sans valeur narrative.

Durées indicatives :

- interface et apparition : `180–450 ms` ;
- tracé ou transformation courte : `600–1200 ms` ;
- phénomène à observer, comme un transit ou une simulation : `5–8 s`, avec départ lisible, trajet et temps de maintien final.

Ne pas appliquer une durée unique à tous les phénomènes. Éviter rebonds, rotations gratuites, entrées génériques répétées et agitation permanente.

Sous `prefers-reduced-motion: reduce`, conserver les étapes, la navigation et tout le contenu ; rendre seulement les transitions instantanées et fixer les démonstrations dans un état final lisible.

## Système sombre

Réserver le fond graphite ou bleu nuit aux diagrammes, écrans ou phénomènes dont le contexte le justifie. Utiliser une couleur par catégorie, des connecteurs fins et peu de texte. Ne pas transformer le deck entier en système sombre si la référence repose sur des surfaces claires.

## Three.js

Employer Three.js seulement si la profondeur porte une information réelle : réseau spatial, niveaux, flux tridimensionnel ou constellation. Sinon préférer SVG et CSS. Prévoir un fallback statique, limiter le ratio de pixels et arrêter la boucle hors écran.

## Responsive et accessibilité

- Garder la zone utile dans le viewport sans défilement vertical pendant la présentation.
- Simplifier ou empiler au format étroit sans supprimer la navigation.
- Garantir contraste, focus visible et noms accessibles.
- Ne pas transmettre une information uniquement par couleur ou mouvement.
- Fournir un texte alternatif ou un nom accessible aux visuels informatifs ; masquer les éléments purement décoratifs.

## À éviter

- texte redondant ou notes orales projetées ;
- cartes identiques sur toutes les slides ;
- cadres imbriqués ;
- fonds colorés sans fonction ;
- badges et micro-libellés décoratifs ;
- illustrations approximatives ;
- faux contrôles ;
- texte minuscule ;
- éléments coupés ;
- métriques inventées ;
- animations partout ou apparition de tout en un bloc quand le discours exige une progression.
