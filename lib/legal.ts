export const legalPages = {
  mentions: {
    title: "Mentions légales",
    sections: [
      [
        "Éditeur et responsable de publication",
        "À renseigner en V2 : raison sociale ou identité de l’entrepreneur, forme juridique, capital social si applicable, siège ou adresse professionnelle, SIREN et immatriculation pertinente, numéro de TVA si applicable, e-mail, téléphone et directeur de publication. Le nom de travail DEPANOS ne constitue pas une identification légale de l’éditeur.",
      ],
      [
        "Hébergement",
        "À renseigner en V2 : identité ou raison sociale de l’hébergeur de production, adresse et téléphone. L’environnement de développement actuel ne préjuge pas de l’hébergement définitif.",
      ],
      [
        "Activité et contenus",
        "Cet espace sert à tester un outil de préparation de besoins en pièces automobiles. Les exemples identifiés comme tests sont fictifs. Il n’existe à ce stade aucun parcours de commande, paiement ou facturation opérationnel. Les marques citées identifient des services tiers ; elles ne signifient pas un partenariat. Les droits de réutilisation des catalogues doivent être vérifiés avant toute collecte.",
      ],
      [
        "Avant ouverture commerciale",
        "Compléter les mentions applicables à la structure et à l’activité. Si une vente à des consommateurs est proposée : prévoir les informations précontractuelles, les CGV, garanties légales, médiateur de la consommation effectivement désigné et règles de rétractation applicables au contrat. Le présent brouillon ne crée ni renonciation ni exception à ces droits.",
      ],
    ],
  },
  confidentialite: {
    title: "Protection des données personnelles",
    sections: [
      [
        "Responsable et contact",
        "L’identité du responsable de traitement et son contact pour les droits sont à renseigner en V2. Ne pas utiliser ce brouillon comme information définitive destinée aux clients. Pour une future offre multi-garage, préciser les rôles respectifs de l’exploitant et de chaque garage et les accords de sous-traitance requis.",
      ],
      [
        "Données et finalités",
        "Comptes : e-mail, nom affiché, rôle, garage, empreinte du mot de passe et sessions, pour contrôler les accès. Dossiers : immatriculation, identité véhicule, observations et besoins pour préparer le travail de l’atelier. Journaux : auteur, date et modifications pour la traçabilité. Accès fournisseurs : identifiant, adresse du portail et secret chiffrés, pour préparer les connexions autorisées. À ce stade, aucune donnée n’est transmise par un connecteur fournisseur ou un service IA.",
      ],
      [
        "Bases juridiques à documenter",
        "Déterminer et documenter avant le pilote réel la base propre à chaque finalité : exécution d’un contrat ou mesures précontractuelles lorsque les conditions sont réunies ; intérêt légitime évalué pour la sécurité et certaines opérations internes ; obligation légale pour les données concernées par un texte précis. Le consentement ne doit pas être utilisé par défaut pour tout traitement. Aucune donnée ne sert à une décision automatisée de compatibilité dans cette version.",
      ],
      [
        "Destinataires et transferts",
        "Les membres du garage accèdent aux données métier dans la limite de leur rôle. Les métadonnées de configuration fournisseurs sont réservées au responsable ; les secrets ne sont pas retournés dans les pages. L’opérateur technique de l’hébergement peut disposer d’accès administrateur : les garanties organisationnelles et contractuelles restent à établir. Identifier les hébergeurs et autres sous-traitants, leurs pays et tout transfert hors EEE avec ses garanties avant de traiter des données réelles.",
      ],
      [
        "Conservation",
        "Sessions : durée maximale de huit heures ; les sessions expirées ne sont plus acceptées, et leur nettoyage physique intervient lors d’une connexion réussie. Les besoins retirés et leur historique restent conservés. Il n’y a pas encore de purge automatique générale des véhicules, observations et journaux. Les durées métier, règles d’archivage et délais de suppression des sauvegardes doivent être décidés et appliqués avant le pilote réel. Ne pas assimiler un retrait d’écran à un effacement RGPD.",
      ],
      [
        "Vos droits",
        "Selon les conditions du RGPD : accès, rectification, effacement, limitation, opposition, portabilité et retrait d’un consentement lorsqu’il est la base du traitement. Le retrait ne remet pas en cause la licéité passée. Une demande doit recevoir une réponse dans le délai applicable, en principe un mois, avec prolongation possible de deux mois motivée dans les conditions de l’article 12. Le point de contact reste à compléter. Vous pouvez saisir la CNIL : https://www.cnil.fr/fr/plaintes.",
      ],
      [
        "Sécurité et Obsidian",
        "Les accès fournisseurs sont chiffrés avec une clé séparée de la base. Un déploiement réel nécessite HTTPS, sauvegardes protégées et gestion de la clé hors des accès ordinaires. Le coffre Obsidian existant n’est pas raccordé : le kit ne synchronise aucune donnée. Un export futur est une copie supplémentaire, avec ses propres droits, sauvegardes et durées de conservation. Ne jamais y exporter les secrets d’accès.",
      ],
    ],
  },
  cookies: {
    title: "Cookies et stockage local",
    sections: [
      [
        "Cookie de session nécessaire",
        "depanos_session : jeton opaque utilisé pour authentifier l’utilisateur. Durée maximale : huit heures. Cookie HttpOnly, SameSite=Lax, Secure lorsque le serveur est configuré en HTTPS. La déconnexion révoque la session et supprime le cookie. Sa suppression dans le navigateur impose une nouvelle connexion.",
      ],
      [
        "Consentement",
        "Les traceurs strictement nécessaires au service expressément demandé peuvent relever de l’exemption de consentement de l’article 82 de la loi Informatique et Libertés. L’application ne charge actuellement ni publicité, ni mesure d’audience, ni traceur social facultatif ; elle n’affiche donc pas de bandeau de consentement factice. Tout ajout ultérieur doit être évalué, documenté et, si requis, soumis à un consentement préalable avec refus et retrait aussi simples que l’acceptation.",
      ],
      [
        "Périmètre de cette information",
        "Cette description porte sur l’application. Les outils de développement, l’hébergeur, un futur proxy public et d’éventuels services tiers doivent être vérifiés dans le déploiement final. Le stockage technique du navigateur ne doit pas contenir les accès fournisseurs.",
      ],
    ],
  },
  utilisation: {
    title: "Conditions d’utilisation du pilote",
    sections: [
      [
        "Objet",
        "Ce pilote est réservé aux utilisateurs autorisés du garage. Les fonctions présentes sont l’identification simulée, la description des besoins, la gestion privée des accès et la préparation documentaire. Aucune promesse de disponibilité, de compatibilité véhicule-pièce ou de prix réel n’est faite sur la base des données de test.",
      ],
      [
        "Comptes et autorisations",
        "Chaque personne doit disposer de son propre compte. Ne pas partager ses identifiants ni les accès d’un autre garage. Le responsable ne doit enregistrer que des comptes fournisseurs qu’il est autorisé à utiliser, dans le respect des contrats, licences, limitations de session et droits de réutilisation. Aucun contournement de MFA, CAPTCHA ou limitation d’accès n’est autorisé.",
      ],
      [
        "Décisions métier",
        "Les besoins exprimés ne constituent pas une sélection de références. L’identité, le moteur, l’essieu, le côté, les preuves de compatibilité et les offres doivent être vérifiés avant toute sélection réelle. Aucun message ou devis ne part sans décision du responsable. Les commandes fournisseurs restent manuelles. Les documents juridiques doivent être produits dans le logiciel de facturation prévu, lorsque l’intégration aura été vérifiée.",
      ],
      [
        "Droits et responsabilité",
        "Les droits impératifs des utilisateurs et des consommateurs, lorsqu’ils sont applicables, restent réservés. Ce texte n’exclut pas une responsabilité prévue par la loi et ne prévoit pas de clause de juridiction uniforme pour les consommateurs. Les engagements de service et modalités contractuelles d’une future commercialisation restent à établir avec les informations réelles de l’exploitant.",
      ],
      [
        "Évolution du service",
        "Avant commercialisation, distinguer les conditions du SaaS de celles de vente de pièces, et adapter les textes aux professionnels ou consommateurs concernés. Les règles applicables aux ventes à distance, à la médiation, aux garanties, à la rétractation et aux données ne peuvent être déduites de ce seul prototype.",
      ],
    ],
  },
} as const;
