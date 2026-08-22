# Calendrier interactif

Composant pour projeter un programme daté — année scolaire, saison, cycle de rendez-vous. Trois vues réellement navigables : **Semaine, Mois, Année**.

## Choisir la vue selon l'étendue des données

- **Une semaine ne contient pas un programme annuel.** Avant de choisir, calculer l'étendue : si les dates franchissent deux semaines, une vue semaine unique est impossible ; si elles couvrent plusieurs mois, la vue Année est la seule qui les tienne toutes.
- **Ne pas proposer de vue Jour** sans heures de début. Un quadrillage horaire vide est un décor. Plus largement, ne proposer que les vues que les données peuvent remplir.
- La vue par défaut est celle qui porte le message : Année pour « voici le rythme de l'année », Mois pour « voici le détail du mois ».

## Établir la couverture avant de dessiner

Un calendrier rétrospectif peut être techniquement correct et néanmoins paraître vide. Avant la mise en page, construire une matrice **période × catégorie** et compter :

- le nombre total d'évènements ;
- le nombre de dates actives distinctes ;
- les évènements par mois et par catégorie ;
- les mois ou catégories sans entrée.

Une demande comme « principaux évènements » n'autorise pas à choisir arbitrairement quelques annonces célèbres. Définir les familles attendues à partir du sujet — par exemple recherche, modèles, logiciels, usages, matériel, infrastructure et régulation — puis vérifier que chacune est réellement représentée. Pour une actualité historique, conserver dans les données la date, un résumé, la catégorie et une URL source ; distinguer clairement date précise, mois connu et période approximative.

Ne pas fixer un quota universel. La densité acceptable dépend du sujet, mais le titre, la légende et le jeu de données doivent annoncer le même total. Une couverture inégale peut être juste ; elle doit résulter des sources, pas d'un oubli de collecte.

## Contrôles réels, jamais décoratifs

La skill interdit les contrôles factices. Un sélecteur de vue dessiné mais inerte en est un : soit il fonctionne, soit il n'existe pas.

- Employer de vrais `<button>` avec `aria-pressed` pour la vue active, dans un conteneur `role="group"` et `aria-label`.
- **Ne pas reproduire le chrome de fenêtre** du système (pastilles rouge-jaune-vert, barre de titre) : ce sont des contrôles qui ne fonctionneront jamais. Le calendrier seul suffit, sur une surface lisible.
- Quand une vue rend une navigation sans objet — les chevrons en vue Année s'il n'y a qu'une année — **masquer** les chevrons plutôt que d'afficher un contrôle sans effet.
- Aux bornes de la période, `disabled` est un état légitime : le bouton existe, il est visiblement inactif.

## Gestion du focus, sinon le clavier du deck se bloque

`presentation.js` ignore les flèches quand le focus est sur un `BUTTON`. Sans précaution, un clic sur « Mois » gèle la navigation entre slides.

```js
btn.addEventListener('click', event => {
  changerDeVue(btn.dataset.view);
  if (event.detail > 0) btn.blur();   // clic souris : rendre le clavier au deck
});                                    // detail === 0 : activation clavier, garder le focus
```

Tester les deux chemins séparément. Un `element.click()` programmatique a `detail === 0` : il ne teste **pas** le chemin souris. Émettre `new MouseEvent('click', {detail: 1})` pour cela.

## Géométrie stable entre les vues

Trois rendus de hauteurs différentes font sauter tout ce qui les suit. Mesurer la hauteur de chacun, puis fixer sur le conteneur un `min-height` égal au plus haut :

```css
.cal-views { min-height: 311px; } /* hauteur du plus haut des trois rendus */
```

Vérifier ensuite qu'un repère situé sous le calendrier — la légende — occupe la **même** ordonnée dans les trois vues.

## Une surface principale, pas une collection de cartes

Pour une esthétique de calendrier d'application sobre et raffinée :

- employer une surface principale claire, éventuellement légèrement translucide, avec un rayon généreux et une ombre diffuse ;
- structurer l'intérieur par des séparateurs fins plutôt que par une carte arrondie et ombrée pour chaque mois ou chaque jour ;
- traiter le sélecteur Semaine/Mois/Année comme un contrôle segmenté : fond gris très léger, état actif blanc et ombre courte ;
- réserver les couleurs fortes à l'identification des catégories, pas aux grandes surfaces ;
- conserver des espacements généreux autour du composant, sans réduire la grille pour créer artificiellement du vide.

