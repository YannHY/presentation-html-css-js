# Téléphone et tablette

## Concevoir un vrai repli étroit

Sous le seuil où la maquette fixe n'est plus lisible, abandonner franchement sa géométrie : largeur fluide, `zoom: 1`, contenu empilé et défilement vertical de la slide active. Ne pas seulement réduire la maquette de bureau ni compter sur une règle générique comme `.example-grid` : chaque composition spécifique — couverture, calendrier, comparaison, chatbot, conclusion — doit définir son propre repli.

Préserver l'ordre éditorial. Une composition en deux colonnes devient une suite logique ; le visuel et sa légende restent ensemble ; les commandes essentielles ne disparaissent pas. Réduire ou masquer seulement les ornements sans fonction.

## Éviter les collisions propres aux petits écrans

- Tenir compte de `env(safe-area-inset-top)`, `right`, `bottom` et `left` pour les appareils à encoche et la barre d'accueil.
- Ne pas ancrer un QR code, un logo ou une métadonnée dans le même coin qu'un autre élément à l'aide de positions fixes indépendantes. Les placer dans un même conteneur ou définir explicitement leur priorité et leur repli.
- Réserver l'espace de la barre de commandes dans la hauteur de la scène. Vérifier que le dernier élément reste atteignable au défilement.
- Sur une couverture, contrôler séparément le titre le plus long, la date, l'auteur, le QR code et le visuel dominant ; ils ne doivent pas se recouvrir quand le navigateur affiche ses barres.
- Éviter les zones tactiles inférieures à `44 × 44 px` et laisser un espacement suffisant entre commandes voisines.
- Utiliser `100dvh` lorsqu'une hauteur dynamique est nécessaire, avec un repli raisonnable, plutôt que supposer que `100vh` exclut le chrome mobile.

## Plein écran et mode présentation

Tester la capacité avant d'appeler l'API : `document.documentElement.requestFullscreen` ou son équivalent réellement disponible. Certains navigateurs mobiles ne permettent pas le plein écran d'un document arbitraire.

Dans ce cas, ne pas laisser un bouton inerte et ne pas prétendre masquer le chrome du navigateur. Fournir un **mode présentation** qui active le séquençage, ferme les panneaux, occupe tout le viewport disponible et conserve la navigation. Son libellé accessible et son infobulle doivent dire « mode présentation », pas « plein écran ». L'utilisateur peut encore employer l'installation sur l'écran d'accueil ou les commandes du navigateur pour gagner de la place.

Le mode présentation de repli doit partager le même état CSS que le plein écran pour les builds, tout en restant réversible par le bouton et par `Escape`.

## Matrice minimale de vérification

Tester avec le contenu réel, toutes les langues et tous les builds révélés :

- téléphone étroit en portrait, autour de `390 × 844` ;
- grand téléphone en portrait, autour de `430 × 932` ;
- téléphone en paysage, autour de `844 × 390` ;
- tablette en portrait, `768 × 1024` ;
- tablette en paysage, `1024 × 768`.

À chaque format, vérifier :

1. couverture et dernière slide, notamment QR code, date, auteur et titre ;
2. toutes les compositions spécifiques, pas seulement les cartes génériques ;
3. défilement jusqu'au dernier pixel utile sans contenu sous la barre ;
4. boutons précédent/suivant, notes, langue, minuteur et mode plein écran ou présentation ;
5. balayage tactile sans déclenchement pendant un défilement vertical ;
6. orientation modifiée pendant une slide et recalcul correct de la mise en page ;
7. absence d'erreur console et de contrôle inaccessible.

Une simulation de viewport est nécessaire mais ne prouve pas le comportement du plein écran, du chrome ni des zones sûres : pour une livraison annoncée comme compatible iPhone ou iPad, effectuer aussi un essai sur le navigateur cible ou signaler explicitement cette limite.
