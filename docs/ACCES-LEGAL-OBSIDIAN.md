# Réglages privés, pages légales et Obsidian

## Fonctions livrées

La connexion existante est conservée et complétée : liens légaux publics, changement de mot de passe depuis les réglages, révocation de toutes les sessions après changement. Les mots de passe nouveaux doivent avoir au moins 15 caractères et au plus 72 octets ; cinq erreurs sur le mot de passe actuel bloquent les essais quinze minutes. L’administration des utilisateurs, l’invitation, la récupération et le MFA restent hors de cette livraison.

`/reglages` est accessible après authentification depuis le menu et l’icône dans l’en-tête mobile. Chaque utilisateur peut changer son mot de passe. Seul le rôle responsable (`boss`) accède aux formulaires DASIR, PAVI, Partslink24, YACCO et Henrri. Les vendeurs et mécaniciens n’accèdent pas aux secrets ni à leurs métadonnées par les politiques PostgreSQL.

L’identifiant, le secret et l’adresse du portail sont chiffrés ensemble en AES-256-GCM. Le chiffrement authentifie le contexte garage/fournisseur. Le navigateur reçoit seulement le nom du fournisseur et l’état enregistré/non testé. Les valeurs existantes ne sont jamais réaffichées, même au responsable. Le formulaire utilise des champs masqués et les vide après enregistrement. Une suppression exige une case explicite de confirmation. Le journal conserve auteur, fournisseur, opération et date, jamais les valeurs secrètes ou leur contenu chiffré.

La clé aléatoire est hors base et hors Git dans `.local/keys/suppliers.key`, permissions 0600 ; on peut définir `SUPPLIER_KEY_FILE` vers un secret monté par l’hébergeur. `npm run secrets:init` crée la clé uniquement si absente ; `npm run db:setup` l’appelle après les migrations. Ne jamais supprimer/régénérer cette clé pour un coffre existant : cela rendrait les secrets illisibles. La rotation de clé n’est pas encore implémentée. En production, externaliser la clé, limiter les accès système et prévoir sauvegarde/restauration séparées. Le chiffrement n’empêche pas un administrateur disposant à la fois du serveur et de la clé d’accéder aux secrets.

## Démarrer et essayer

Base locale démarrée :

```sh
npm run db:setup
npm run build
npm run start
```

Sur votre poste où l’application est lancée : ouvrir `http://localhost:3000/connexion`, puis Réglages. Pour une application distante, un accès HTTPS effectif ou un tunnel privé est indispensable ; le localhost de votre ordinateur n’est pas celui du cloud. Aucun outil d’aperçu interactif n’est actuellement disponible dans ce chat. Le code applicatif ne résout pas cette limitation d’accès au bureau distant.

Tester d’abord avec des valeurs synthétiques. Enregistrer, recharger : seules les mentions « enregistré » et « non testé » apparaissent. Changer le rôle du compte de test en mécanicien dans une fixture dédiée doit masquer les cartes et interdire les accès en base. La suite navigateur couvre ce parcours sur ordinateur et mobile.

**Aucun connecteur réel n’est implémenté par ce coffre.** Il n’effectue pas de requête vers l’URL enregistrée, ne teste pas la validité du compte et ne change pas le simulateur d’identification. Il reste à intégrer et valider les portails un à un avec leurs droits d’utilisation, MFA et limites de session. Les versions de production ne doivent pas être déduites de la réussite de ce pilote synthétique.

## Pages légales

Pages publiques accessibles sans connexion : mentions légales, confidentialité, cookies et conditions d’utilisation du pilote. Cette publicité est volontaire pour permettre l’information avant connexion. Ces pages n’accèdent à aucune donnée fournisseur ni métier. Elles constituent une exception documentaire à l’obligation de connexion des pages métier d’AGENTS.md, nécessaire à la demande de pages légales.

L’utilisateur a demandé de reporter les informations d’entreprise à V2. Les textes portent donc le statut **brouillon** et ne sont pas présentés comme des documents définitifs. À compléter : éditeur, forme, capital si applicable, immatriculation, TVA si applicable, coordonnées, publication, hébergeur, bases des traitements, prestataires/transferts, conservation et contact droits. Les CGV et mentions de médiation/garanties/rétractation devront être établies si un parcours commercial concerné est ouvert ; aucun médiateur fictif n’est désigné.

Références de travail : RGPD, LCEN et obligations d’information d’un site professionnel, article 82 de la loi Informatique et Libertés, règles de consommation selon activité. Les consultations CNIL, Service Public, economie.gouv.fr et EUR-Lex ont retourné un refus de proxy HTTP 403 le 14 novembre 2026. Aucun arrêt récent ni état consolidé de novembre 2026 n’a pu être vérifié. Une conformité à la jurisprudence française de 2026 ne peut donc pas être attestée. Les sources sont reliées dans les pages pour une vérification ultérieure.

La page cookies décrit seulement le cookie de session actuellement implémenté ; aucun bandeau de consentement inutile n’est ajouté. L’hébergement/proxy final doit être contrôlé pour identifier ses propres traceurs. Les textes expliquent les limites réelles de purge et de conservation ; aucune suppression automatique générale non implémentée n’est promise.

## Obsidian

L’utilisateur dispose d’un coffre existant et fournira son chemin. Aucun coffre personnel n’a été ouvert ni modifié. Le [kit](../obsidian-kit/README.md) et son import sont prêts : contrôle sans écriture, refus de conflit, préservation de `.obsidian` et des notes existantes, import répétable. Les répertoires de sources, références, équivalences, décisions et éléments à vérifier sont organisés dans un sous-dossier DEPANOS.

```sh
npm run obsidian:import -- --vault /chemin/du/coffre
npm run obsidian:import -- --vault /chemin/du/coffre --apply
```

Le chemin doit être accessible à la machine exécutant la commande. Un coffre sur Mac exige un import exécuté sur Mac ou un montage explicitement autorisé. Aucun plugin communautaire ni Sync/Publish n’est ajouté. Les notes n’ont pas de chiffrement propre : sécuriser disque et sauvegardes. Ne pas partager de coffre entre garages. Les secrets, données client, plaques et VIN sont exclus des modèles. Il n’y a ni extraction de portail, ni ingestion automatique, ni export des données applicatives.

## Validation et limites

Tests de chiffrement (contexte et altération), RLS responsable/vendeur/mécanicien/intergarage, journal sans secret, changement de mot de passe et révocation ; import Obsidian en simulation/réexécution/conflit ; parcours navigateur sur ordinateur et mobile. Les fixtures de sécurité sont des comptes et garages jetables, sans accès fournisseur réel. Les suites ne doivent pas être lancées simultanément sur les comptes de démonstration partagés.

L’instance reste un pilote. Un essai en conditions réelles nécessite encore l’accès privé HTTPS, les comptes individuels, les informations légales différées, les politiques de sauvegarde/conservation, puis les connecteurs validés. Aucun site n’est publié et aucun brouillon de configuration cloud n’est modifié par cette livraison.

Résultats du 14 novembre 2026 : 19 tests métier/base/sécurité réussis et 12 parcours Chromium réussis (ordinateur et mobile). Compilation de production et TypeScript réussis. Les manifestes de déploiement ont été contrôlés : aucune clé `.local` ni fichier `.env` n’y figure. La clé doit être fournie séparément au serveur lors d’un déploiement. L’import Obsidian est testé dans un coffre temporaire, pas dans le coffre personnel dont le chemin reste attendu.
