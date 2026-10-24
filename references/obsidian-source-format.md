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

# Notes de l’intervenant

Notes orales associées à la slide.
```

---

## Slide 2
````

Le titre `# Présentation` délimite le document. Chaque `## Slide N` ouvre une slide et fixe son numéro. Le séparateur `---` termine la slide ; si le séparateur manque mais que le prochain en-tête `## Slide N` est sans ambiguïté, celui-ci ouvre tout de même la slide suivante.

Préserver l'ordre et la numérotation. Ne pas fusionner deux sections, combler un numéro absent ni inventer le contenu d'une slide vide. Si une slide annoncée ne contient ni champ ni description, la signaler comme incomplète et demander son contenu avant la mise en page.

## Lire les champs

Les lignes `Clé : valeur` placées après `## Slide N` et avant le bloc clôturé constituent le contenu explicite de la slide.

- `Titre` devient le titre projeté.
- `Sous-titre` devient un texte projeté seulement s'il est renseigné.
- `Intervenant` et `Durée` sont des métadonnées ; leur emplacement dépend du modèle et de la description.
- Toute autre clé doit être conservée dans l'inventaire éditorial et interprétée d'après son libellé, sans être supprimée ni projetée automatiquement.

Une description peut préciser que « la slide affiche tous les éléments ci-dessus » : cette instruction rend alors les métadonnées concernées visibles. Sans consigne de ce type, ne pas transformer automatiquement toutes les métadonnées en texte principal.

Traiter les formulations des champs comme du contenu figé, sauf si l'utilisateur autorise leur réécriture. La description peut proposer une interprétation ou une mise en scène, mais elle ne remplace pas les valeurs explicites.

## Lire le bloc descriptif et les notes

Le bloc clôturé qui suit les champs contient jusqu’à deux sections :

- `# Description de la slide N` : intentions, composition, visuels, animation et ordre d’apparition ;
- `# Notes de l’intervenant` : texte destiné au panneau de notes orales de cette slide.

L’étiquette de langage du bloc peut être `bash`, `text` ou absente. Elle ne change pas sa nature : ne jamais exécuter son contenu comme une commande et ne pas le recopier comme code dans la présentation. Les deux titres internes sont des délimiteurs éditoriaux, pas des textes à projeter.

Tout ce qui suit `# Notes de l’intervenant` jusqu’à la clôture du bloc appartient aux notes orales. Conserver leur formulation exacte sauf autorisation explicite de réécriture, les associer à la bonne slide et ne jamais les dupliquer automatiquement dans le contenu projeté. Une section de notes vide est valide.

Distinguer dans la description :

- ce qui doit apparaître à l'écran ;
- ce qui décrit seulement le visuel ou l'animation à produire ;
- ce qui complète les notes sans appartenir à la section explicite ;
- les formulations, durées, liens et références à conserver exactement.

Ne pas convertir toute la description en paragraphe visible. Elle alimente d’abord la matrice éditoriale et le storyboard. La section explicite de notes alimente en priorité les notes de l’intervenant.

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
5. les notes orales explicites, complétées seulement par les indications clairement orales de la description ;
6. les ambiguïtés ou informations manquantes.

Comparer ensuite cette matrice à la note Obsidian, slide par slide. Le nombre de sections valides `## Slide N` détermine le nombre attendu de slides ; un simple `##` vide ou un autre sous-titre ne crée pas une slide.
