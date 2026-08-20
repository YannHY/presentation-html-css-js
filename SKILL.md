---
name: create-interactive-html-presentations
description: Créer, adapter, intégrer et vérifier des présentations HTML interactives, éditoriales et visuellement soignées à partir d'un contenu brut, d'un plan, de données ou d'un document source. Utiliser cette skill pour produire des slides web navigables, transformer des notes en diaporama, reproduire une direction visuelle fournie, ajouter des animations narratives ou retoucher précisément une présentation HTML existante sans modifier les éléments non demandés.
---

# Présentations HTML interactives

Comprendre d'abord la présentation, concevoir chaque slide selon son message, puis ne conserver que les mots, cadres et mouvements qui remplissent une fonction identifiable.

## Ordre de priorité

Respecter, dans cet ordre :

1. la demande actuelle et les remarques cumulées de l'utilisateur ;
2. les contenus, chiffres, citations, nombres de slides et références fournis ;
3. l'architecture, le design system et les choix déjà approuvés dans le projet ;
4. les valeurs par défaut de cette skill.

Ne jamais laisser une préférence générique de la skill remplacer une instruction ou une référence explicite.

## Choisir le mode de travail

- **Création ou refonte** : lire [references/editorial-contract.md](references/editorial-contract.md) et [references/design-language.md](references/design-language.md) avant de coder.
- **Retouche ciblée** : lire [references/targeted-edits.md](references/targeted-edits.md). Lire aussi `design-language.md` seulement si la demande redessine ou ajoute un composant.
- **Modification mêlant contenu et mise en scène** : appliquer les trois références.
- **Export PowerPoint** : le livrable par défaut de cette skill est une **page web**. Ne produire un `.pptx` que sur demande explicite, et lire alors [references/export-powerpoint.md](references/export-powerpoint.md). Employer le mode `images`, fidèle, qui capture chaque état ; ne proposer le mode `natif` que pour un deck purement textuel, car il ne porte que du texte et vide une présentation visuelle.
- **Calendrier ou programme daté** : lire [references/interactive-calendar.md](references/interactive-calendar.md) avant de composer une vue calendaire, un agenda ou une frise de rendez-vous.
- **Insertion ou suppression de slide** : lire la section correspondante de [references/verification-mesuree.md](references/verification-mesuree.md). Les identifiants doivent rester contigus et des sélecteurs CSS visent des slides par leur numéro.
- **Modèle 1** : lorsque l'utilisateur demande ce modèle ou qu'une présentation existante emploie déjà son fond cadrillé, sa palette bleu-vert et sa barre inférieure, lire [references/presentation-model-1.md](references/presentation-model-1.md). Pour une nouvelle présentation, copier `assets/presentation-template-1/` puis remplacer le contenu d'exemple. Ne jamais appliquer ce modèle par défaut à un autre projet.
- **Modèle 2** : lorsque l'utilisateur demande ce modèle, ou qu'une présentation existante emploie déjà son cambré institutionnel en pleine hauteur sur le bord gauche et ses deux bleus `#0b4295` et `#006eb7`, lire [references/presentation-model-2.md](references/presentation-model-2.md). Pour une nouvelle présentation, copier `assets/presentation-template-2/` puis remplacer le contenu d'exemple et le logo. Ne jamais appliquer ce modèle par défaut à un autre projet.
- **Modèle 3** : lorsque l'utilisateur demande un mode sombre, ce modèle, ou qu'une présentation existante emploie déjà son fond `#0b1220` et ses surfaces sombres, lire [references/presentation-model-3.md](references/presentation-model-3.md). Pour une nouvelle présentation, copier `assets/presentation-template-3/`. C'est le modèle 1 en sombre : mêmes classes et même JavaScript. Ne jamais appliquer ce modèle par défaut à un autre projet.

## Workflow de création ou de refonte

