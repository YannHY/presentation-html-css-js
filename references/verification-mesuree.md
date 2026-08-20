# Vérifier par la mesure

Regarder une capture ne suffit pas, et certaines vérifications naïves donnent de faux « tout va bien ». Ce document rassemble les pièges rencontrés et la mesure qui les détecte.

## Le débordement vertical ne se mesure pas avec `scrollHeight`

Les slides centrent leur contenu (`place-items: center`). Quand le contenu dépasse, il dépasse **par le haut et par le bas** : `scrollHeight` ne compte que le débordement inférieur et renvoie souvent `0`. Une slide tronquée passe alors pour saine.

La seule métrique fiable est la **réserve** : place disponible moins hauteur du contenu.

```js
const cs = getComputedStyle(slide);
const dispo = slide.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
const reserve = dispo - slide.querySelector('.slide-inner').getBoundingClientRect().height;
// reserve < 0  =>  contenu rogné, même si scrollHeight vaut 0
```

- Balayer **toutes** les slides, tous les builds révélés, à chaque format testé.
- Viser une réserve confortable, pas nulle : une réserve de quelques pixels déborde au format immédiatement inférieur.
- Après toute correction de hauteur, remesurer la slide corrigée **et** les autres : un réglage global les touche toutes.
- **Remesurer après chaque ajout de contenu, pas seulement après une correction.** Ajouter une consigne et une légende à un atelier coûte une centaine de pixels et fait déborder plusieurs slides d'un coup.

## Mesurer dans le repère de la maquette, et non en pixels d'écran

Le contenu d'une slide est mis à l'échelle d'un bloc (`zoom: var(--slide-scale)` sur `.slide-inner`). Une mesure brute varie donc avec la fenêtre et n'est comparable à rien. Diviser toute mesure par le facteur :

```js
const echelle = () => {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slide-scale'));
  return v > 0 ? v : 1;
};
const reserve = Math.round((scene.height - contenu.height) / echelle());
```

Exprimée ainsi, **la réserve doit être identique à toutes les tailles de fenêtre**. C'est l'invariant à prouver :

| fenêtre | facteur | pire réserve |
| --- | --- | --- |
| 1100 × 620 | 0,811 | 120 |
| 1280 × 720 | 0,954 | 120 |
| 1600 × 900 | 1,211 | 120 |
| 1920 × 1080 | 1,466 | 122 |
| 2560 × 1440 | 1,954 | 130 |

Une réserve qui varie franchement d'une ligne à l'autre dénonce une taille encore accrochée à la fenêtre : un `clamp()` en `vw`, une largeur en pourcentage de la fenêtre, une requête de média qui restructure au-dessus du seuil de repli.

Piège de sonde : après un redimensionnement, le facteur est mis à jour par un `ResizeObserver`, donc *après* l'événement. Une fonction de mesure qui lit `--slide-scale` à son entrée peut travailler avec l'ancienne valeur. Relancer la sonde une seconde fois, ou relire la propriété juste avant chaque calcul.

## Vérifier un pop-up sur ses quatre bords

Un pop-up est le premier élément à sortir du cadre, parce qu'il est positionné par calcul et non par le flux. La mesure utile compare ses quatre bords à ceux de sa scène, pour chaque cible, à plusieurs échelles :

```js
const d = {
  gauche: (scene.left - pop.left) / echelle,
  droite: (pop.right - scene.right) / echelle,
  haut:   (scene.top - pop.top) / echelle,
  bas:    (pop.bottom - scene.bottom) / echelle
};
// une valeur > 0 = ce bord dépasse
```

Deux signatures à savoir lire :

- **tous les pop-ups dépassent du même côté, jamais de l'autre** : le positionnement n'a pas été appliqué du tout. Chercher une exception silencieuse dans le gestionnaire — une fonction utilitaire déclarée dans l'IIFE du moteur n'est pas visible depuis l'IIFE d'une figure, et le `ReferenceError` interrompt l'affichage juste après avoir démasqué le panneau ;
- **le dépassement grandit avec la fenêtre** : un rectangle d'écran a été écrit dans une propriété lue en pixels de maquette, sans division par le facteur.

## Détecter les coupes de texte inutiles

