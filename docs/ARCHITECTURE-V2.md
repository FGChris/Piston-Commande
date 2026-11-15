# Architecture proposée

**Architecture retenue pour le lot 1 validé ; extensions proposées pour les lots suivants.** Priorité au coût et à la simplicité pour un garage pilote, avec séparation des accès fournisseurs.

## Composants

| Composant | Choix proposé | Motif |
|---|---|---|
| Interface et serveur métier | Next.js, TypeScript | Un langage, formulaires mobiles et validation partagée |
| Base | PostgreSQL avec politiques RLS | Transactions, contraintes et isolation par garage dans la base |
| Tâches | File PostgreSQL et worker séparé | Éviter Redis au pilote ; reprises et quotas partagés |
| Portails | Worker Playwright, un adaptateur par source | Sessions réutilisées, changements de page détectables |
| Documents | Stockage privé, accès temporaires | Devis immuables et accès contrôlé |
| IA | Interface fournisseur interchangeable | Extraction et aide à la rédaction ; aucune autorité métier |

Le lot 1 utilise Next.js 16.4.6, React 19.3.1 et PostgreSQL 18.6 embarqué pour le développement ; les dépendances exactes sont verrouillées dans package-lock.json. L’authentification locale utilise bcrypt PostgreSQL et des sessions opaques expirantes. L’hébergement de production et les workers fournisseurs restent à décider. Voir le guide du lot 1 pour les limites.

## Déploiement

Pilote recommandé sur le Mac d’atelier pour les portails, afin de conserver leur contexte réseau habituel. Le cloud Codex sert au développement avec sources de test identifiées ; il ne garantit pas l’accès aux comptes fournisseurs depuis une adresse de datacenter.

Une évolution hybride pourrait garder le worker fournisseurs à l’atelier et héberger le cœur métier ailleurs. Elle ajoute synchronisation, supervision et coût : décision différée. Sur le Mac, le tunnel n’expose que la page publique de devis et les points d’entrée strictement nécessaires ; administration et portails restent privés. Tester les redémarrages et la sauvegarde avant usage réel.

## Sécurité et fonctionnement

- Vérification de session dès l’entrée de chaque action/page serveur ; page publique authentifiée par jeton avec débit limité.
- Rôle applicatif sans contournement RLS ; contexte garage lié à la session, borné à chaque transaction. Tests avec le rôle réel, pas un administrateur.
- Secrets chiffrés côté serveur, clé hors base, aucune valeur dans les logs ; sessions navigateur séparées par garage et source.
- Quotas et verrous en base. Partslink24 : une session et accès sérialisé ; pas d’hypothèse sur une durée arbitraire de connexion.
- Chaque adaptateur expose identification, recherche, état de session et erreurs typées. Une page inconnue déclenche une alerte et arrête l’extraction.
- Vérifier conditions d’utilisation, droits de conservation et possibilités d’API avant chaque automatisation. Aucun contournement de CAPTCHA ou MFA.
- Sauvegardes chiffrées, restauration testée, journal d’audit sans identifiants secrets. Durées de conservation et coûts à fixer.

## Interface

Bleu et orange, mobile d’abord : navigation simple, boutons de 44 px minimum, aucune largeur débordant à 390 px. Palette et contrastes à vérifier dans le navigateur. Une action principale par écran : identifier, préciser, comparer, valider ou envoyer. Les états incomplets doivent être lisibles sans jargon.