1. Inspecter entièrement les fichiers source, les notes, la présentation existante et les conventions du projet.
2. Établir le contrat éditorial slide par slide avant toute mise en page. Verrouiller le nombre de slides demandé et séparer texte projeté, notes orales, visuel et étapes d'apparition.
3. Examiner réellement chaque site, vidéo, timestamp ou capture de référence. En extraire palette, typographie, densité, espacements, rayons, compositions et rythme des animations.
4. Construire le storyboard. Affecter une idée principale et une preuve visuelle à chaque slide. Ne pas transformer automatiquement les notes de l'intervenant en texte visible.
5. Identifier les contenus figés : toute demande comme « reprendre tel quel » interdit la paraphrase, la condensation et la suppression.
6. Implémenter en préservant le design system existant. Pour une création autonome, produire un `index.html` unique sauf demande ou convention contraire.
7. Exécuter `python3 scripts/validate_presentation.py <index.html> --expected-slides N`, où `N` vient du contrat éditorial, puis corriger erreurs et avertissements pertinents.
8. Vérifier visuellement toutes les slides dans un navigateur. Tester chaque état d'apparition et chaque animation sémantique.
9. Auditer les remarques généralisables sur l'ensemble du deck sans propager aveuglément une solution locale.

## Protocole de retouche ciblée

Traiter toute retouche comme un **contrat de delta** :

- définir précisément ce qui doit changer ;
- énumérer ce qui doit rester invariant ;
- appliquer le plus petit diff possible ;
- conserver conteneurs, fonds, bordures, rayons, dimensions, espacements, animations et comportements accessibles non visés ;
- comparer avant et après au même viewport ;
- ne pas annoncer la correction avant vérification visuelle.

Distinguer un retour local, une règle généralisable et une préférence globale. Corriger localement d'abord ; auditer ensuite les composants analogues seulement lorsque le principe se transpose sans détruire un choix approuvé.

## Contrat d'interface

Pour une création ou une refonte complète, inclure :

- une navigation de chapitres adaptée à la direction visuelle ;
- le chapitre actif et les chapitres déjà visités ;
- un compteur et une progression discrets ;
- des commandes précédent, suivant, notes et plein écran ;
- les raccourcis `ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Home`, `End`, `Space`, `F` et `Escape` ;
- un geste horizontal sur écran tactile ;
- un focus visible, des noms accessibles et une URL ou un hash stable.

Ne jamais afficher un contrôle factice. Tout bouton, menu, sélecteur, bouton de lecture, filtre ou chevron doit fonctionner réellement ; sinon le supprimer ou le traiter comme un élément statique sans affordance interactive. Utiliser Font Awesome 6 ou des SVG cohérents pour les commandes compactes, avec `aria-label` et infobulle.

Lors d'une retouche, préserver le contrat d'interface existant sauf demande explicite.

## Implémentation

- Utiliser HTML, CSS et SVG par défaut. Réserver Three.js aux informations réellement spatiales.
- Définir couleurs, espacements, rayons et typographies avec des variables.
- Suspendre les animations hors de la slide active.
- Maintenir une géométrie fixe pendant les apparitions afin d'éviter les sauts de mise en page.
- Ne pas introduire de dépendance distante indispensable à une présentation locale sans fallback.
- **Plafonner la largeur de tout SVG en ligne placé dans une colonne.** Un `viewBox` dont le rapport diffère de celui de sa colonne se dilate : 400×360 dans une colonne de 660 px donne 594 px de haut et fait déborder la slide. Poser un `max-width` en même temps que la figure, pas après la mesure.
- **N'écrire aucun sélecteur visant un numéro de slide.** Ni `#slide-7` en CSS, ni `'#slide-7'` en JavaScript : passer par des classes et des identifiants porteurs de sens. C'est ce qui rend une insertion ou un réordonnancement de slides sans danger, alors que la renumérotation la plus soigneuse finit par casser une règle oubliée.
- **Appliquer la typographie française au texte projeté** : espace fine insécable avant `?`, `!` et `;`, espace insécable avant `:`, et à l'intérieur des guillemets français. Attention en revanche à ne pas passer un remplacement global sur le JavaScript : `a ? b : c` y survivrait mal. Traiter le balisage en bloc, les chaînes du script une par une.

### Le cadre de maquette

Une slide n'est pas une page web qui s'adapte : c'est une **maquette de taille fixe**, mise à l'échelle d'un seul bloc. Les trois modèles fournis appliquent déjà ce cadre ; le respecter est ce qui distingue un deck qui tient à toutes les tailles d'un deck qu'il faut re-régler à chaque fenêtre.

