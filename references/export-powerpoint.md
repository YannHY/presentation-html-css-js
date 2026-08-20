# Export PowerPoint

**Le mode par défaut de cette skill est la page web.** L'export `.pptx` est une option, à n'employer que sur demande explicite.

```bash
python3 scripts/export_pptx.py chemin/vers/index.html -o sortie.pptx
```

Deux modes. **Le mode par défaut est `images`**, et c'est presque toujours le bon.

## Choisir le mode : ne pas les présenter comme équivalents

**`--mode images`** (défaut) — chaque état est capturé par Chrome et posé en pleine page. Rendu **identique au web** : SVG, cambré, trames de données, calendrier, dégradés, icônes. Les textes ne sont pas éditables dans PowerPoint, et le fichier est lourd — 39 slides pèsent environ 7 Mo.

**`--mode natif`** — vraies formes PowerPoint, textes éditables. Mais le script ne peut porter que du texte : surtitres, titres, cartes, listes, notes. Tout visuel construit en CSS ou en SVG est perdu.

**Le piège à éviter.** Sur une présentation dont la substance est visuelle — et c'est le cas de toutes celles que produit cette skill — le mode natif ne rend qu'un squelette : la moitié des slides se réduit à un titre. Ne proposer le natif que pour un deck **purement textuel** où l'éditabilité primerait sur le rendu, et le dire dans ces termes. Présenter les deux modes comme des options de fidélité comparable induit l'utilisateur en erreur.

## Mode images : fonctionnement

Une slide PowerPoint est émise **par étape d'apparition**, ce qui préserve le déroulé : le deck des journées 2026 passe de 17 slides web à 39 slides PowerPoint.

Le script dépose à côté de l'original une copie temporaire portant un crochet d'export, puis la supprime. Le crochet :

- masque la barre de commandes et les panneaux, qui n'ont pas de sens dans un fichier ;
- passe la scène en `inset: 0` pour que la slide occupe tout le cadre ;
- redéfinit `--swash-w` sur `100vh`, la barre de 52 px ayant disparu — sans quoi le cambré du modèle 2 serait à la mauvaise largeur ;
- neutralise les transitions, pour ne pas capturer un état intermédiaire ;
- lit `?s=` et `?b=` pour activer la slide et l'étape voulues.

L'original n'est jamais modifié.

Le crochet impose explicitement la visibilité de chaque étape. C'est indispensable : hors plein écran la présentation révèle d'elle-même toutes les unités, si bien que sans cette contrainte toutes les captures seraient identiques. Après toute modification du crochet ou de la logique d'apparitions, vérifier que deux étapes d'une même slide produisent bien deux images différentes.

## Prérequis et durée

- `pip install --user python-pptx`
- **Chrome, Chromium ou Edge.** Le script les cherche aux emplacements usuels puis dans le `PATH`.
- Aucun serveur n'est nécessaire : la capture se fait en `file://`, au résultat identique au bit près à celui obtenu via HTTP.
- Compter environ **2,5 s par état**, soit près de deux minutes et demie pour 39 états. C'est plus long que la limite d'exécution habituelle : **lancer l'export en arrière-plan**.

Options : `--final-only` aplatit les apparitions, `--largeur` et `--echelle` règlent la capture (défaut `1600` au facteur `2`, soit 3200×1800).

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

Puis **regarder la capture la plus exigeante** du deck — celle qui porte le visuel le plus riche — avant d'assembler. C'est le seul contrôle qui atteste que le rendu est fidèle ; les compteurs, non.

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
