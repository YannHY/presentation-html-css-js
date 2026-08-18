# Calendrier interactif

Composant pour projeter un programme daté — année scolaire, saison, cycle de rendez-vous. Trois vues réellement navigables : **Semaine, Mois, Année**.

## Choisir la vue selon l'étendue des données

- **Une semaine ne contient pas un programme annuel.** Avant de choisir, calculer l'étendue : si les dates franchissent deux semaines, une vue semaine unique est impossible ; si elles couvrent plusieurs mois, la vue Année est la seule qui les tienne toutes.
- **Ne pas proposer de vue Jour** sans heures de début. Un quadrillage horaire vide est un décor. Plus largement, ne proposer que les vues que les données peuvent remplir.
- La vue par défaut est celle qui porte le message : Année pour « voici le rythme de l'année », Mois pour « voici le détail du mois ».

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

## Pastilles d'évènement sur une seule ligne

C'est le piège de hauteur le plus coûteux. Une série récurrente ajoute une pastille à presque chaque rangée ; si son libellé se replie sur deux lignes, **toutes** les rangées grandissent et la vue Mois déborde.

```css
.cal-chip { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
```

- Mettre le libellé complet dans `title` pour que la troncature ne perde rien.
- Raccourcir l'intitulé de l'évènement plutôt que d'élargir la cellule : « Key users » au lieu de « Réunion Key users », la catégorie portant déjà le mot.
- Contrôler le mois qui compte **six** rangées, pas seulement le premier venu ; c'est lui qui dimensionne la vue.

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