- **Le cadre fait 1310 × 700 pixels de dessin**, dont 1200 de contenu (`.slide-inner`). Le facteur `--slide-scale` est calculé en JavaScript depuis la place réellement disponible dans la slide, plafonné à 2,4, et appliqué par `zoom` sur `.slide-inner`. Composer en pixels de maquette : à 1200 de large et 700 de haut, tout ce qui tient tient partout.
- **Recalculer l'échelle à chaque changement de taille**, y compris ceux que `resize` ne signale pas : un `ResizeObserver` sur la scène couvre le volet d'aperçu qui se rétrécit, l'entrée en plein écran et le changement de slide.
- **Aucune taille ne doit dépendre de `vw` ou `vh` à l'intérieur du cadre.** Une unité de fenêtre placée dans un élément mis à l'échelle se réfère à la fenêtre réelle, pas au cadre : le texte grandit alors deux fois, ou pas du tout. Geler le barème typographique en pixels. Les unités de fenêtre ne restent légitimes que dans les habillages en `position: fixed`, qui vivent hors du cadre.
- **Aucune requête de média ne doit restructurer la mise en page au-dessus du seuil de repli** (900 px). Une grille qui repasse en une colonne à 980 px alors que le cadre mesure toujours 1200 fait déborder la slide de plusieurs centaines de pixels. Sous le seuil, on abandonne franchement la maquette : `zoom: 1`, largeur fluide, contenu qui défile.
- **Deux systèmes de coordonnées cohabitent.** `getBoundingClientRect()` rend des pixels d'écran ; `style.left` et `style.top` sont relus en pixels de maquette. Tout positionnement calculé depuis un rectangle doit être divisé par le facteur d'échelle — `slideScale()` dans les modèles — sinon il dérive dès que la fenêtre n'est pas exactement à l'échelle 1, et le pop-up d'un jalon de droite finit hors champ. Quand c'est possible, préférer `offsetLeft` et `offsetWidth`, qui sont déjà dans le repère de la maquette.
- **Borner un pop-up sur sa demi-largeur réelle**, pas sur une constante : `placePop()` dans les modèles. Une marge devinée coupe le premier pop-up plus large que prévu.
- **Une seule règle canonique par sélecteur.** Les ajustements empilés au fil des retouches finissent par écraser silencieusement la définition d'origine — deux blocs `.source-list li` en fin de fichier, et la grille repasse à deux colonnes sans raison visible. Modifier la règle existante plutôt qu'en ajouter une plus bas.

### Séquençage obligatoire du contenu

- Dans toute création ou refonte, faire apparaître successivement au clavier les unités de contenu de chaque slide : paragraphes, éléments de liste, cartes, étapes, visuels et conclusions.
- Laisser le titre visible comme repère fixe, puis attribuer un ordre d'apparition explicite à chaque unité avec le mécanisme de build de la présentation.
- Faire parcourir tous les builds de la slide avant de passer à la suivante avec `ArrowRight`, `PageDown` ou `Space`. Avec `ArrowLeft` ou `PageUp`, masquer d'abord la dernière unité révélée avant de revenir à la slide précédente.
- Réserver dès l'état initial la géométrie finale de tous les éléments masqués afin que les apparitions ne déplacent aucun contenu.
- Conserver le séquençage sous `prefers-reduced-motion` ; rendre seulement les transitions instantanées.
- Ne laisser une slide entièrement statique que si elle ne contient qu'une seule unité de contenu en plus de son titre.
- **Réserver au plein écran le séquençage, pas le mouvement.** Distinguer deux choses que l'on confond facilement :
  - les **apparitions** — l'ordre dans lequel les unités se révèlent — restent liées au plein écran. Hors projection, tout est visible d'emblée : on relit et on retouche sans dérouler les étapes. Piloter cela par une fonction unique, `buildsActifs()`, qui exige le plein écran et l'absence de `prefers-reduced-motion`, et rejouer l'état des apparitions à l'entrée comme à la sortie du plein écran ;
  - les **animations sémantiques** — un tracé qui se dessine, un flux qui circule, une simulation qui tourne — s'exécutent dès que leur slide est active, plein écran ou non. Une slide immobile quand on ouvre le fichier passe pour inachevée, et c'est l'un des reproches les plus immédiats qu'on essuie.
