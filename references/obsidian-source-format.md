# Source Obsidian structurée

## Reconnaître la structure

Une note peut décrire la présentation sous cette forme :

````markdown
# Présentation

## Slide 1

Titre : Titre projeté
Sous-titre : Sous-titre projeté
Intervenant : Nom de l'intervenant
Durée : [Durée de la présentation]

```bash
# Description de la slide 1

Description éditoriale, visuelle et narrative de la slide.
```

---

## Slide 2
````

Le titre `# Présentation` délimite le document. Chaque `## Slide N` ouvre une slide et fixe son numéro. Le séparateur `---` termine la slide ; si le séparateur manque mais que le prochain en-tête `## Slide N` est sans ambiguïté, celui-ci ouvre tout de même la slide suivante.

Préserver l'ordre et la numérotation. Ne pas fusionner deux sections, combler un numéro absent ni inventer le contenu d'une slide vide. Si une slide annoncée ne contient ni champ ni description, la signaler comme incomplète et demander son contenu avant la mise en page.

## Lire les champs

Les lignes `Clé : valeur` placées après `## Slide N` et avant le bloc descriptif constituent le contenu explicite de la slide.

- `Titre` devient le titre projeté.
- `Sous-titre` devient un texte projeté seulement s'il est renseigné.
- `Intervenant` et `Durée` sont des métadonnées ; leur emplacement dépend du modèle et de la description.
- Toute autre clé doit être conservée dans l'inventaire éditorial et interprétée d'après son libellé, sans être supprimée ni projetée automatiquement.

Une description peut préciser que « la slide affiche tous les éléments ci-dessus » : cette instruction rend alors les métadonnées concernées visibles. Sans consigne de ce type, ne pas transformer automatiquement toutes les métadonnées en texte principal.

Traiter les formulations des champs comme du contenu figé, sauf si l'utilisateur autorise leur réécriture. La description peut proposer une interprétation ou une mise en scène, mais elle ne remplace pas les valeurs explicites.

## Lire le bloc descriptif

Le bloc clôturé qui suit les champs est une **description de la slide** : intentions, composition, visuels, animation, ordre d'apparition et éléments à expliquer oralement.

Son étiquette de langage peut être `bash`, `text` ou absente. Elle ne change pas sa nature : ne jamais exécuter son contenu comme une commande et ne pas le recopier comme code dans la présentation. Un titre tel que `# Description de la slide 1` est un repère interne, pas un texte à projeter.

Distinguer dans cette description :

- ce qui doit apparaître à l'écran ;
- ce qui décrit seulement le visuel ou l'animation à produire ;
- ce qui relève des notes de l'intervenant ;
- les formulations, durées, liens et références à conserver exactement.

Ne pas convertir toute la description en paragraphe visible. Elle alimente d'abord la matrice éditoriale, le storyboard et les notes.

## Normaliser les artefacts Obsidian

Normaliser avant l'analyse, sans modifier le sens :

- un antislash final `\` utilisé comme saut de ligne Markdown n'est pas un caractère à afficher ;
- `&#x20;` représente une espace et ne doit pas apparaître dans le rendu ;
- `\---` est un séparateur `---` échappé par le transport ;
- les espaces ajoutés devant une clé après une entité HTML ne changent pas le niveau du champ ;
- les clôtures de blocs et séparateurs ne font pas partie du contenu de la slide.

Appliquer cette normalisation au texte source seulement. Ne pas lancer un remplacement global sur du JavaScript, du CSS ou du HTML déjà généré.

## Construire la matrice éditoriale

Pour chaque section `## Slide N`, reporter dans la matrice :

1. les champs explicites ;
2. les éléments visibles exigés par la description ;
3. le visuel ou la métaphore demandée ;
4. les animations et leur rythme ;
5. les notes orales ;
6. les ambiguïtés ou informations manquantes.

Comparer ensuite cette matrice à la note Obsidian, slide par slide. Le nombre de sections valides `## Slide N` détermine le nombre attendu de slides ; un simple `##` vide ou un autre sous-titre ne crée pas une slide.
