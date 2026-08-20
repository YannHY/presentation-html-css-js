# Retouches ciblées

## Établir le contrat de delta

Avant de modifier le fichier, noter :

- **cible** : nœud, composant, slide ou comportement à changer ;
- **delta demandé** : modification observable attendue ;
- **invariants** : contenu, fond, bordure, rayon, taille, position, animation, interaction et accessibilité à préserver ;
- **portée** : locale, généralisable ou globale.

Appliquer le plus petit diff compatible avec la demande.

## Inspecter l'anatomie du composant

Repérer avant édition :

- le nœud HTML ou SVG ciblé ;
- son cadre parent et ses surfaces ;
- les règles CSS partagées ;
- les keyframes et déclencheurs JavaScript ;
- les composants frères susceptibles d'hériter de la modification.

Ne pas confondre un enfant avec son conteneur. Supprimer un contrôle ne doit pas supprimer le fond, la bordure, les arrondis, le clipping ou l'animation du composant parent.

Exemple : pour « supprimer le bouton de lecture », retirer uniquement le groupe du bouton, conserver le cadre blanc, son rayon et l'onde, puis recentrer l'onde sans reconstruire le bloc.

## Exploiter les remarques cumulées

Tenir un registre de travail minimal :

- choix approuvés ;
- choix rejetés ;
- préférences globales ;
- demande locale actuelle.

Classer chaque retour :

- **local** : ralentir une éclipse, retirer un bouton ;
- **généralisable** : supprimer les textes redondants, homogénéiser les éléments frères ;
- **global** : éviter le beige, employer des cadres blancs.

Corriger d'abord la cible. Auditer ensuite les analogues pour les règles généralisables, sans copier une solution locale ni modifier un élément déjà validé.

## Vérifier avant et après

1. Capturer l'état précédent au viewport utilisé par l'utilisateur si disponible.
2. Appliquer le delta.
3. Capturer le même état, au même viewport et au même moment de l'animation.
4. Comparer fond, rayon, dimensions, alignement, espacement, texte et comportement.
5. Tester la slide modifiée, ses voisines, chaque build concerné et un format étroit.
6. Inspecter la console.

Ne pas annoncer la correction tant qu'un changement collatéral non demandé subsiste.

## Préserver la fonction narrative

- Ne jamais résoudre un défaut technique en supprimant le mouvement, l'information ou la progression demandés.
- Reproduire le défaut dans le navigateur, le mode plein écran et l'échelle réellement concernés avant de choisir la correction.
- Pour une trajectoire SVG importante, préférer l'animation d'un attribut géométrique SVG à une transformation CSS lorsque Safari ou le plein écran interprète différemment le repère de transformation.
