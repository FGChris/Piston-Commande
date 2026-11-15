# Ouvrir DEPANOS sur votre Mac

1. Installez **Node.js 24 LTS**, version macOS, depuis https://nodejs.org/en/download. Le paquet officiel détecte généralement Intel ou Apple Silicon ; choisissez celui de votre Mac. Internet sera nécessaire pour installer les dépendances au premier démarrage.
2. Décompressez le ZIP dans votre dossier Téléchargements ou Documents. Gardez le dossier entier, pas seulement le lanceur.
3. Double-cliquez sur **Demarrer-DEPANOS.command**. Un Terminal s’ouvre, installe les dépendances et prépare PostgreSQL et l’application. Attendez le message « DEPANOS est prêt » : votre navigateur s’ouvre automatiquement.
4. Double-cliquez sur **Voir-mes-acces.command** : TextEdit affiche les identifiants créés uniquement sur votre Mac. Copiez-les dans la page de connexion. Ne partagez pas ce fichier.
5. Essayez **DEMO-001** pour le parcours véhicule ; l’icône Réglages donne accès au coffre fournisseurs et au changement de mot de passe.

Gardez le Terminal ouvert pendant l’utilisation. Ctrl+C arrête les processus lancés par ce lanceur. Les données restent dans le dossier caché `.local` ; le démarrage suivant les retrouve. N’effacez pas ce dossier et ne déplacez pas seulement une partie de l’application. Les ports 3000 et 55432 doivent être libres. Le lanceur n’arrête aucun service existant : s’ils sont occupés, il vous invite à fermer l’autre instance.

Si macOS n’exécute pas le fichier au double-clic, ouvrez Terminal, tapez `bash ` (avec un espace), glissez `Demarrer-DEPANOS.command` depuis Finder dans le Terminal, puis appuyez sur Entrée. Ne désactivez pas les protections de macOS.

## Ce que contient le téléchargement

Le code, les dépendances verrouillées, les migrations, les guides et le kit Obsidian. Aucun mot de passe, compte fournisseur, base de données ou secret du cloud n’est exporté. De nouveaux comptes locaux de démonstration sont créés au premier lancement. Les données cloud et celles du Mac ne sont pas synchronisées.

Le navigateur et les deux services utilisent seulement ce Mac. Il s’agit d’un essai local, sans publication du site. Les informations véhicule restent simulées ; enregistrer des accès fournisseurs ne rend pas leurs connecteurs opérationnels. Les pages légales restent des brouillons, et votre coffre Obsidian existant attend encore un chemin d’import.

Le lanceur a été contrôlé statiquement sous Linux ; l’exécution native sur Intel ou Apple Silicon reste à vérifier sur votre Mac. S’il échoue, transmettez le message d’erreur du terminal sans aucun identifiant ni contenu de `.env.local` ou `.local`.
