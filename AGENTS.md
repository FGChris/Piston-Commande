# Brief pour Codex — un SaaS de chiffrage de pièces auto pour garages

> À déposer à la racine d'un dépôt vide, sous le nom `AGENTS.md`. Codex le lit à chaque
> session. Il décrit **le besoin, les règles métier et les pièges déjà rencontrés**, pas
> l'implémentation. Une application qui fait ce travail existe déjà (Piston Pièces) ; tu ne
> la copies pas. Tu proposes ta propre architecture, ton propre découpage et ton propre
> design, et tu les défends.

---

## 1. Ta posture

- Tu travailles pour l'exploitant d'un garage (on l'appelle **Boss**). Il connaît son métier,
  pas le code. Écris-lui en français, simplement, sans jargon inutile.
- **Avant d'écrire du code**, propose un plan court : architecture, modèle de données,
  découpage en lots. Pose tes questions **groupées**, avec ta recommandation pour chacune.
  Attends sa validation avant le premier lot.
- Les **règles métier** de la section 4 sont les siennes, issues de son vrai travail au
  comptoir. Tu peux les questionner si tu vois un risque, mais tu ne les changes pas sans
  son accord.
- Les **choix techniques** sont les tiens (langage, framework, base, hébergement, design).
  Justifie-les par rapport aux contraintes de la section 5, pas par habitude.
- **Ne jamais inventer de donnée métier** : référence, prix, stock, compatibilité, véhicule,
  taux de marge. Quand une donnée manque, l'écran le dit et l'action est bloquée ; aucune
  valeur « plausible » ne la remplace. C'est la règle la plus importante du projet.
- Prouve ce que tu livres : un test qui échoue avant ton changement et passe après, puis
  un contrôle dans un vrai navigateur, mobile compris. « Ça devrait marcher » n'est pas une
  preuve.

## 2. Le métier, en une page

Un garage (réparation, préparation de véhicules d'occasion) doit chiffrer vite et sans
erreur les pièces d'un véhicule précis, puis envoyer un devis au client.

Le problème central : **la mauvaise référence**. Deux voitures du même modèle peuvent monter
des pièces différentes (motorisation, année, boîte, options). Une erreur coûte un retour
fournisseur, une immobilisation, parfois un client.

Le parcours :

1. Le Boss saisit une **plaque d'immatriculation**. L'app identifie le véhicule exact (VIN,
   marque, modèle, motorisation, **code moteur**, boîte, date de première mise en
   circulation).
2. Il fait le **tour du véhicule** : il coche les pièces à changer, par système (freinage,
   filtration, distribution, suspension…), en précisant le côté quand il y en a un (avant
   ou arrière, gauche ou droite).
3. L'app trouve les **pièces compatibles** avec ce véhicule précis, puis interroge les
   **fournisseurs** en temps réel pour le prix d'achat et le stock.
4. Pour chaque pièce, l'app propose **trois gammes** (Éco, Standard, Premium) chez chaque
   fournisseur. Le Boss choisit.
5. Il obtient un **devis** avec prix de vente calculés, main-d'œuvre comprise, et le
   **remet au client** : PDF, message, ou page web où le client signe au doigt.
6. Devis accepté : l'app **prépare la commande**, en prenant d'abord le stock du garage,
   puis le fournisseur. Le passage de commande sur le portail fournisseur reste manuel.

Utilisateurs : le Boss et ses opérateurs, souvent **sur téléphone** à côté du véhicule. Le
client final ne voit que son devis.

## 3. Sources de données (ce qui existe chez le Boss)

| Source | Ce qu'elle apporte | Accès |
|---|---|---|
| **DASIR** (distributeur, fournisseur principal) | prix d'achat nets, remises, stock ; passerelle vers le catalogue TecDoc/TecAlliance (identification par plaque, pièces par véhicule) | portail web avec compte, **pas d'API publique** |
| **PAVI** (distributeur, fournisseur secondaire) | prix, stock, équivalences, numéros d'origine ; identification par plaque | portail web avec compte |
| **Partslink24** | pièces d'origine constructeur **par VIN** : l'autorité pour trancher une compatibilité | portail web, session unique |
| **YACCO** (huiles) | préconisation d'huile par **moteur** : viscosité, norme, capacité | portail web |
| **Henrri** (logiciel de facturation) | le document juridique : numérotation, validation, facture, e-facture | API |
| **Telegram** | canal de demande et de réponse du client, et notifications du Boss | bot |

Contraintes :
- Les portails n'ont pas d'API : il faut les piloter avec un navigateur automatisé, avec une
  session réutilisée et des identifiants chiffrés côté serveur, jamais renvoyés au client.
- Ces portails changent sans prévenir : chaque intégration doit détecter qu'elle ne
  comprend plus la page, et le dire au lieu de rendre « aucun résultat ».
- **Interdit** : aspirer en masse des sites tiers (Oscaro, Autodoc…). On n'utilise que les
  portails où le garage a un compte, et les catalogues publiés par les fabricants.

## 4. Règles métier (non négociables sans accord du Boss)

### Compatibilité
- Une pièce se choisit sur le **code moteur exact** (plus VIN, carburant, année), **jamais
  sur le modèle seul**. Ne jamais généraliser une pièce d'un véhicule à un autre du même
  modèle.
- Deux références sont **équivalentes** seulement si un portail les lie directement ou si
  elles partagent un **numéro d'origine constructeur (OE)**. Pas de chaîne « A ressemble à
  B qui ressemble à C ».
- Une équivalence entre deux **systèmes différents** (un filtre « équivalent » à une
  biellette) est une erreur de données : on l'écarte, on ne l'affiche pas.
- **L'essieu et le côté appartiennent au lien pièce-véhicule, pas à la pièce.** La même
  référence peut être avant sur un véhicule et arrière sur un autre.
- Quand plusieurs variantes restent possibles, l'app montre le **doute** et laisse le Boss
  trancher. Elle ne choisit jamais à sa place.
- L'identité du véhicule se **revérifie auprès du portail** à chaque ouverture de la fiche :
  une identité fausse gardée en mémoire choisit de mauvaises pièces sans que personne ne le
  voie.

### Prix
- Le prix de vente se calcule ainsi : `PV HT = achat ÷ (1 − taux de marge)`, puis
  `PV TTC = PV HT × (1 + TVA)`, puis `net = PV TTC × (1 − remise)`.
- **Trois régimes** selon le client :
  - client de passage : marge 50 %, remise 0 % ;
  - particulier enregistré : marge 43 %, remise 15 % ;
  - professionnel : marge 43 %, remise 25 %.
  Ces six valeurs sont des **réglages** du garage. Un réglage absent bloque le devis.
- Marge et remise sont **ajustables ligne par ligne**. Ajuster la marge sert aussi
  d'arrondi.
- Le **prix d'achat est figé** dans la ligne de devis. Un devis déjà remis ne change jamais
  de montant.
- TVA à 20 % par défaut. Le **régime fiscal** se règle par garage : en micro-entreprise,
  achat TTC et vente sans TVA (art. 293 B du CGI).
- **Main-d'œuvre** : une prestation, pas une pièce. Elle se saisit en heures × taux horaire
  du garage, ou en forfait TTC, sans marge ni remise. On ne la commande jamais à un
  fournisseur.

### Fournisseurs et gammes
- Un devis ne contient que des **articles en stock** chez un fournisseur, vérifiés au moment
  du chiffrage.
- **PAVI est toujours proposé à côté de DASIR**, même plus cher : il livre 4 fois par jour
  contre 2, c'est le canal d'urgence.
- La **gamme d'une marque dépend de la famille de pièce** : une marque peut être Premium sur
  les freins et Éco sur les filtres. La résolution va du plus précis au plus général :
  famille fine, puis système, puis règle générale.

### Ce que voit le client
- La **référence numérique n'apparaît jamais sur un devis** remis au client : elle lui
  permettrait d'acheter ailleurs. La **marque et le type** sont visibles
  (« BREMBO — Disques AR »).
- Sur le **bon de livraison et la facture**, la référence réapparaît (garantie, SAV).
- Une ligne sans libellé propre bloque la remise du devis : pas de document dégradé.
- Le client n'a pas de compte. Sa page de devis se protège par un **lien à jeton aléatoire**
  qui expire (pas le numéro du devis, qui se devine).
- **Une seule réponse du client compte**, quel que soit le canal (Telegram, page web).
- Accepter exige une **signature**. **Rien ne part chez le client sans le clic du Boss.**

### Facturation
- Le document juridique (numérotation légale, facture, e-facture obligatoire en France)
  **naît dans Henrri**. L'app prépare et chiffre ; elle ne valide jamais une facture
  toute seule.

## 5. Contraintes techniques

- **Multi-garage dès le départ** : chaque donnée métier appartient à un garage, et
  l'isolation est garantie **par la base**, pas seulement par le code applicatif.
  Prouve-la par un test qui écrit chez un autre garage puis vérifie qu'on ne le lit pas.
- **Toute action serveur vérifie la session** en première instruction, pages comprises.
  Seule exception : la page publique du devis client, protégée par son jeton, avec un débit
  limité.
- Identifiants fournisseurs : chiffrés, clé hors base, jamais dans le dépôt, jamais dans
  les logs.
- Limitation de débit des appels aux portails **en base** (partagée entre processus), pas
  en mémoire.
- Le serveur actuel est **un Mac allumé en permanence à l'atelier**. Une page publique passe
  par un tunnel qui n'expose qu'elle. Si tu proposes autre chose (VPS, cloud), dis ce que
  ça change : les portails verront une adresse de datacenter, et un compte nominatif peut
  être bloqué.
- **Mobile d'abord** : boutons de 44 px minimum, aucun défilement horizontal à 390 px,
  utilisable d'une main.

## 6. Pièges déjà rencontrés (à éviter dès le départ)

Ce sont des erreurs réelles de la première version. Chacune a coûté du temps.

1. **Une propriété « posée une fois, jamais écrasée » cache toute information plus
   précise.** Une pièce classée « Frein à disque » (famille générique) ne devenait jamais
   « Plaquettes de frein arrière » : le besoin arrière ne trouvait plus rien.
2. **Mémoire d'abord, source ensuite = correction impossible.** Pour l'identité du
   véhicule comme pour les images, la donnée fraîche du portail doit l'emporter. Un champ
   vide côté portail n'efface jamais ce qu'on savait.
3. **Les formats diffèrent entre sources** : code moteur `DV6TED4_9HZ` chez l'un,
   `9HZ_DV6TED4` chez l'autre. Comparer des segments triés, en égalité stricte, jamais
   « contient ».
4. **Un écran de chargement n'est pas un échec.** Après le login, les portails passent par
   une page vide transitoire : attendre activement l'état connecté, jamais un délai fixe.
5. **Une panne n'est pas une absence.** Un portail en erreur doit s'afficher « portail
   indisponible », jamais « pièce non trouvée ».
6. **Un filtre écrit pour un contenu se trompe sur un autre.** Le filtre anti-référence
   réduisait « Main-d'œuvre — 1,5 h » à « h ». Tout nouveau type de ligne passe par un test
   de rendu du devis.
7. **Un garde-fou posé sur une valeur de repli ne se déclenche jamais.** Le nom de société
   absent était remplacé par « Mon garage » avant le contrôle « nom manquant ».
8. **Les arêtes d'équivalence se polluent** quand on parcourt le graphe en plusieurs sauts.
   On limite les sauts au numéro d'origine commun, et on contrôle la cohérence de système.
9. **Une vignette de marque n'est pas une photo de pièce.** Une même image partagée par
   plusieurs systèmes est un logo.
10. **Deux réponses simultanées** (deux clics, web et Telegram) : une seule écriture
    conditionnelle en base, et le même ordre de verrouillage sur tous les chemins.

## 7. Par où commencer (proposition, à discuter)

1. Ton plan : architecture, modèle de données (véhicules, références, liens d'équivalence
   avec source et confiance, compatibilités véhicule-pièce avec essieu et côté, offres
   fournisseurs horodatées, devis et lignes), découpage en lots, tes questions.
2. Lot 1 : identification par plaque et fiche véhicule, avec une source simulée derrière
   une interface interchangeable. Les vrais portails viennent ensuite, un par un.
3. Lot 2 : tour du véhicule, besoins par système et par côté.
4. Lot 3 : moteur de prix (les trois régimes, la main-d'œuvre, le micro-entrepreneur),
   entièrement testé avant tout écran.
5. Lot 4 : devis, remise au client sans référence, réponse unique, signature.
6. Lots suivants : intégrations réelles (DASIR, PAVI, Partslink24, YACCO, Henrri, Telegram),
   commandes et stock.

## 8. Ce que le Boss attend de toi

- Des écrans qu'il comprend sans formation, avec un seul geste principal par écran.
- Des messages d'erreur dans sa langue : jamais une trace technique à l'écran, le détail
  replié pour le dépannage.
- À chaque livraison : ce qui marche, ce qui n'est pas vérifié et pourquoi, et la commande
  exacte pour le voir sur son poste.