- Conséquence à ne pas oublier : tout élément dont l'état initial est masqué par sa règle d'animation doit être rétabli sous `prefers-reduced-motion`, sinon il reste invisible.
- **Rien ne doit avoir commencé avant l'arrivée sur la slide.** C'est le reproche qui revient le plus : « l'animation a déjà tourné ». Trois formes à traiter, pas seulement la première :
  - une **boucle infinie** en CSS doit dépendre de `.slide.active`, sinon elle démarre au chargement de la page et le cycle est déjà entamé quand on arrive. Accrochée à la slide active, elle repart de zéro à chaque visite, gratuitement ;
  - une **animation CSS finie** posée sans condition est terminée avant qu'on arrive : elle ne se verra jamais ;
  - un **enchaînement piloté en JavaScript** — minuteurs, balayage progressif, machine à écrire — se lance dans `onSlideVisit` et se réinitialise en quittant, jamais à la construction de la figure.
  Vérifier ce point pour chaque figure animée : arriver sur la slide et constater que le mouvement part de son début.
- **Ne pas laisser une figure interactive vide à l'arrivée.** Une zone qui attend un clic se lit comme un défaut d'affichage, pas comme une invitation. Afficher un exemple déjà traité, que l'action de l'utilisateur remplace.
- **Cadrer chaque photographie explicitement.** Un `object-fit: cover` par défaut recadre sur le centre : sur un portrait pris en pied, la tête sort du cadre. Poser un `object-position` par image, et basculer en `contain` sur un fond clair pour les captures d'écran et les schémas, qui se lisent en entier ou pas du tout. Vérifier chaque vignette à l'écran, une par une.
- **Donner à chaque atelier une consigne et une légende.** Une phrase qui dit ce qu'on regarde et ce qu'il faut faire, et une légende qui nomme chaque repère du visuel : couleur, forme, trait, zone. Un atelier sans ces deux éléments est joli et incompréhensible.

## Vérification obligatoire

### Contenu

- Confirmer le nombre exact de slides et la mise à jour du compteur.
- Comparer titres, chiffres, citations et passages figés aux sources.
- Vérifier la séparation entre texte projeté et notes.
- Supprimer les répétitions entre titre, sous-titre, légende, visuel et navigation.

### Composition

- Vérifier l'homogénéité des éléments frères.
- Limiter chaque bloc à un seul contenant décoratif principal.
- Contrôler la précision interne des visuels et l'absence de collisions, coupes ou compressions.
- **Mesurer la réserve verticale de chaque slide** — place disponible moins hauteur du contenu — et non `scrollHeight`, qui ne détecte pas le débordement d'un contenu centré verticalement et renvoie de faux « aucun débordement ». Procédure dans [references/verification-mesuree.md](references/verification-mesuree.md).
- Balayer toutes les slides avec tous les builds révélés, à chaque format : `1366×768`, `1600×900`, un format bas comme `1280×720`, un très grand comme `2560×1440`, puis au moins un format étroit pertinent.
- **Exprimer la réserve en pixels de maquette** — la mesure divisée par le facteur d'échelle. Elle doit alors rester la même à toutes les tailles : une réserve qui varie d'un format à l'autre signale qu'une taille dépend encore de la fenêtre. C'est le contrôle qui prouve que le cadre tient.
- Viser une réserve confortable et non nulle : quelques pixels de marge débordent au format immédiatement inférieur.

### Mouvement et interaction

- Tester l'état initial puis chaque clic de chaque slide animée.
- Vérifier que chaque unité de contenu apparaît dans l'ordre au clavier et qu'aucune slide contenant plusieurs unités ne les affiche toutes dès son état initial.
- Vérifier que la navigation arrière masque les builds dans l'ordre inverse avant de changer de slide.
- Capturer le départ, le milieu et l'état final des démonstrations longues.
- Vérifier que les animations internes commencent seulement lorsque leur bloc apparaît et finissent dans un état stable.
- Vérifier `prefers-reduced-motion` sans supprimer le séquençage ni le contenu.
- Tester clavier, tactile, hash, chapitres, compteur, notes, plein écran, focus et console.
- Pour tout contrôle ajouté, piloter réellement chaque état et vérifier qu'il ne bloque pas la navigation clavier du deck : le focus doit être relâché après un clic souris, conservé après une activation clavier.
- Vérifier que les décomptes d'une légende correspondent au nombre de repères réellement peints, catégorie par catégorie.
- **Éprouver tout pop-up partagé sur quatre gestes**, parce qu'un seul panneau sert plusieurs cibles :
  - passer d'une cible à la suivante — le `mouseleave` de l'ancienne arrive *après* le `mouseenter` de la nouvelle et effacerait le pop-up qu'on vient d'ouvrir. Ne refermer que si le panneau appartient encore à la cible qui s'en va ;
  - cliquer sur une cible déjà ouverte : cela doit refermer, sinon le focus laissé par le clic garde le panneau collé à l'écran ;
  - `Échap`, et un clic à côté : les deux referment ;
  - mesurer les quatre bords du pop-up contre la scène, pour chaque cible et à plusieurs échelles. Un pop-up centré sur la dernière cible sort du cadre si rien ne le borne.
