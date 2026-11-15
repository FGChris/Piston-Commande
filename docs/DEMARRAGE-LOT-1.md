# Démarrer les lots 1 et 2

## Ce qui fonctionne

Connexion par e-mail et mot de passe, déconnexion, sessions expirantes, deux garages de démonstration séparés par PostgreSQL RLS, recherche par plaque et fiches avec observations horodatées. Chaque ouverture de fiche interroge à nouveau l’adaptateur simulé. Les données fraîches enrichissent la mémoire sans effacer les champs connus par des valeurs vides ; les informations manquantes dans la vérification actuelle restent bloquantes à l’écran.

L’interface est bleue et orange, adaptée au téléphone. Les besoins en pièces sont maintenant disponibles dans le lot 2 : voir [le parcours et ses garde-fous](LOT-2-BESOINS.md). Devis et stock restent indisponibles. Aucune API fournisseur n’est connectée.

## Installation locale

Depuis la racine du dépôt, avec Node.js 22 ou plus récent et npm :

```sh
npm ci
npm run db:start
```

Garder ce premier terminal ouvert. PostgreSQL de développement écoute uniquement sur `127.0.0.1:55432`. Ses fichiers et secrets sont dans `.local/`, ignoré par Git. Le paquet embarqué est un outil de développement, pas une configuration de base destinée à la production. Ne pas lancer la base comme root.

Dans un deuxième terminal, depuis la même racine :

```sh
npm run db:setup
npm run dev
```

Ouvrir `http://localhost:3000`. Les deux comptes de test et leurs mots de passe aléatoires sont dans `.local/accounts.json`, à consulter uniquement sur votre poste. Ne pas copier ce fichier dans Git, les logs ou le chat. Les e-mails sont `boss@atelier-a.test` et `boss@atelier-b.test`. Aucun mot de passe universel n’est inclus dans le dépôt.

`db:setup` crée les comptes de test et `.env.local` s’ils n’existent pas ; une nouvelle exécution préserve les fichiers existants et n’écrase pas les mots de passe. Les migrations appliquées sont contrôlées par empreinte : ajouter une migration plutôt que modifier une migration déjà exécutée. `.local/accounts.json`, `.local/postgres.json` et `.env.local` forment une configuration locale cohérente ; ne pas en supprimer un isolément. Sauvegarder le répertoire local avec les précautions adaptées aux secrets si nécessaire.

Le serveur applicatif utilise uniquement `depanos_app`, sans droits administrateur ni contournement RLS. La configuration administrateur n’est utilisée que par les scripts locaux de préparation et certains arrangements de tests. En HTTPS, `COOKIE_SECURE=true` est requis ; `false` sert uniquement aux essais HTTP locaux. Ne pas exposer cet environnement de démonstration sur Internet.

Pour arrêter : Ctrl+C dans le terminal applicatif, puis dans celui de PostgreSQL. Relancer les mêmes commandes pour retrouver les données. Utiliser le checkout existant ; une tâche cloud est déjà isolée, sans worktree supplémentaire sauf demande explicite.

## Cas de démonstration

| Saisie | Résultat attendu |
|---|---|
| DEMO-001 | Identité synthétique complète, aucune compatibilité réelle |
| DEMO-002 | Code moteur manquant, recherche de pièces bloquée |
| DEMO-003 | Variante ambiguë, vérification humaine nécessaire |
| DEMO-404 | Aucun résultat dans le jeu de test |
| DEMO-503 | Panne simulée, distincte d’une absence |
| Plaque au format AB-123-CD | Source réelle non connectée, aucun véhicule inventé |

Le format de plaque français actuel est pris en charge ; les autres formats nécessiteront un adaptateur et une validation dédiés. Les fixtures sont entièrement fictives, y compris marque, moteur, VIN et date.

## Vérifications

Base locale démarrée et schéma préparé :

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Les tests utilisent exclusivement les deux garages locaux de démonstration, créent des fiches et des observations et les conservent. Ne pas les pointer vers une base métier. Ne pas lancer les suites en parallèle sur ces mêmes comptes. Les essais de révocation/limitation touchent les sessions de test.

Playwright utilise Chromium système s’il existe dans `/usr/bin/chromium`, sinon son navigateur installé. Sur un poste sans Chromium : `npx playwright install chromium`. `CHROMIUM_PATH` permet de désigner un exécutable. La suite démarre `npm run start` si le port 3000 est libre ; arrêter le serveur de développement avant ce contrôle pour tester la compilation de production. Captures et rapport : `test-results/` et `playwright-report/` (ignorés par Git).

## Limites du lot

Pas d’inscription publique, de récupération de mot de passe ni d’administration des comptes dans l’interface. Les rôles sont présents dans le modèle ; le parcours d’identification est commun, les permissions métier des prochains lots restent à définir. L’entrée de connexion est nécessairement accessible sans session ; les pages et actions métier exigent une session, et l’enveloppe HTML commune ne contient pas de données métier.

Les mots de passe sont hachés bcrypt (coût 12), limités à 72 octets pour éviter une troncature silencieuse. Les tentatives sont limitées par adresse de compte en base : cinq échecs en quinze minutes. Les sessions opaques sont stockées sous forme de SHA-256 en base, expirent après huit heures et sont révoquées à la déconnexion. Les cookies sont HttpOnly et SameSite=Lax. Les actions serveur bénéficient du contrôle d’origine de Next.js.

L’interface d’identification est définie dans `lib/vehicle.ts`. Pour une source réelle, remplacer l’adaptateur dans les points d’orchestration après validation de ses accès, états d’erreur et règles de fraîcheur. Les observations contiennent des informations véhicule : rétention, sauvegarde et suppression restent à définir avant usage réel.

Validation exécutée sous Linux et Node.js 24 ; installation sur le Mac d’atelier et accès aux portails non vérifiés. Aucun déploiement ni envoi à un client n’a été effectué.
