# DEPANOS — dossier Codex V2

Projet de SaaS pour préparer les devis de pièces automobiles du garage. Nom du dépôt : Piston-Commande. Nom produit de travail : DEPANOS, à confirmer.

Les **lots 1 et 2 sont implémentés** : connexion, isolation des garages en base, fiche véhicule sur source simulée et description des besoins en pièces. L’interface est bleue et orange, adaptée au téléphone. Les prochains lots restent à réaliser. Aucun connecteur, compte fournisseur, prix, stock ou compatibilité réelle n’a été vérifié.

## Essayer les lots 1 et 2

Voir [le guide de démarrage](docs/DEMARRAGE-LOT-1.md) pour les prérequis et les comptes locaux, ainsi que [les résultats du lot 1](docs/VALIDATION-LOT-1.md) et [le fonctionnement du lot 2](docs/LOT-2-BESOINS.md). Depuis la racine :

```sh
npm ci
npm run db:start
```

Puis, dans un autre terminal à la racine :

```sh
npm run db:setup
npm run dev
```

Ouvrir `http://localhost:3000` sur votre poste. Identifiants aléatoires dans le fichier privé `.local/accounts.json`, jamais à partager. Essayer `DEMO-001` après connexion. Les données sont synthétiques. Sur la fiche, **Décrire les besoins** permet d’ajouter les pièces à remplacer avec quantité, essieu et côté. Références, chiffrage, devis et commandes restent indisponibles.

Tests : `npm run typecheck`, `npm test`, `npm run build`, puis `npm run test:e2e` (base démarrée). Les suites utilisent et modifient uniquement les garages locaux de test.

## Lecture

1. [AGENTS.md](AGENTS.md) : brief original joint, conservé à l’identique.
2. [Décisions et réponses](docs/DECISIONS-V2.md) : acquis, incertitudes et conflits.
3. [Priorités métier](docs/PRIORITES-METIER-V2.md) : parcours et garde-fous.
4. [Architecture](docs/ARCHITECTURE-V2.md) et [modèle de données](docs/MODELE-DONNEES-V2.md).
5. [Roadmap](docs/ROADMAP-V2.md) : lots et preuves attendues.
6. [Messageries](docs/MESSAGERIES-V2.md) et [second cerveau](docs/SECOND-CERVEAU-V2.md).
7. [Validation avant code](docs/VALIDATION-AVANT-CODE.md).
8. [Prompt Codex](docs/CODEX-PROMPT-V2.md).

## Sources et statut

Préparé le 14 novembre 2026 à partir des deux fichiers joints et de l’aperçu de conversation fourni. Le texte original des 30 questions et les anciennes réponses détaillées de l’assistant ne sont pas disponibles ; les réponses courtes ne permettent donc pas de reconstituer tous les choix. Aucun ancien dossier V1, document V2 ou prototype mentionné dans le README joint n’a été fourni. Ces documents V2 sont une nouvelle proposition, sans prétendre reproduire ces fichiers absents.

La documentation V2 a été demandée, puis le premier lot de code a été explicitement validé dans cette conversation. Le développement a ensuite été poursuivi avec le lot 2 à la demande du Boss. Les lots suivants restent à cadrer. Les propositions techniques ci-dessous ne remplacent pas les règles métier d’AGENTS.md. L’interface du lot 1 remplace la nécessité d’une maquette statique pour ce parcours.

## Réglages, cadre légal et mémoire

Les réglages privés des fournisseurs, le changement de mot de passe et les brouillons légaux sont disponibles. Voir [le guide et les limites](docs/ACCES-LEGAL-OBSIDIAN.md). Le [kit Obsidian](obsidian-kit/README.md) attend le chemin du coffre existant. Les accès sauvegardés ne sont pas encore utilisés par des connecteurs réels.