L'effet translucide reste un enrichissement : prévoir un fond opaque lisible si `backdrop-filter` n'est pas disponible.

## Vue annuelle : rendre les dates actives lisibles

Une vue annuelle compacte ne doit pas coller de simples points aux chiffres : l'association entre le repère et le jour devient ambiguë. Préférer une **cellule de date légèrement teintée** avec un filet ou une courte barre de catégorie sur son bord inférieur.

- Garder le chiffre au centre et le code couleur à la périphérie.
- Pour plusieurs évènements le même jour, partager la barre entre les catégories et ajouter un petit badge numérique séparé du chiffre.
- Employer un badge clair à texte sombre ; une pastille noire minuscule attire trop l'œil et ressemble à une annotation parasite.
- Limiter l'agrandissement au survol : un facteur proche de `1.1` suffit. Un zoom important masque les dates voisines.
- Sur une grille de douze mois, supprimer les cadres individuels et utiliser des séparateurs internes continus afin que l'année se lise comme un seul objet.

La vue annuelle donne la distribution ; le détail appartient au pop-up ou aux vues Mois et Semaine. Ne pas y faire tenir les titres des évènements.

## Pastilles d'évènement sur une seule ligne

C'est le piège de hauteur le plus coûteux. Une série récurrente ajoute une pastille à presque chaque rangée ; si son libellé se replie sur deux lignes, **toutes** les rangées grandissent et la vue Mois déborde.

```css
.cal-chip { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
```

- Mettre le libellé complet dans `title` pour que la troncature ne perde rien.
- Raccourcir l'intitulé de l'évènement plutôt que d'élargir la cellule : « Key users » au lieu de « Réunion Key users », la catégorie portant déjà le mot.
- Contrôler le mois qui compte **six** rangées, pas seulement le premier venu ; c'est lui qui dimensionne la vue.

Pour éviter l'effet « étiquette criarde », une pastille peut employer un fond teinté clair, un texte dérivé de la couleur de catégorie et un filet coloré à gauche. Réserver l'aplat saturé aux états qui exigent une forte insistance.

Quand une cellule mensuelle contient plus d'évènements qu'elle ne peut en montrer, afficher les premiers puis un vrai bouton `+ N autres` ouvrant la liste complète. En semaine, afficher tous les évènements du jour tant que la hauteur commune reste stable.

## Séries récurrentes

- Une récurrence n'est exploitable qu'avec une **date de départ**. « Toutes les semaines le vendredi » donne le rythme, pas l'origine : sans elle, ne rien placer et le dire.
- **Dérouler la série et vérifier les collisions** avec les jours fériés et les vacances avant de l'afficher. Une série hebdomadaire naïve depuis septembre tombe sur Noël et le Jour de l'an. Sauter ces dates, préserver le nombre d'occurrences annoncé, et signaler l'hypothèse.
- Donner à une série récurrente sa **propre couleur** si une catégorie voisine existe déjà : dix-huit points d'une couleur déjà employée rendent l'ancienne indistinguable.

## Légende : réconcilier les décomptes avec ce qui est peint

Une légende qui compte autre chose que ce que l'œil voit est un défaut. Croiser systématiquement, catégorie par catégorie, le décompte affiché et le nombre de repères réellement peints de cette couleur. Ce contrôle révèle des écarts invisibles à la lecture :

- **Entrée multi-jours** : une plage est une entrée pour N repères. Annoter l'étendue — `1 · 7 j` — plutôt que de compter les jours partout, car les entrées connues au mois près tomberaient alors à zéro.
- **Entrée sans date précise** : elle figure dans la légende mais n'a aucun repère. La marquer d'un astérisque, expliqué dans la légende elle-même.
- **Journée cumulant deux évènements** : si la pastille ne prend que la couleur du premier, la seconde catégorie disparaît et son décompte devient faux. Porter les deux couleurs — remplissage pour la première, anneau pour la seconde.

## Légende : mise en page

