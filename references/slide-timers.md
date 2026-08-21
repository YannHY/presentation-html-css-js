# Minuteur optionnel par slide

Ajouter un minuteur uniquement aux slides qui en ont besoin en copiant le bloc `[data-slide-timer]` fourni dans l'en-tête de la slide d'exemple des trois modèles. Supprimer ce bloc des autres slides. Le moteur partagé détecte chaque bloc indépendamment.

## Contrat du composant

- `data-duration` porte la durée initiale en secondes, par exemple `300` pour cinq minutes.
- La slide n'affiche que `[data-timer-display]`, une barre de progression horizontale et la zone d'annonce non visible. Aucun champ ni bouton de réglage ne doit apparaître dans la maquette projetée.
- Le bouton `#timer-settings-toggle` vit dans les utilitaires en bas à droite. Il est masqué sur les slides sans minuteur et ouvre le panneau partagé `#timer-settings` sur les slides chronométrées.
- `#timer-minutes` et `#timer-seconds`, placés dans ce panneau, permettent à l'intervenant de choisir une autre durée. Les secondes restent entre `0` et `59` ; la durée totale minimale est d'une seconde.
- `#timer-control-toggle` alterne démarrage et pause. L'icône, le libellé accessible et l'infobulle suivent réellement l'état.
- `#timer-control-reset` arrête le décompte et revient à la durée choisie. « Réinitialiser » ne signifie pas afficher `00:00`, mais remettre le minuteur dans son état de départ.
- Le minuteur ne démarre jamais automatiquement à l'arrivée sur la slide. Quitter sa slide le met en pause sans perdre le temps restant ; y revenir ne le relance pas.
- À `00:00`, arrêter toute boucle, distinguer visuellement l'état terminé et annoncer « Temps écoulé » par une zone `aria-live` non visible.
- Le panneau de réglage est mutuellement exclusif avec les notes et les raccourcis. Il se ferme lors d'un changement de slide ou avec `Échap`.

Les durées réglées dans l'interface sont volontaires et limitées à la session. Ne pas les enregistrer dans `localStorage` sans demande explicite : une ancienne valeur ne doit pas masquer le nouveau `data-duration` préparé dans le fichier.

## Placement

Placer le minuteur comme second enfant de `.slide-head`, en face du titre, donc en haut à droite de la maquette. Dans une composition différente, conserver cet ancrage visuel et lui réserver une zone stable : le lancement ne doit provoquer aucun déplacement.

Sur la slide, rester extrêmement sobre : le temps restant en monospace, centré au-dessus d'une barre fine qui se vide, dans un cadre blanc compact aux bords arrondis. Le cadre garde une bordure et une ombre très discrètes, sans bouton ni légende. Employer les variables de couleur du modèle actif. Sous le seuil mobile, autoriser le retour à la ligne de `.slide-head` tout en gardant le minuteur aligné à droite.

Le panneau inférieur regroupe seulement les deux champs de durée et les boutons lecture-pause et réinitialisation. Employer Font Awesome 6. Le bouton d'ouverture s'insère juste avant le plein écran dans la zone d'utilitaires.

## Vérification

Tester au minimum :

1. une durée courte, par exemple trois secondes, jusqu'à « Temps écoulé » ;
2. pause puis reprise sans saut de temps ;
3. modification des minutes et secondes, y compris `0:00`, normalisé à `0:01` ;
4. réinitialisation pendant le décompte et après son terme ;
5. changement de slide pendant le décompte, qui doit le mettre en pause ;
6. masquage du bouton inférieur sur une slide sans minuteur, puis réapparition avec le bon état en revenant ;
7. exclusivité du panneau avec notes et raccourcis, fermeture par `Échap` et lors d'un changement de slide ;
8. activation au clavier et à la souris, focus des champs, libellés accessibles et absence d'erreur console ;
9. composition du décompte en haut à droite et contraste dans chaque modèle réellement livré.
