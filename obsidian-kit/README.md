# Import dans votre coffre Obsidian existant

Le chemin du coffre reste à fournir. Le kit est prêt, aucun coffre personnel n’a été modifié.

Depuis la racine du projet, vérifier d’abord :

```sh
node scripts/obsidian-import.mjs --vault /chemin/du/coffre
```

Puis appliquer le plan sans écraser les notes :

```sh
node scripts/obsidian-import.mjs --vault /chemin/du/coffre --apply
```

Le chemin doit être accessible sur la machine où la commande s’exécute. Un chemin situé sur votre Mac n’est pas accessible depuis le cloud sans transfert ou montage explicite. Si le projet est copié sur votre Mac, exécuter ces commandes sur le Mac, Obsidian fermé pendant l’import. Un conflit bloque l’import ; aucune note n’est écrasée. Réexécuter l’import est sans effet sur les notes identiques.

Dans Obsidian, ouvrir votre coffre habituel puis `DEPANOS/00-Accueil/Accueil.md`. Les modèles peuvent être dupliqués à la main ; si vous utilisez déjà le module intégré Modèles, conservez son réglage existant et copiez les modèles souhaités dans son dossier. Aucun changement global de `.obsidian`, aucun plugin communautaire, Sync ou Publish installé.

Utiliser un coffre privé par garage. Les fichiers ne sont pas chiffrés par ce kit : protéger le disque et les sauvegardes. Aucune synchronisation automatique application↔Obsidian n’est créée. Ne jamais exporter les accès fournisseurs ou données client dans ce kit. Lire les règles de confiance avant de saisir des références.
