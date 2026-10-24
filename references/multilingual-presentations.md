# Présentations multilingues

## Une langue est un état complet du deck

Traiter chaque langue comme une version complète de la présentation, pas comme une substitution cosmétique. La langue active doit piloter ensemble :

- le texte visible de chaque slide, y compris légendes, unités et textes générés par JavaScript ;
- les notes de l'intervenant ;
- les chapitres, commandes, menus, états, messages et champs éditables ;
- `document.title`, l'attribut `lang` de `<html>`, les métadonnées visibles et les dates ;
- les noms accessibles : `aria-label`, `title`, textes alternatifs, annonces `aria-live` et libellés masqués.

Un bouton réduit à une icône garde un nom accessible traduit. Ne pas exposer un code de langue ou un drapeau si l'interface demandée ne le prévoit pas.

## Traduire depuis des clés stables

Associer chaque contenu traduisible à une clé sémantique stable, par exemple `cover.title`, `controls.next` ou `slides.calendar.notes`. Conserver un dictionnaire par langue et rendre l'interface depuis ces clés à chaque changement.

Ne jamais enchaîner des `replace()` sur le texte déjà affiché. Un remplacement français → anglais suivi d'un autre remplacement peut reconnaître un fragment de la traduction précédente et produire une phrase hybride. Ne pas utiliser non plus le texte source comme identifiant : une correction typographique casserait la clé.

Lorsque le contenu contient du balisage intentionnel, traduire des fragments nommés ou reconstruire explicitement le nœud. Ne pas injecter une chaîne non maîtrisée avec `innerHTML`.

## Préserver la fidélité

- Reporter dans chaque dictionnaire les formulations figées, chiffres, citations, liens et unités du contrat éditorial.
- Ne pas compléter une traduction par des informations absentes de la source.
- Signaler les chaînes manquantes au lieu de revenir silencieusement à une autre langue au milieu d'une slide.
- Conserver une langue source explicite et permettre d'y revenir sans recharger la page.

## Composer pour la langue réelle

La traduction la plus longue est un signal de test, pas une raison de réduire tout le deck. Prévoir des ajustements localisés par langue — largeur d'une colonne, corps d'un titre, césure contrôlée — avec `html[lang="…"]`, sans modifier le cadre fixe ni tasser globalement les autres langues.

Éviter les retours à la ligne forcés dans les titres traduits sauf intention éditoriale. Vérifier les mots longs, les titres sur deux lignes, les guillemets, les espaces insécables et les unités.

## Vérification

Pour chaque langue disponible :

1. recharger directement dans cette langue si elle est persistée, puis parcourir toutes les slides ;
2. vérifier la couverture, les chapitres, le compteur, les notes, les commandes, les états interactifs et la dernière slide ;
3. rechercher les fragments restés dans la langue source et toute phrase hybride ;
4. contrôler coupures, débordements et réserves verticales avec le contenu réellement le plus long ;
5. tester le changement de langue sur plusieurs slides et plusieurs builds, sans perdre la slide active ni l'état de navigation ;
6. relire `document.title`, `html[lang]`, les noms accessibles et la console.

Une capture correcte de la langue source ne valide pas les traductions.