« Le texte va à la ligne alors qu'il reste de la place » se mesure. Attention au piège : `Range.getClientRects()` rend **un rectangle par fragment en ligne** — un `<b>` au milieu d'un paragraphe en produit trois — et non un par ligne. Comparer le plus large de ces fragments à la largeur disponible produit des dizaines de faux positifs. Il faut d'abord regrouper par bande verticale :

```js
const lignes = [];
rects.forEach(r => {
  const l = lignes.find(x => Math.abs(x.top - r.top) < Math.max(3, r.height * 0.5));
  if (l) { l.left = Math.min(l.left, r.left); l.right = Math.max(l.right, r.right); }
  else lignes.push({ top: r.top, left: r.left, right: r.right });
});
const perdu = (dispo - Math.max(...lignes.map(l => l.right - l.left))) / echelle;
// perdu > 70 px de maquette sur un texte de plusieurs lignes => une largeur maximale traîne
```

## Ne pas rogner à l'aveugle : trouver le vrai moteur de la hauteur

Une slide qui déborde de 12 px ne se corrige pas en réduisant le premier candidat venu. Mesurer bloc par bloc, et se méfier :

- Un `min-height` ne contraint rien si le contenu est déjà plus haut. Le réduire ne gagne alors aucun pixel.
- Dans deux colonnes égalisées par une grille, réduire la plus courte ne gagne rien : c'est la plus haute qui dimensionne.
- Tester plusieurs candidats en injectant du CSS temporaire et lire les chiffres, plutôt que de raisonner :

```js
const st = document.createElement('style'); document.head.appendChild(st);
st.textContent = '.candidat { … }';   // mesurer, comparer, puis st.remove()
```

## Prouver un invariant, ne pas le supposer

Quand une retouche doit laisser un élément exactement en place, le prouver par un témoin. Exemple : compenser un changement d'interligne par un décalage de `top` — la théorie dit que c'est exact, la mesure le confirme sur un élément de contrôle portant les deux réglages successifs. Un écart mesuré de `0` vaut mieux qu'un raisonnement juste.

## Ce que les moteurs animent réellement

**WebKit refuse d'animer en CSS une propriété de peinture SVG posée en attribut.** Un `fill` ou un `stroke` écrit avec `setAttribute` gagne contre les keyframes : le style calculé annonce bien l'animation, et `getAnimations()` renvoie une liste vide.

```js
getComputedStyle(el).animationName   // "ma-pulsation" — l'air d'aller
el.getAnimations().length            // 0 — rien ne tourne
```

Primitives fiables sur du SVG dans tous les moteurs : `opacity`, `stroke-dasharray`, `stroke-dashoffset`, `r`, et `transform: translate()` sur un `<g>`. Tout effet coloré se construit donc par superposition de calques dont on anime l'opacité, jamais en animant la couleur d'un élément qui porte un attribut de peinture.

**`requestAnimationFrame` peut être gelé** — onglet en arrière-plan, panneau d'aperçu occulté. Mesuré à zéro frame en une seconde alors que les animations CSS continuaient de tourner. Deux conséquences :

- préférer CSS pour tout mouvement continu ;
- **ne jamais placer une mise à jour d'état dans un callback rAF.** Calculer et afficher l'état de façon synchrone, puis lancer l'animation qui ne fait qu'illustrer un déplacement déjà décidé. Sinon un compteur reste bloqué à sa valeur initiale pendant que l'utilisateur clique dans le vide.

Le contrôle se fait en échantillonnant la courbe, pas à l'œil :

```js
const a = el.getAnimations()[0];
a.pause(); a.currentTime = a.effect.getTiming().duration * 0.25;
getComputedStyle(el).opacity   // lire la valeur interpolée
```

## Pièges CSS

**La spécificité écrase les styles d'un composant ajouté.** Un `<p>` inséré dans un conteneur `.card` hérite de `.card p` (0,0,2,0), plus spécifique qu'une classe seule (0,0,1,0) : taille et marges déclarées sont silencieusement perdues. Vérifier la valeur *calculée*, pas celle écrite :

```js
getComputedStyle(el).marginBottom  // "0px" alors que la règle dit 16px
```

Cibler depuis le parent du composant pour reprendre la main : `.panel .footnote`, `.card .legende`. **Toute classe utilitaire placée dans une carte ou un panneau doit être ciblée depuis ce parent**, sans exception — la règle vaut pour les marges autant que pour la couleur et le corps.

