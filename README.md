# Create Interactive HTML Presentations

Skill Codex pour créer, adapter et vérifier des présentations HTML interactives, éditoriales et visuellement soignées.

Elle couvre aussi bien la création complète d’un diaporama que les retouches ciblées d’une présentation existante, avec une attention particulière portée au contenu, au rythme des apparitions, à l’accessibilité et aux régressions visuelles.

## Fonctionnalités

- transformation de notes ou d’un plan en présentation web ;
- navigation au clavier, au clic et au toucher ;
- apparitions successives et animations narratives ;
- notes de l’intervenant et mode plein écran ;
- retouches précises sans modifier les éléments non demandés ;
- validation statique de la structure et des interactions ;
- vérification visuelle à plusieurs résolutions ;
- modèle graphique optionnel et réutilisable.

## Installation

Cloner le dépôt dans le dossier des skills personnelles de Codex :

```bash
git clone https://github.com/YannHY/presentation-html-css-js.git \
  ~/.codex/skills/create-interactive-html-presentations
```

La skill sera ensuite disponible sous le nom `create-interactive-html-presentations`.

## Utilisation

Exemples de demandes :

```text
Crée une présentation HTML interactive à partir de ces notes.
```

```text
Sur la slide 4, fais apparaître les trois cartes successivement au clic.
```

```text
Crée une nouvelle présentation avec le modèle visuel 1.
```

## Structure

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── assets/
│   └── presentation-template-1/
├── references/
│   ├── design-language.md
│   ├── editorial-contract.md
│   ├── presentation-model-1.md
│   └── targeted-edits.md
└── scripts/
    └── validate_presentation.py
```

## Validation

Le script fourni contrôle la structure d’une présentation :

```bash
python3 scripts/validate_presentation.py chemin/vers/index.html --expected-slides 14
```

La vérification visuelle dans un navigateur reste obligatoire, notamment pour les animations, les étapes d’apparition et le plein écran.

## Modèle 1

Le modèle optionnel documente notamment :

- la palette bleu–vert ;
- le fond blanc cadrillé ;
- les métadonnées d’en-tête ;
- la barre de progression et les commandes inférieures ;
- les raccourcis, les notes et le plein écran ;
- les précautions nécessaires pour Safari.

Un modèle HTML, CSS et JavaScript prêt à adapter est fourni dans `assets/presentation-template-1/`.

## Auteur

Yann Houry
