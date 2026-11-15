# Messageries et assistants

## Traitement proposé

1. Recevoir un message via un canal officiellement accessible ; vérifier l’authenticité et dédupliquer l’identifiant fournisseur.
2. Enregistrer une demande dans le garage concerné. Résoudre le client sans supposer qu’un numéro suffit à autoriser un accès.
3. Extraire les informations proposées : plaque, pièces, quantités, symptômes et position. Conserver le message source et les incertitudes.
4. Demander validation au vendeur pour les éléments ambigus ; vérifier le véhicule auprès de la source.
5. Préparer une réponse et un devis ; le Boss déclenche tout envoi au client.

Un message client, une pièce jointe ou une page fournisseur est une donnée non fiable, jamais une instruction autorisant l’IA à utiliser des outils, exposer des secrets ou changer les règles du garage.

## Rôles fonctionnels proposés

| Assistant | Travail | Limite |
|---|---|---|
| Accueil | Structurer la demande | Ne crée pas de référence ni de compatibilité |
| Véhicule | Rassembler les observations | Ne remplace pas l’autorité du portail |
| Pièces | Préparer les rapprochements sourcés | Aucun lien sans preuve directe/OE commun |
| Offres | Présenter stock, prix et délai datés | Ne remplace pas une erreur par une absence |
| Devis | Calculer avec paramètres validés | N’envoie et ne valide rien seul |
| Mémoire | Indexer les preuves autorisées | Ne transforme pas une suggestion en vérité |

Ce sont des responsabilités logicielles envisagées, pas des agents installés ou des abonnements Limova. Commencer avec un orchestrateur simple et des tâches bornées ; multiplier les agents uniquement si une mesure montre un bénéfice.

## Prérequis à vérifier

Telegram : bot, droits et canal de réception. WhatsApp : compte et accès Business Platform réellement disponibles, fournisseur éventuel, webhooks, modèles et coûts applicables. Aucun accès n’est présumé à partir de la réponse « Business ». Les secrets seront saisis dans un gestionnaire sécurisé, jamais dans le chat ou Git.

Une acceptation reçue par messagerie ne contourne pas la signature. Le même état transactionnel de réponse fait autorité pour tous les canaux. Retenter une tâche ne doit pas dupliquer un envoi.
