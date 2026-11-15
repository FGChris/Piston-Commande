# Validation du lot 1 — 14 novembre 2026

## Résultats observés

| Contrôle | Résultat |
|---|---|
| Installation figée `npm ci --cache /workspace/.npm-cache` | Réussie |
| Préparation de base exécutée deux fois | Réussie ; fichiers locaux conservés |
| `npm run typecheck` | Réussi |
| `npm test` | 12 tests passés, aucun ignoré |
| `npm run build` | Compilation de production réussie |
| `npm run test:e2e` | 8 parcours passés : 4 sur ordinateur, 4 à 390 px |
| Inspection des captures Chromium | Connexion, accueil et fiche ; contrôles mobiles corrigés et vérifiés |
| Arrêt/redémarrage PostgreSQL | Données conservées |
| Audit des dépendances de production | Aucune vulnérabilité signalée au moment du contrôle |
| Confidentialité des fichiers locaux | `.local/`, `.env.local`, captures et rapports ignorés par Git |
| Brief original | AGENTS.md identique à la pièce jointe |

Les tests métier ont d’abord échoué avant la création du module d’identification, puis passé après implémentation. La première suite navigateur a relevé une ambiguïté du sélecteur d’alerte, corrigée dans le test. L’inspection mobile a révélé une hauteur de champ insuffisante ; correction et assertion de hauteur minimale de 44 px ajoutées avant le dernier passage complet.

## Preuves couvertes

- Rôle applicatif réellement sans superutilisateur, sans BYPASSRLS et sans propriété des tables ; politiques activées et forcées.
- Écriture dans B, lecture impossible depuis A ; insertion usurpant B refusée par la base ; lien d’observation entre garages refusé.
- Sans session : aucune donnée métier visible. Cookie falsifié, session expirée et déconnexion refusent l’accès aux pages métier.
- Mot de passe incorrect et blocage après cinq échecs, y compris refus ultérieur du bon mot de passe pendant la fenêtre de limitation.
- Source synthétique complète, incomplète, ambiguë, absente et indisponible ; aucune identité inventée pour une plaque réelle.
- Correction par une donnée fraîche et conservation des anciennes valeurs lorsqu’une observation est vide, sans masquer le blocage actuel à l’écran.
- Nouvelle observation à la revérification de la fiche ; horodatage comparé dans le navigateur.
- Absence de débordement horizontal à 390 px et contrôles principaux d’au moins 44 px.

## Limites

Contrôles effectués sous Linux avec Node.js 24.22.1, PostgreSQL local 18.6 et Chromium automatisé. Ce contrôle ne constitue pas un essai sur iPhone physique, sur le Mac d’atelier ou avec des données fournisseur réelles. Aucun portail, envoi de devis, achat, stock, signature ou document Henrri n’est opérationnel dans ce lot.

Les champs `install_script` et `start_skill` ont été enregistrés dans le brouillon de configuration cloud. Cette sauvegarde ne publie pas l’environnement et ne prouve pas une restauration dans une nouvelle tâche. Les processus PostgreSQL et Next.js doivent être redémarrés après restauration.
