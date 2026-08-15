---
name: create-interactive-html-presentations
description: Créer, adapter, intégrer et vérifier des présentations HTML interactives, éditoriales et visuellement soignées à partir d'un contenu brut, d'un plan, de données ou d'un document source. Utiliser cette skill pour produire des slides web navigables, transformer des notes en diaporama, reproduire une direction visuelle fournie, ajouter des animations narratives ou retoucher précisément une présentation HTML existante sans modifier les éléments non demandés.
---

# Présentations HTML interactives

Comprendre d'abord la présentation, concevoir chaque slide selon son message, puis ne conserver que les mots, cadres et mouvements qui remplissent une fonction identifiable.

## Ordre de priorité

Respecter, dans cet ordre :

1. la demande actuelle et les remarques cumulées de l'utilisateur ;
2. les contenus, chiffres, citations, nombres de slides et références fournis ;
3. l'architecture, le design system et les choix déjà approuvés dans le projet ;
4. les valeurs par défaut de cette skill.

Ne jamais laisser une préférence générique de la skill remplacer une instruction ou une référence explicite.

## Choisir le mode de travail

- **Création ou refonte** : lire [references/editorial-contract.md](references/editorial-contract.md) et [references/design-language.md](references/design-language.md) avant de coder.
- **Retouche ciblée** : lire [references/targeted-edits.md](references/targeted-edits.md). Lire aussi `design-language.md` seulement si la demande redessine ou ajoute un composant.
- **Modification mêlant contenu et mise en scène** : appliquer les trois références.
- **Profil Florimont** : lorsque l'utilisateur demande cette identité ou qu'une présentation existante emploie déjà son fond cadrillé, sa palette bleu-vert et sa barre inférieure, lire [references/florimont-visual-system.md](references/florimont-visual-system.md). Pour une nouvelle présentation, copier `assets/florimont-presentation-template/` puis remplacer le contenu d'exemple. Ne jamais appliquer ce profil par défaut à un autre projet.

## Workflow de création ou de refonte

1. Inspecter entièrement les fichiers source, les notes, la présentation existante et les conventions du projet.
2. Établir le contrat éditorial slide par slide avant toute mise en page. Verrouiller le nombre de slides demandé et séparer texte projeté, notes orales, visuel et étapes d'apparition.
3. Examiner réellement chaque site, vidéo, timestamp ou capture de référence. En extraire palette, typographie, densité, espacements, rayons, compositions et rythme des animations.
4. Construire le storyboard. Affecter une idée principale et une preuve visuelle à chaque slide. Ne pas transformer automatiquement les notes de l'intervenant en texte visible.
5. Identifier les contenus figés : toute demande comme « reprendre tel quel » interdit la paraphrase, la condensation et la suppression.
6. Implémenter en préservant le design system existant. Pour une création autonome, produire un `index.html` unique sauf demande ou convention contraire.
7. Exécuter `python3 scripts/validate_presentation.py <index.html> --expected-slides N`, où `N` vient du contrat éditorial, puis corriger erreurs et avertissements pertinents.
8. Vérifier visuellement toutes les slides dans un navigateur. Tester chaque état d'apparition et chaque animation sémantique.
9. Auditer les remarques généralisables sur l'ensemble du deck sans propager aveuglément une solution locale.

## Protocole de retouche ciblée

Traiter toute retouche comme un **contrat de delta** :

- définir précisément ce qui doit changer ;
- énumérer ce qui doit rester invariant ;
- appliquer le plus petit diff possible ;
- conserver conteneurs, fonds, bordures, rayons, dimensions, espacements, animations et comportements accessibles non visés ;
- comparer avant et après au même viewport ;
- ne pas annoncer la correction avant vérification visuelle.

Distinguer un retour local, une règle généralisable et une préférence globale. Corriger localement d'abord ; auditer ensuite les composants analogues seulement lorsque le principe se transpose sans détruire un choix approuvé.

## Contrat d'interface

Pour une création ou une refonte complète, inclure :

- une navigation de chapitres adaptée à la direction visuelle ;
- le chapitre actif et les chapitres déjà visités ;
- un compteur et une progression discrets ;
- des commandes précédent, suivant, notes et plein écran ;
- les raccourcis `ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Home`, `End`, `Space`, `F` et `Escape` ;
- un geste horizontal sur écran tactile ;
- un focus visible, des noms accessibles et une URL ou un hash stable.

Ne jamais afficher un contrôle factice. Tout bouton, menu, sélecteur, bouton de lecture, filtre ou chevron doit fonctionner réellement ; sinon le supprimer ou le traiter comme un élément statique sans affordance interactive. Utiliser Font Awesome 6 ou des SVG cohérents pour les commandes compactes, avec `aria-label` et infobulle.

Lors d'une retouche, préserver le contrat d'interface existant sauf demande explicite.

## Implémentation

- Utiliser HTML, CSS et SVG par défaut. Réserver Three.js aux informations réellement spatiales.
- Définir couleurs, espacements, rayons et typographies avec des variables.
- Suspendre les animations hors de la slide active.
- Maintenir une géométrie fixe pendant les apparitions afin d'éviter les sauts de mise en page.
- Ne pas introduire de dépendance distante indispensable à une présentation locale sans fallback.

## Vérification obligatoire

### Contenu

- Confirmer le nombre exact de slides et la mise à jour du compteur.
- Comparer titres, chiffres, citations et passages figés aux sources.
- Vérifier la séparation entre texte projeté et notes.
- Supprimer les répétitions entre titre, sous-titre, légende, visuel et navigation.

### Composition

- Vérifier l'homogénéité des éléments frères.
- Limiter chaque bloc à un seul contenant décoratif principal.
- Contrôler la précision interne des visuels et l'absence de collisions, coupes ou compressions.
- Inspecter toutes les slides à `1366×768` et `1600×900`, puis au moins un format étroit pertinent.

### Mouvement et interaction

- Tester l'état initial puis chaque clic de chaque slide animée.
- Capturer le départ, le milieu et l'état final des démonstrations longues.
- Vérifier que les animations internes commencent seulement lorsque leur bloc apparaît et finissent dans un état stable.
- Vérifier `prefers-reduced-motion` sans supprimer le séquençage ni le contenu.
- Tester clavier, tactile, hash, chapitres, compteur, notes, plein écran, focus et console.

### Régression

- Capturer toutes les slides lors d'une création ou refonte.
- Pour une retouche, capturer la slide avant/après au même viewport et contrôler les slides voisines.
- Confirmer que seuls les éléments autorisés ont changé.
- Ne jamais déclarer un résultat « vérifié » sans l'avoir effectivement ouvert et inspecté dans un navigateur.

## Ressources

- [references/editorial-contract.md](references/editorial-contract.md) : matrice de contenu, notes, verrouillage et concision.
- [references/design-language.md](references/design-language.md) : direction visuelle, cadres, représentations et mouvement.
- [references/targeted-edits.md](references/targeted-edits.md) : retouches sans effets collatéraux.
- [references/florimont-visual-system.md](references/florimont-visual-system.md) : profil optionnel Florimont, tokens, cadrillage, métadonnées et barre de commandes.
- `assets/florimont-presentation-template/` : socle HTML, CSS et JavaScript réutilisable du profil Florimont.
- `scripts/validate_presentation.py` : contrôle statique, avec nombre de slides attendu en option.