**`:first-child` ignore les nœuds texte.** `.liste b:first-child` attrape le premier *élément* du conteneur : dans `<span>du texte puis <b>un mot</b></span>`, c'est le mot en gras de la phrase qui est visé. Un `<b>` de numérotation stylé en pastille transforme alors chaque mise en gras du texte en pastille. Ne jamais styler une balise par sa position dans de la prose : passer par une classe.

**Une règle qui paraît morte ne l'est pas forcément.** Déplacer un élément et supprimer la règle qui le visait fait disparaître ce qu'elle portait — un `gap`, une marge. Avant de supprimer, chercher ce que la règle apportait réellement. Et si le style manquant vient d'une règle trop locale, le corriger **à la racine** : les autres occurrences du même composant souffrent probablement du même défaut.

**Ne pas déclarer `opacity: 0` dans la règle d'animation.** Sa spécificité écrase le garde-fou `prefers-reduced-motion`, et le contenu reste invisible pour qui a réduit les animations. Laisser `animation-fill-mode: both` appliquer l'état initial des keyframes ; le garde-fou peut alors rétablir l'opacité.

**Animer le glyphe, pas son support.** Un `<i>` d'icône stylé en pastille *est* la pastille : l'animer dilate le fond. Porter l'animation sur `::before`, qui est le glyphe.

**Un battement régulier n'a pas de temps mort.** Des keyframes concentrées sur les premiers pourcents suivies d'une longue immobilité se lisent comme des à-coups. Un aller-retour unique en `ease-in-out` est régulier. Le contrôler en échantillonnant la courbe :

```js
const a = el.getAnimations({subtree: true})[0];
a.pause(); a.currentTime = t;   // lire le transform calculé, pas juger à l'œil
```

## Insérer une slide sans casser les animations

Les identifiants doivent former une suite contiguë `slide-1..N` — le validateur le vérifie — et des sélecteurs CSS visent des slides par leur numéro.

1. Renuméroter **en ordre décroissant** pour éviter les collisions, avec une borne de chiffre : `slide-12` ne doit pas être attrapé en cherchant `slide-1`.

```python
for n in range(dernier, position - 1, -1):
    s = re.sub(r'slide-%d(?!\d)' % n, 'slide-%d' % (n + 1), s)
```

2. Le littéral JavaScript `` `#slide-${…}` `` ne contient pas de chiffre : il reste intact. Le vérifier tout de même.
3. Après renumérotation, **vérifier que chaque animation vise toujours son contenu** : interroger `#slide-N .selecteur-attendu` pour chacune.
4. Mettre à jour le compteur statique du pied de page.

## Le pane d'aperçu peut mentir

Constaté à répétition dans cette skill : l'aperçu sert des captures et des coordonnées de clic périmées, parfois décalées de dizaines de pixels, et met en cache le fichier.

- Forcer le rechargement par une chaîne de requête (`?v=2`), un simple rechargement ne suffit pas.
- **Les mesures DOM restent fiables** quand les captures ne le sont pas : diagnostiquer par mesure, confirmer visuellement ensuite.
- Un rendu qui « disparaît » après une transition de slide est souvent un défaut de repeinte de l'aperçu, pas du deck : recharger à froid avant de conclure.
- Pour juger un détail de quelques pixels, agrandir temporairement l'élément (`transform: scale(3)`), capturer, puis recharger. Vérifier qu'aucune transformation ne subsiste.
- Ouvrir un onglet neuf donne parfois la seule capture juste.
- La **première capture après une navigation ou un changement de slide est souvent périmée** : en prendre deux et lire la seconde.
- Quand la capture sort à demi-échelle — contenu tassé dans le quart supérieur gauche —, l'action `zoom` renvoie la même vue à l'échelle correcte.
- Si l'outil ne parvient pas à cliquer, tester le gestionnaire en émettant l'évènement voulu ; le dire explicitement dans le compte rendu.

## Vérifier les données de la source

- **Contrôler les jours de semaine annoncés** avant de construire quoi que ce soit de daté : le calcul est immédiat, et une erreur projetée est visible de tous.
- **Additionner les totaux fournis.** Un écart entre la somme des détails et le total annoncé se signale avant de composer, et se laisse hors de la projection tant qu'il n'est pas expliqué.
- Ne jamais afficher un total dérivé de données incomplètes : une frise sans somme ne peut pas contredire un chiffre voisin.
