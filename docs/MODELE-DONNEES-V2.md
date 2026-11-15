# Modèle de données proposé

Chaque table métier porte `garage_id` avec RLS. Les liens intertables doivent empêcher les associations entre garages par contraintes adaptées, en plus des politiques. Aucun catalogue partagé entre garages en V1 sans décision explicite sur les licences et la confidentialité.

| Entité | Données et contraintes principales |
|---|---|
| Garage, membre | Régime fiscal, réglages de prix explicites, rôle et appartenance |
| Client | Coordonnées, catégorie tarifaire, préférences de contact, consentements nécessaires |
| Véhicule | Plaque, VIN, code moteur brut et normalisé, variante, source, date de vérification |
| Demande, besoin | Canal, client, véhicule, famille, quantité, essieu/côté, statut de précision |
| Référence | Marque, référence brute et normalisée, famille ; unicité dans son contexte fabricant |
| OE et équivalence | Liens directs, source, preuve, date ; pas de fermeture transitive générale |
| Compatibilité | Véhicule/variante, référence, essieu/côté, preuve, état vérifié/ambigu/rejeté |
| Offre fournisseur | Source, référence, achat, devise, stock, délai, observation et expiration |
| Règle de marque | Famille fine, système ou général, priorité et gamme ; règle précise prioritaire |
| Stock et mouvement | Entrée, sortie, réservation, quantité, origine ; disponibilité transactionnelle |
| Devis, version, ligne | Instantanés prix/libellés/règles, type pièce/prestation/consigne, état et totaux |
| Remise et réponse | Canal, version envoyée, empreinte document, signature, jeton haché et expiration |
| Préparation commande | Besoin accepté, allocation garage/fournisseur ; confirmation de commande manuelle |
| Intégration et tâche | Métadonnées de session, secret chiffré, quota, verrou, reprise et erreur typée |
| Audit et connaissance | Acteur, événement, provenance, preuve expurgée, statut et durée de conservation |

## Invariants à prouver

- Une référence seule ne prouve aucune compatibilité ; l’essieu et le côté sont sur le lien avec le véhicule.
- Normaliser les segments du code moteur par égalité stricte après tri, tout en conservant l’original et la source.
- Une observation vide ne supprime pas une donnée connue ; une contradiction reste visible avec ses sources.
- Un devis remis est immuable. Les offres fraîches alimentent une nouvelle version, jamais l’ancienne.
- Une seule réponse finale par devis via écriture conditionnelle transactionnelle, même entre Telegram et le web ; ordre de verrouillage unique.
- Réserver du stock ne peut pas créer une disponibilité négative lors de deux validations simultanées.
- Montants en décimaux, devise explicite, arrondis déterministes ; pas de flottants binaires pour les totaux.
- Les seuils de fraîcheur, durées des jetons et règles de conservation restent des paramètres à valider, pas des nombres inventés.
