# Décisions V2

## Éléments explicitement exprimés

| Réponse | Sens conservé | Conséquence |
|---|---|---|
| 1 | Commercialiser après un gain de temps et une fiabilité démontrés | Pilote métier avant ouverture commerciale |
| 2 | Un seul au lancement | Un garage pilote ; isolation multi-garage dès le socle selon AGENTS.md |
| 3 | Automobile d’abord | Moto et camion hors premier périmètre |
| 4 | 10 à 15 véhicules par jour | Dimensionner le pilote et mesurer les temps réels |
| 5 | Un magasinier/vendeur, quatre mécaniciens | Droits distincts ; attribution exacte à confirmer |
| 6 | Immatriculation donnant le VIN | Traçabilité de l’identification et contrôle des données manquantes |
| 7 | Concordance constructeur via TecDoc et Partslink24, moteur et position | Bloquer une sélection dont la variante reste indéterminée |
| 8 | DASIR prioritaire, PAVI second ; trois choix par fournisseur ; marques prioritaires | Comparer les deux fournisseurs, configurer les règles par famille |
| 9 | Stock interne, stock fournisseur, délai ; LUCAS filtration puis Mecafilter chez DASIR selon famille | Politique proposée, sans masquer une alternative ni inventer une disponibilité |
| 10 | Filtration/huile, freinage, distribution, suspension, direction, transmission, allumage | Familles du pilote |
| 12 | Accès via DASIR ; possibilité d’API au multi-tenant | Adaptateurs interchangeables ; aucune API supposée disponible |
| 13 | Session active et recherches multiples tant que la pause reste courte | File d’accès Partslink24 ; durée d’expiration à mesurer |
| 17 | Ajouts possibles ensuite, principalement la pièce | Priorité pièces ; main-d’œuvre reste prévue par AGENTS.md |
| 18 | Envoi de devis en cas de doute sur un élément | Sens exact à confirmer ; aucun envoi automatique autorisé |
| 20 | Consigne dans un second temps, mais mention du retour | Mention à prévoir si consigne connue ; traitement financier à confirmer |
| 21 | Environ 2 000 références courantes | Taille cible indicative de la mémoire, aucune donnée préchargée inventée |
| 24 | Pas nécessaire en V1 | Fonction visée inconnue : aucune exclusion déduite |
| 26 | Business | Objet inconnu, ne prouve ni compte WhatsApp disponible ni accès API |
| 28 | Hybride | Hébergement hybride proposé, sens à confirmer |
| 29 | Le plus adapté | Choix techniques proposés et justifiés |
| 30 | Rapidement, au plus faible coût | Lots courts, coûts observables, pas de promesse de délai ou budget |

Les réponses 11, 14, 15, 16, 19, 22, 23, 25 et 27 sont « oui/non » sans question accessible : elles sont conservées comme **non interprétables**. Aucune exigence ne leur est attribuée. Le numéro 24 figure plus haut mais reste également sans objet identifié.

## Arbitrages non validés

- Stock interne : AGENTS.md exige un stock fournisseur au chiffrage, alors que la réponse 9 donne priorité au stock garage. Proposition : autoriser une ligne couverte intégralement par le stock interne disponible et contrôlé ; sinon exiger une offre fournisseur fraîche. Validation nécessaire avant implémentation.
- Envoi en présence d’un doute : maintenir le clic du Boss ; proposer une demande de précision plutôt qu’un devis engageant sur une compatibilité incertaine. La réponse 18 ne lève pas les garde-fous originaux.
- Consigne : aucune ligne financière omise silencieusement. Un montant requis mais inconnu bloque le devis ; règle de présentation et de remboursement à valider.
- Main-d’œuvre : priorité commerciale aux pièces, sans supprimer son traitement prévu dans AGENTS.md.
- Un garage au lancement ne supprime pas l’isolation par la base.

Les pourcentages d’AGENTS.md sont des valeurs métier proposées par le brief ; ils doivent être configurés explicitement par le garage. Ne pas les appliquer en repli si le réglage manque.