- **Réduire la taille du texte ne résout pas un repli de libellé** quand la pastille et le décompte occupent une largeur fixe : à colonnes trop nombreuses, les libellés se replient à toute taille. Mesurer plusieurs combinaisons colonnes × taille et retenir celle où aucun libellé ne se replie.
- Des colonnes en `1fr` prennent toutes la largeur du plus long item du tableau. Une colonne de libellés courts laisse alors un grand vide avant la suivante. **Aligner les décomptes à droite** (`margin-left: auto`) rend l'écart perçu constant par construction ; des colonnes en `max-content` ne le font pas.
- Aligner libellé et décompte sur la **ligne de base**, pas sur le centre : au centre, un libellé replié décale son décompte de plusieurs pixels et l'alignement devient irrégulier d'une ligne à l'autre.
- Une grille de N colonnes laisse des cellules libres quand les items ne sont pas un multiple de N : y placer une mention utile — la légende de l'astérisque — coûte zéro hauteur.
- Laisser un espace perceptible entre le bord inférieur du calendrier et la légende. Dans une maquette de 1200 px de large, une marge de l'ordre de **12 à 16 px** constitue un bon point de départ ; la mesurer avec la réserve verticale plutôt que de coller la légende pour gagner quelques pixels.

## Fiches de détail

Une même fiche peut servir les vues Année, Mois et Semaine. Elle doit afficher au minimum la date, le titre, un résumé et la source ; pour une date cumulant plusieurs évènements, remplacer le détail unique par une liste complète.

- Borner les quatre côtés de la fiche à la surface du calendrier, pas seulement à la fenêtre.
- Autoriser fermeture par second clic, `Échap`, bouton dédié et clic extérieur.
- Employer une surface claire ou sombre cohérente avec le calendrier ; sur une interface claire et raffinée, un panneau blanc translucide avec ombre diffuse évite une rupture brutale.
- Garder les liens réellement cliquables et indiquer visuellement la source sans afficher une URL longue.

## Chiffres dans un repère circulaire

Le centrage de la boîte de ligne peut être parfait alors que l'encre du chiffre ne l'est pas : les métriques de la police ne sont pas symétriques. Mesurer, ne pas juger à l'œil :

```js
const c = document.createElement('canvas').getContext('2d');
c.font = `${poids} ${taille} ${famille}`;
const m = c.measureText('28');
// centre de l'encre vs centre de la boîte -> compensation
```

Compenser par un `padding-bottom` sur un conteneur en flex centré. **La compensation dépend de la taille de police** : la recalculer après tout changement de taille, sinon le décalage revient.

## Données

Un tableau d'objets suffit, les plages étant développées en jours :

```js
{ d: '2026-09-18', t: 'Key users', c: 'Réunion Key users', h: '13 h' }
```

- Générer ce tableau par script depuis la source, et générer aussi les grilles mensuelles : onze grilles écrites à la main sont une source d'erreurs d'alignement de jours.
- **Vérifier les jours de semaine annoncés** par la source avant de construire. Le contrôle est immédiat et évite de projeter une erreur.
- L'heure n'est affichée que dans les vues Mois et Semaine, où la place existe ; en vue Année elle reste dans l'infobulle.

## Vérification propre au composant

- Piloter réellement les trois vues et relever, pour chacune, la réserve verticale de la slide.
- Parcourir **tous** les mois et **toutes** les semaines de la période, pas seulement le rendu par défaut : le pire cas est ailleurs.
- Vérifier les deux bornes de navigation et l'état `disabled` qui leur correspond.
- Vérifier qu'aucune pastille ne se replie et que le libellé complet reste accessible.
- Croiser décomptes de légende et repères peints, par catégorie.
- Produire un rapport automatique contenant au moins : mois rendus, semaines parcourues, dates actives, total d'évènements, état des filtres et erreurs de console.
- Capturer les trois vues au même viewport, puis la vue annuelle aux formats `1280×720`, `1366×768`, `1600×900` et `2560×1440` ; vérifier que la légende reste dégagée et que la réserve verticale demeure positive.
- Ouvrir une date simple, une date cumulant plusieurs évènements et des dates proches des quatre bords pour éprouver la fiche partagée.
