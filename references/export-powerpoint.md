# Export PowerPoint

**Le mode par défaut de cette skill est la page web.** L'export `.pptx` est une option, à n'employer que sur demande explicite.

```bash
python3 scripts/export_pptx.py chemin/vers/index.html -o sortie.pptx
```

Deux modes. **Le mode par défaut est `images`**, et c'est presque toujours le bon.

## Choisir le mode : ne pas les présenter comme équivalents

**`--mode images`** (défaut) — chaque slide web est capturée par Chrome dans un état statique final et posée en pleine page. Rendu **identique au web** : SVG, cambré, trames de données, calendrier, dégradés, icônes, Canvas et WebGL. Les textes ne sont pas éditables dans PowerPoint.

**`--mode natif`** — vraies formes PowerPoint, textes éditables. Mais le script ne peut porter que du texte : surtitres, titres, cartes, listes, notes. Tout visuel construit en CSS ou en SVG est perdu.

**Le piège à éviter.** Sur une présentation dont la substance est visuelle — et c'est le cas de toutes celles que produit cette skill — le mode natif ne rend qu'un squelette : la moitié des slides se réduit à un titre. Ne proposer le natif que pour un deck **purement textuel** où l'éditabilité primerait sur le rendu, et le dire dans ces termes. Présenter les deux modes comme des options de fidélité comparable induit l'utilisateur en erreur.

## Mode images : adaptation statique

Par défaut, une slide web produit **exactement une slide PowerPoint**. Les apparitions sont aplaties dans leur état final : un texte révélé après un clic reste sur la même slide, il ne devient pas une nouvelle diapositive. Cette correspondance 1:1 est l'invariant principal de l'export.

`--expand-builds` développe volontairement chaque étape d'apparition en slide PowerPoint distincte. Ne l'utiliser que si l'utilisateur demande explicitement de reproduire le déroulé clic par clic dans le fichier PowerPoint.

Le PowerPoint est une **adaptation éditoriale statique** de la présentation interactive, pas une série de captures prises à un instant arbitraire. Chaque composant animé ou temporisé doit définir l'état fixe qui transmet le mieux son information :

- une conversation montre assez d'échanges pour comprendre le scénario, sans indicateur de saisie ;
- une animation Canvas ou WebGL rend une image nette et représentative, directement à la résolution finale ;
- une simulation affiche valeurs, légende et phénomène dans un état cohérent ;
- une apparition progressive révèle toutes les unités utiles sans modifier la géométrie ;
- un connecteur reste derrière les nœuds et s'arrête à leur contour visible.

Le script dépose à côté de l'original une copie temporaire portant un crochet d'export, puis la supprime. Le crochet :

- masque la barre de commandes et les panneaux, qui n'ont pas de sens dans un fichier ;
- passe la scène en `inset: 0` pour que la slide occupe tout le cadre ;
- redéfinit `--swash-w` sur `100vh`, la barre de 52 px ayant disparu — sans quoi le cambré du modèle 2 serait à la mauvaise largeur ;
- neutralise les transitions, pour ne pas capturer un état intermédiaire ;
- lit `?s=` et `?b=` pour activer la slide et l'étape voulues ;
- ajoute la classe `powerpoint-export` à l'élément `<html>` ;
- émet l'événement bouillonnant `presentation:export` sur la slide active avec `slide`, `index`, `build` et `format: "pptx"` dans `event.detail`.

L'original n'est jamais modifié.

Le crochet impose explicitement la visibilité de chaque étape et ramène durées et délais d'animation à un état quasi instantané. Il ne doit **jamais** annuler globalement `transform`, `translate`, `scale` ou `rotate` : ces propriétés positionnent souvent les nœuds SVG et les diagrammes. Si une animation nécessite un traitement particulier, le faire composant par composant via `presentation:export`.

Le calcul de l'état final examine tous les attributs `data-build` de la slide, y compris ceux portés par des conteneurs visuels, des SVG ou des Canvas. Il ne doit pas déduire la dernière étape des seuls blocs textuels convertibles en mode natif.

### Déclarer l'état statique d'un composant

Les composants dont l'état utile dépend du temps écoutent `presentation:export` et se fixent explicitement. Exemple :

```js
document.addEventListener('presentation:export', event => {
  if (!event.detail.slide.classList.contains('chat-slide')) return;
  document.querySelectorAll('.chat-message').forEach(message => {
    message.hidden = false;
  });
  document.querySelectorAll('.chat-typing').forEach(indicator => {
    indicator.hidden = true;
  });
});
```

L'exporteur reconnaît aussi le motif `data-chat-step` utilisé par les gabarits de conversation : il montre tous les messages et masque les indicateurs de saisie. Un composant de chat différent doit fournir son propre gestionnaire `presentation:export`.

Pour Canvas et WebGL, appeler directement la fonction de rendu avec un état déterministe. Ne pas attendre qu'une boucle d'animation tombe fortuitement sur une image convenable. Le script lance Chromium avec SwiftShader autorisé et sans `--disable-gpu`, afin que WebGL puisse être capturé en environnement sans GPU matériel.

