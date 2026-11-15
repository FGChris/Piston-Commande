# Lot 2 — tour du véhicule

Le lot 2 poursuit le développement demandé après la livraison du lot 1. Les données restent synthétiques : un besoin décrit n’est ni une référence sélectionnée ni une preuve de compatibilité.

## Utilisation

Les commandes du [guide de démarrage](DEMARRAGE-LOT-1.md) restent valables. Sur une installation existante, exécuter `npm run db:setup` avant de relancer l’application pour appliquer la migration `003-vehicle-needs.sql`. Elle ajoute les tables sans réécrire les migrations ou données des lots précédents.

1. Se connecter au garage de test et identifier `DEMO-001`.
2. Ouvrir **Décrire les besoins** dans la fiche.
3. Choisir la famille, écrire la pièce ou le besoin, saisir une quantité entière, puis choisir explicitement l’essieu et le côté. Les notes sont facultatives.
4. Ajouter le besoin. Il reste présent après rechargement et réouverture du dossier.
5. Utiliser **Modifier** pour corriger une ligne. Utiliser **Retirer**, puis confirmer, pour la sortir de la liste active ; son historique reste conservé.

Familles disponibles : filtration et huile, freinage, distribution, suspension, direction, transmission et allumage. Aucun article, référence, prix ou stock n’est suggéré ou inventé.

Une position inconnue doit être choisie explicitement avec « à préciser ». Elle reste visible comme incertitude ; aucune position n’est déduite du libellé. « Sans essieu » et « Sans côté » sont des choix explicites pour les besoins qui ne dépendent pas de ces positions. La quantité n’est pas préremplie ; borne technique de 1 à 9 999, sans règle de conditionnement fournisseur implicite.

## Accès et garde-fous

- Boss, vendeur et mécanicien peuvent décrire et corriger les besoins de leur propre garage. Aucun droit tarifaire, de facturation ou d’envoi n’est ajouté.
- Toutes les actions métier vérifient d’abord la session. Les politiques RLS isolent les besoins et leur journal par garage ; les relations véhicule-besoin sont contraintes par une clé composée.
- Chaque création ou modification revérifie le véhicule avec l’adaptateur simulé, côté serveur. Identité incomplète, ambiguë, indisponible ou absente : ajout et modification bloqués, même si le formulaire était resté ouvert. Les observations fraîches sont conservées lors d’un refus métier.
- Si un besoin existe avant une dégradation de l’identité, il reste consultable. Son retrait reste possible pour corriger le dossier ; ce retrait ne sélectionne ni ne commande aucune pièce.
- Une version accompagne chaque modification/retrait. Deux opérateurs partant de la même version ne peuvent pas s’écraser : l’un réussit, l’autre doit recharger. Le formulaire d’ajout porte un identifiant unique pour dédupliquer une retransmission identique.
- La base fixe elle-même l’auteur, les dates et le numéro de version. Une modification ne peut pas déplacer un besoin vers un autre véhicule ou garage. Le rôle applicatif ne peut pas réécrire le journal ni forcer un numéro de version.
- Le retrait est un archivage logique. Le journal conserve les valeurs avant/après et l’auteur ; l’interface affiche le nombre d’événements, pas encore un outil de consultation détaillée de ce journal.

La position est attachée au besoin de ce véhicule ; elle ne devient pas une propriété générale d’une pièce. Les écrans de recherche de références, chiffrage, devis et commande ne sont pas implémentés.

## Validation

Tests ajoutés avant l’implémentation : validation de saisie et représentation de l’incertitude, initialement en échec faute de module. Puis contrôles PostgreSQL sur création, modification, retrait, auteur, journal, refus intergarage, identité incomplète, déduplication et concurrence. Les rôles vendeur et mécanicien sont exercés avec le rôle applicatif réel ; l’administrateur ne sert qu’à préparer/rétablir ces fixtures.

Commandes :

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Ne pas exécuter les suites en parallèle : elles partagent les comptes de démonstration et les tests de limitation de connexion. Elles modifient uniquement la base locale de test. Les tests navigateur créent une ligne synthétique, la modifient puis la retirent. Les tests de base conservent aussi certaines fixtures de démonstration.

Résultats de la livraison : 16 tests métier/base passés ; 10 parcours Chromium passés (5 sur ordinateur, 5 à 390 px). Contrôles de persistance après rechargement, absence de débordement horizontal et hauteur tactile minimale des contrôles principaux. Compilation de production et vérification TypeScript réussies. Captures inspectées dans `test-results/besoins-desktop.png` et `test-results/besoins-mobile.png`.

Aucun essai sur téléphone physique, Mac d’atelier, compte fournisseur ou données réelles. L’installation cloud reste une démonstration locale, sans publication ni déploiement public automatique.
