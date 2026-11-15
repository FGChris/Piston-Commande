# Priorités métier

## Parcours du pilote

Demande manuelle ou message → véhicule identifié et revérifié → besoins structurés → référence OE et compatibilité → offres horodatées → choix humain → chiffrage → contrôle du Boss → remise du devis → signature → réservation du stock et préparation de commande → commande manuelle → document juridique Henrri.

Le module de diagnostic mécanicien sert d’abord à décrire les symptômes et les contrôles effectués. Une hypothèse de diagnostic ne prouve jamais la pièce à remplacer ni sa compatibilité. Diagnostic assisté avancé hors premier lot.

## Ordre de décision

1. Vérifier VIN, code moteur, variantes et position dans le lien véhicule-pièce.
2. Écarter les équivalences sans lien direct documenté ou OE commun, et les systèmes incohérents.
3. Contrôler disponibilité et fraîcheur ; l’arbitrage stock interne est soumis à validation.
4. Comparer délai, règles de marques et gamme par famille. Garder DASIR et PAVI visibles, même si PAVI est plus cher.
5. Présenter jusqu’à trois gammes réelles par fournisseur. Une gamme absente reste indisponible ; ne pas fabriquer trois offres.

En filtration, proposer LUCAS en priorité puis Mecafilter disponible chez DASIR, selon la famille et après compatibilité. Les autres familles et exceptions demandent une table validée. L’ordre exact entre marque préférée et urgence de livraison reste à confirmer.

## Prix et remise

Appliquer les formules d’AGENTS.md : PV HT = achat / (1 − marge), PV TTC = PV HT × (1 + TVA), net = PV TTC × (1 − remise). Régimes passage 50 % / 0 %, particulier 43 % / 15 %, professionnel 43 % / 25 % : réglages explicites, pas valeurs de secours. Valider les bornes et les arrondis monétaires ; utiliser des décimaux précis. La micro-entreprise utilise une base achat TTC et une vente sans TVA selon le brief ; présentation à confirmer avec le responsable comptable.

Main-d’œuvre : heures × taux ou forfait TTC, sans marge ni remise. Le prix d’achat et les paramètres sont figés dans le devis remis. Toute correction produit une nouvelle version ; aucune réécriture du document envoyé.

## Sorties et erreurs

- Devis client : marque et libellé propre, aucune référence numérique de pièce ; préserver heures et quantités légitimes.
- Bon de livraison/facture : références présentes. Document juridique créé dans Henrri selon ses capacités vérifiées.
- Page client : jeton aléatoire expirant, signature requise, réponse unique tous canaux confondus.
- Donnée manquante, portail indisponible, session expirée, page inconnue et absence réelle de résultat sont des états distincts.
- Rien n’est envoyé au client sans action du Boss ; aucune commande fournisseur automatique.