## Prérequis et durée

- `pip install --user python-pptx`
- **Chrome, Chromium ou Edge.** Le script les cherche aux emplacements usuels puis dans le `PATH`.
- Aucun serveur n'est nécessaire : la capture se fait en `file://`, au résultat identique au bit près à celui obtenu via HTTP.
- Compter environ **2,5 s par slide**. Un deck long peut dépasser la limite d'exécution habituelle : le lancer en arrière-plan.

Options : `--expand-builds` développe les apparitions, `--largeur` et `--echelle` règlent la capture (défaut `1600` au facteur `2`, soit 3200×1800). `--final-only` reste accepté pour compatibilité, mais correspond désormais au comportement par défaut.

## Vérifier un export

Le `.pptx` ne s'ouvre pas dans cet environnement ; il faut le contrôler par programme. En mode images, cinq points :

```python
from pptx import Presentation
p = Presentation("sortie.pptx")
print(p.slide_width / 914400, p.slide_height / 914400)          # 13.333 x 7.5
print(len(p.slides))
sans = [i for i, s in enumerate(p.slides, 1)
        if not any(sh.shape_type == 13 for sh in s.shapes)]      # 13 = image
print("slides sans image :", sans)
```

1. format `13.333 × 7.5 in` ;
2. autant d'images embarquées que de slides ;
3. aucune slide sans image, aucune sans notes ;
4. l'image couvre exactement le cadre — `left` et `top` nuls, largeur et hauteur égales à celles de la slide ;
5. toutes les parties XML du paquet bien formées.

Puis **regarder chaque slide exportée**. Les compteurs et la validité OOXML ne prouvent pas la fidélité visuelle. Contrôler au minimum :

- toutes les unités de texte attendues ;
- les positions des éléments SVG transformés ;
- la netteté et le contenu des Canvas et scènes WebGL ;
- l'état final des conversations et animations temporisées ;
- l'ordre des calques, les connecteurs et le masquage autour des nœuds ;
- l'absence de texte coupé, estompé ou capturé pendant une transition.

Comparer les slides complexes à leur état web de référence au même ratio. Une miniature mobile agrandie ne constitue jamais une source acceptable pour réparer une capture haute définition.

Après des remplacements manuels d'images dans un `.pptx`, reconstruire le paquet final ou vérifier qu'aucune relation et aucun média inutilisés ne s'accumulent. Une suite de remplacements via `python-pptx` peut laisser d'anciennes images orphelines même si PowerPoint ouvre encore le fichier.

Le validateur OOXML de la skill `pptx` d'Anthropic exige Python 3.10 : il échoue sur un poste en 3.9. Dans ce cas, contrôler le paquet à la main — parties essentielles présentes, XML bien formé, slides déclarées dans `sldIdLst` toutes résolues.

### Si PowerPoint est installé sur le poste

Ne pas chercher à le piloter par AppleScript : la moindre boîte de dialogue — autorisation d'automatisation de macOS, écran de démarrage, session — fait expirer l'AppleEvent au bout de soixante secondes, sans rien dire de la validité du fichier. Trois tentatives suffisent à le constater.

Le signal fiable est ailleurs. Demander l'ouverture, puis vérifier que PowerPoint **tient le fichier ouvert** :

```bash
open -a "Microsoft PowerPoint" sortie.pptx
lsof sortie.pptx          # PowerPoint doit y figurer avec un descripteur
ls -a | grep '^~\$'       # PowerPoint crée un fichier de verrouillage ~$nom.pptx
```

Si PowerPoint détient un descripteur et a posé son verrou, le fichier a été accepté et analysé : ni réparation ni refus. Le rendu proprement dit, lui, ne se juge qu'à l'œil, sur l'écran de l'utilisateur.

## Mode natif : ce qu'il rapporte

Le mode natif imprime la liste de **tout ce qu'il n'a pas su convertir**, par classe et par nombre d'occurrences. Trois familles :

- **visuel …** — un `svg`, `img` ou `canvas` a été rencontré ;
- **détail non converti dans …** — l'unité a été convertie, mais elle contenait un sous-contenu qui n'entre ni dans son titre ni dans son paragraphe : c'est le cas des visuels construits en CSS ;
- **texte trop dense** — la slide dépasse 700 caractères convertis et sera illisible en projection.

Cette liste est le mode d'emploi de la reprise manuelle. La transmettre avec le fichier, et ne jamais présenter un export natif comme fidèle.

Trois pièges de mise en œuvre, corrigés mais à connaître si le script évolue : une unité ayant du texte mais ni titre ni paragraphe ne doit pas être abandonnée ; les cartes et le texte simple doivent être placés tous les deux, jamais l'un à la place de l'autre ; et un composant riche imbriqué dans une carte est avalé — le détecter en comparant le texte total de l'unité à ce qui a réellement été converti.