- **Détecter les retours à la ligne inutiles par la mesure**, pas à l'œil : pour chaque bloc de texte, regrouper les rectangles de `Range.getClientRects()` par ligne — un rectangle par fragment en ligne, pas un par ligne — puis comparer la ligne la plus large à la place disponible. Au-delà de 70 pixels de maquette perdus, une largeur maximale traîne quelque part.

### Intégrité du fichier après édition

- **Vérifier l'inventaire des visuels après chaque édition du script.** Une substitution de texte sur un fichier entier peut dupliquer un bloc ou en supprimer plusieurs sans que rien ne le signale : `node --check` passe, le validateur passe, et six ateliers ont disparu. Contrôler que chaque identifiant lu par le script existe dans le balisage, qu'aucun en-tête de section n'apparaît deux fois, et qu'aucun conteneur ne reste vide. `scripts/validate_presentation.py` fait ces trois contrôles.
- Préférer les remplacements ancrés sur une ligne ou sur un couple de bornes vérifié aux substitutions globales. Quand on remplace un bloc délimité par deux marqueurs, s'assurer que le second se trouve bien **après** le premier : sinon le découpage recolle le fichier à l'envers.

### Régression

- Capturer toutes les slides lors d'une création ou refonte.
- Pour une retouche, capturer la slide avant/après au même viewport et contrôler les slides voisines.
- Confirmer que seuls les éléments autorisés ont changé.
- Ne jamais déclarer un résultat « vérifié » sans l'avoir effectivement ouvert et inspecté dans un navigateur.

## Ressources

- [references/editorial-contract.md](references/editorial-contract.md) : matrice de contenu, notes, verrouillage et concision.
- [references/design-language.md](references/design-language.md) : direction visuelle, cadres, représentations et mouvement.
- [references/targeted-edits.md](references/targeted-edits.md) : retouches sans effets collatéraux.
- [references/presentation-model-1.md](references/presentation-model-1.md) : modèle visuel optionnel, tokens, cadrillage, métadonnées et barre de commandes.
- `assets/presentation-template-1/` : socle HTML, CSS et JavaScript réutilisable du modèle 1.
- [references/presentation-model-2.md](references/presentation-model-2.md) : modèle visuel optionnel, cambré institutionnel, deux bleus de marque, dégagement du contenu et barre d'en-tête.
- `assets/presentation-template-2/` : socle réutilisable du modèle 2. Même `presentation.js` que le modèle 1, plus `logo.png` à remplacer.
- [references/presentation-model-3.md](references/presentation-model-3.md) : variante sombre du modèle 1, inversion de la hiérarchie des teintes et ratios de contraste mesurés.
- `assets/presentation-template-3/` : socle réutilisable du modèle 3.
- [references/interactive-calendar.md](references/interactive-calendar.md) : vues semaine, mois et année réellement navigables, séries récurrentes, légende et décomptes.
- [references/verification-mesuree.md](references/verification-mesuree.md) : mesure de la réserve, pièges de spécificité et d'animation, renumérotation des slides, limites de l'aperçu.
- `scripts/validate_presentation.py` : contrôle statique, avec nombre de slides attendu en option.
- [references/export-powerpoint.md](references/export-powerpoint.md) : export `.pptx`, choix du mode, crochet de capture, durée et vérification.
- `scripts/export_pptx.py` : exportateur PowerPoint. Dépend de `python-pptx` et, en mode images, de Chrome. Long : lancer en arrière-plan.
