# Roadmap et critères de livraison

Les **lots 1 et 2 sont implémentés**. Les lots 3 à 8 ne sont pas commencés. Voir [le lot 2 et sa validation](LOT-2-BESOINS.md). Les questions du lot 0 qui concernent stock, consigne et devis restent à arbitrer avant les lots correspondants. Aucun calendrier ni coût garanti avant mesure. Voir [le démarrage du lot 1](DEMARRAGE-LOT-1.md).

| Lot | Livrable | Preuves attendues |
|---|---|---|
| 0 — validation | Arbitrages, périmètre, hébergement et accès | Décisions consignées, aucune donnée réelle supposée |
| 1 — socle et véhicule | Authentification, RLS, fiche et adaptateur simulé explicite | Tests d’isolation avec rôle applicatif ; identification incomplète bloquée ; navigateur mobile |
| 2 — besoins | Tour du véhicule par famille et position | Persistance, droits mécanicien/vendeur, absence de débordement à 390 px |
| 3 — prix | Calculs, régimes, main-d’œuvre, micro-entreprise | Tests limites, arrondis, réglages absents et instantanés avant tout écran de prix |
| 4 — devis | Versions, rendu client, validation Boss, jeton, signature | Références masquées sans altérer heures ; expiration ; réponse concurrente unique |
| 5 — première source réelle | DASIR selon accès autorisé, puis Partslink24 et PAVI | Connexion, donnée contrôlée, erreur de portail distincte d’absence ; reprise après expiration |
| 6 — approvisionnement | Stock interne, réservations, préparation de commande | Concurrence, traçabilité et arbitrage stock validé ; commande toujours manuelle |
| 7 — Henrri et messages | Documents et messageries selon capacités confirmées | Environnement de test ou contrôle non destructif ; idempotence ; clic Boss obligatoire |
| 8 — mémoire et diagnostic | Recherche sourcée, propositions de rapprochement et aide mécanicien | Conflits visibles ; aucune compatibilité déduite de l’IA seule |

Les intégrations se livrent une par une. YACCO suit la validation du parcours huile. WhatsApp peut suivre Telegram selon les prérequis réels de compte et de tarification.

## Mesure du pilote

Mesurer le temps entre demande et devis validé, les corrections de référence, retours fournisseur, demandes bloquées et indisponibilités par source. Définir la référence de comparaison et les objectifs avec le Boss avant de conclure à un gain. Ne pas commercialiser sur une simple démonstration.

Pour chaque livraison : périmètre vérifié, commandes exactes, résultats des tests et contrôle navigateur mobile. Montrer un test reproduisant le défaut avant/après pour les corrections ; pour une nouvelle fonction, montrer le critère échouant avant implémentation. Données de test synthétiques marquées, séparées des données réelles.
