# Blueprint Produit — Chapitre 8 : Spécifications Fonctionnelles Détaillées par Écran

**Objectif :** Documenter précisément, pour les écrans les plus critiques identifiés au chapitre 7, l'ensemble des états (states), règles de validation et messages d'erreur. Ce niveau de détail est le pont direct entre le design et l'implémentation : chaque state décrit ici doit avoir un équivalent visuel dans le Design System (chapitre 6).

## Méthodologie

Pour chaque écran, la spécification suit une structure fixe :

1. **États de l'écran** — tous les states possibles (chargement, vide, erreur, succès...)
2. **Champs & validations** — règles précises, format attendu, limites
3. **Messages** — texte exact affiché à l'utilisateur pour chaque erreur/succès
4. **Comportements** — logique métier non triviale (autosave, debounce, retry...)
5. **Accessibilité** — points spécifiques à l'écran (au-delà des règles générales du ch.6)

Priorité donnée aux deux écrans identifiés au chapitre 7 comme concentrant le plus de branches : la **Page Publique** et l'**Éditeur de carte**. Trois écrans additionnels à fort enjeu métier sont ensuite couverts : le **Scanner OCR**, le **Formulaire de capture de lead**, et le **Provisioning SSO/SCIM**.

---

## 1. Page Publique

C'est l'écran le plus visité du produit et le seul qui s'adresse à des personnes sans compte (Persona 12, chapitre 3). Aucune friction n'est tolérée.

### 1.1 États de l'écran

| État | Déclencheur | Comportement affiché |
|---|---|---|
| **Chargement** | Ouverture du lien/QR/NFC | Skeleton (silhouette avatar + lignes de texte), objectif < 1 s |
| **Chargée — en ligne** | Carte trouvée et active | Affichage complet : photo, infos, CTA, liens |
| **Chargée — hors-ligne** | Pas de réseau, contenu en cache disponible | Bandeau discret « Mode hors-ligne — certaines actions sont indisponibles » ; QR code et coordonnées de base restent visibles ; CTA de sync/CRM masqués |
| **Carte désactivée** | Le propriétaire a archivé/désactivé la carte | Écran dédié : « Cette carte n'est plus disponible » + logo LinkCard, aucun contenu personnel affiché |
| **Carte introuvable (404)** | Lien invalide ou expiré | « Cette page n'existe pas ou plus » + lien vers linkcard.app |
| **Formulaire envoyé** | Le visiteur a soumis le formulaire de retour | État de confirmation (voir 4.4) |
| **Erreur serveur** | Panne backend | « Un problème est survenu. Réessayer » + bouton Réessayer, jamais d'écran blanc |

### 1.2 Règles d'affichage conditionnelles

- Un bouton d'action (Appeler / Email / Site / Itinéraire) n'est rendu **que si** le champ correspondant est renseigné — pas de bouton grisé inutile.
- Le bloc vidéo de présentation ne charge l'iframe qu'au clic (lazy load) pour ne pas pénaliser le temps de chargement initial.
- Le QR code affiché sur la carte elle-même n'est visible que si l'option « QR sur page publique » est activée par le propriétaire (certains préfèrent ne diffuser leur QR que hors-ligne, sur la carte physique).

### 1.3 Comportement du téléchargement vCard

- Génération du fichier `.vcf` à la volée, incluant tous les champs renseignés.
- Sur iOS Safari / Android Chrome : déclenchement natif de l'ajout aux contacts.
- **Cas limite :** navigateurs in-app (Instagram, LinkedIn) bloquant parfois le téléchargement → un message contextuel s'affiche : « Ouvre ce lien dans ton navigateur pour enregistrer le contact » avec bouton « Ouvrir dans le navigateur ».

### 1.4 Accessibilité spécifique

- Les CTA (Appeler, Email...) doivent avoir un intitulé explicite pour lecteur d'écran (`aria-label="Appeler Alex Martin"`, pas juste « Appeler »).
- Contraste renforcé sur les boutons d'action, quels que soient les couleurs de marque appliquées par l'entreprise (garde-fou automatique si la couleur choisie ne passe pas le ratio 4.5:1 — voir 4.2 de l'Éditeur).

---

## 2. Éditeur de carte (WYSIWYG)

L'écran le plus complexe du produit (chapitre 5, section V). Il doit rester fluide malgré un nombre élevé de champs et de dépendances.

### 2.1 États de l'écran

| État | Déclencheur | Comportement |
|---|---|---|
| **Chargement initial** | Ouverture de l'éditeur | Skeleton du canvas + panneaux latéraux |
| **Édition — brouillon** | Modification d'un champ | Indicateur discret « Modifications non enregistrées » |
| **Sauvegarde automatique** | 2 s après la dernière frappe (debounce) | Icône de sauvegarde qui pulse brièvement |
| **Enregistré** | Sauvegarde réussie | Icône ✓ + horodatage « Enregistré à 14:32 » |
| **Erreur de sauvegarde** | Échec réseau/serveur | Bandeau rouge persistant « Échec de l'enregistrement — nouvelle tentative dans 5 s », retry automatique 3 fois puis bouton manuel |
| **Champ invalide** | Validation échouée (voir 2.2) | Bordure rouge sur le champ + message inline, sauvegarde du champ bloquée mais reste local |
| **Mise en page verrouillée (Entreprise)** | Charte graphique verrouillée par l'admin (ch.4 domaine 7) | Panneau « Style » grisé avec cadenas + tooltip « Verrouillé par ton administrateur » |
| **Corbeille** | Carte supprimée | Récupérable pendant 30 jours, au-delà suppression définitive |

### 2.2 Champs & validations

| Champ | Règle | Message d'erreur |
|---|---|---|
| Nom complet | Obligatoire, 2–60 caractères | « Le nom doit contenir entre 2 et 60 caractères » |
| Fonction | Optionnel, max 80 caractères | — |
| Téléphone | Format international requis (regex E.164) | « Format attendu : +33 6 12 34 56 78 » |
| Email | Format email valide | « Adresse email invalide » |
| Site web / LinkedIn / Calendly | URL valide (http/https), auto-préfixage si oublié | « Le lien doit commencer par https:// » |
| Logo / Photo | JPG/PNG/SVG, 5 Mo max, ratio recommandé affiché | « Fichier trop volumineux (max 5 Mo) » |
| Vidéo (lien) | URL YouTube/Loom reconnue uniquement | « Seuls les liens YouTube et Loom sont acceptés » |
| Couleur personnalisée | Contraste vérifié automatiquement contre le blanc/fond | « Ce contraste est trop faible pour rester lisible — couleur suggérée : [aperçu] » (avertissement non bloquant) |
| Nom de la carte (interne) | Obligatoire, unique par utilisateur | « Tu as déjà une carte nommée ainsi » |

### 2.3 Comportements non triviaux

- **Autosave avec debounce** : aucune sauvegarde à chaque frappe : attente de 2 s d'inactivité avant écriture, pour éviter de saturer l'API tout en ne perdant jamais de contenu (sécurité : sauvegarde forcée aussi au `blur` du champ et à la fermeture d'onglet via `beforeunload`).
- **Historique des versions** : chaque sauvegarde significative (pas chaque debounce) crée un point de restauration ; affichage d'un diff simplifié (« Couleur changée », « Logo modifié ») plutôt qu'un diff technique.
- **Prévisualisation en temps réel** : toute modification se reflète dans l'aperçu téléphone sans délai perceptible (< 100 ms), y compris changement de couleur/police/disposition.
- **Duplication** : la carte dupliquée est automatiquement suffixée « (copie) » et passe en état brouillon, jamais publiée automatiquement.

### 2.4 Accessibilité spécifique

- Navigation clavier complète entre les onglets du panneau gauche (Infos / Liens / Média) sans piège de focus.
- Les swatches de couleur ont un `aria-label` avec le nom de la couleur, pas seulement un carré visuel.

---

## 3. Scanner OCR

Le point d'entrée du Lead Management terrain (Personas 2 et 10, chapitre 3).

### 3.1 États de l'écran

| État | Déclencheur | Comportement |
|---|---|---|
| **Idle** | Écran ouvert, en attente | Cadre de cadrage affiché avec ligne de scan animée |
| **Capture** | Photo prise / image importée | Aperçu figé, bouton « Recommencer » disponible |
| **Traitement** | OCR en cours | Indicateur de progression, pas de blocage de l'UI (traitement asynchrone) |
| **Résultat — confiance haute** | Reconnaissance fiable (score > seuil) | Champs pré-remplis, prêts à valider directement |
| **Résultat — confiance faible** | Score en dessous du seuil sur un ou plusieurs champs | Champ(s) concerné(s) surligné(s) en orange avec « À vérifier » |
| **Échec total** | Aucun texte reconnu | « Impossible de lire cette carte. Réessaie avec un meilleur éclairage ou saisis les informations manuellement » + bouton saisie manuelle |
| **Doublon détecté** | Email/téléphone déjà présent dans les contacts | « Ce contact existe déjà — [Voir la fiche] [Créer quand même] » |

### 3.2 Règles de validation

- Les champs extraits restent **entièrement éditables** avant validation finale — jamais de création automatique sans confirmation humaine.
- Email et téléphone sont revalidés avec les mêmes règles que l'éditeur de carte (2.2) même s'ils proviennent de l'OCR.
- Le score de confiance n'est jamais affiché en pourcentage brut à l'utilisateur (trop technique) — traduit en simple surlignage « à vérifier » ou non.

### 3.3 Comportement hors-ligne (rappel Flow 2, chapitre 7)

- Capture et OCR fonctionnent hors-ligne (traitement local si le modèle le permet, sinon mise en file d'attente).
- Le contact est stocké localement avec un badge « En attente de synchronisation » jusqu'au retour réseau.

---

## 4. Formulaire de capture de lead (retour prospect)

Présent sur la Page Publique — c'est la conversion la plus importante du produit (Flow 3, chapitre 7).

### 4.1 Champs & validations

| Champ | Règle | Message d'erreur |
|---|---|---|
| Nom | Obligatoire, 2–60 caractères | « Merci d'indiquer ton nom » |
| Email | Obligatoire, format valide | « Adresse email invalide » |
| Téléphone | Optionnel, format libre validé si rempli | « Numéro invalide » |
| Message | Optionnel, max 500 caractères | « 500 caractères maximum » |
| Consentement RGPD | Obligatoire (case à cocher, jamais pré-cochée) | Bouton d'envoi désactivé tant que non cochée — pas de message d'erreur nécessaire, l'état désactivé est explicite |

### 4.2 États du formulaire

| État | Comportement |
|---|---|
| Vide | Bouton d'envoi désactivé (grisé) |
| Rempli et valide | Bouton actif |
| Envoi en cours | Bouton en état loading (spinner), désactivé pour éviter double-soumission |
| Envoyé avec succès | Formulaire remplacé par écran de confirmation (voir 4.4) |
| Erreur réseau à l'envoi | Formulaire conservé avec les données saisies (rien n'est perdu), bandeau « Échec de l'envoi, réessaie » |

### 4.3 Anti-abus

- Limitation de fréquence : un même appareil ne peut soumettre le formulaire plus de 3 fois en 10 minutes sur une même carte (anti-spam), sans CAPTCHA visible sauf déclenchement de la limite (CAPTCHA affiché uniquement en cas de comportement suspect, pour ne pas ajouter de friction au parcours normal).

### 4.4 Message de confirmation

> **« Merci ! »**
> Tes coordonnées ont bien été transmises à [Nom]. Tu recevras une confirmation par email.

Un email de confirmation est envoyé immédiatement au visiteur (accusé de réception), distinct de la notification envoyée au propriétaire de la carte.

---

## 5. Provisioning SSO/SCIM (Admin IT)

Écran interne, réservé à l'Administrateur IT (Persona 6). Peu de trafic mais criticité de sécurité maximale.

### 5.1 États de l'écran

| État | Déclencheur | Comportement |
|---|---|---|
| **Non connecté** | Aucun fournisseur configuré | Cartes des 3 fournisseurs avec bouton « Connecter » |
| **Connexion en cours** | OAuth en cours avec le fournisseur | Redirection externe puis retour, indicateur de progression |
| **Connecté** | Provisioning actif | Statut vert, dernière synchronisation affichée |
| **Erreur d'authentification** | Échec OAuth | « La connexion à [Fournisseur] a échoué. Vérifie les permissions accordées » |
| **Conflit de compte** | Email provisionné correspond à un compte déjà existant | Écran de résolution : « Un compte existe déjà pour cette adresse — [Fusionner] [Ignorer] » — aucune fusion automatique silencieuse |
| **File d'attente en retard** | Connexion SCIM interrompue puis rétablie | Bandeau « Synchronisation en cours de rattrapage — X événements en attente » |

### 5.2 Règles de sécurité non négociables

- Le déprovisioning automatique a **priorité absolue** sur toute autre opération en file d'attente (un événement de suppression ne doit jamais être retardé par des créations en attente).
- Toute action de provisioning/déprovisioning est journalisée dans l'Audit (domaine 11, chapitre 4) avec horodatage, événement source, et résultat — non modifiable a posteriori.
- Le endpoint SCIM affiché est en lecture seule dans l'UI ; sa régénération invalide l'ancien endpoint immédiatement (pas de période de recouvrement, pour éviter tout accès résiduel).

---

## 6. Patterns d'état réutilisables (référence transverse)

Ces patterns, une fois définis, s'appliquent identiquement à tous les écrans du produit — ils ne sont pas répétés dans chaque fiche mais doivent être respectés partout :

| Pattern | Règle générale |
|---|---|
| **Skeleton de chargement** | Toujours utilisé plutôt qu'un spinner plein écran dès qu'un contenu structuré est attendu (listes, cartes, tableaux) |
| **État vide** | Toujours accompagné d'une action possible (jamais un simple « Aucune donnée »), ex. « Aucun contact pour l'instant — [Scanner ma première carte] » |
| **État d'erreur réseau** | Jamais d'écran blanc ; toujours un message + une action de retry |
| **Confirmation destructive** | Toute suppression définitive (carte, compte, membre) passe par une modale de confirmation nommant explicitement l'élément concerné, jamais un simple « Es-tu sûr ? » générique |
| **Toast de succès** | Discret, auto-disparition après 3 s, jamais bloquant |
| **Double-soumission** | Tout bouton déclenchant une action serveur se désactive immédiatement au clic jusqu'à la réponse |

## Conclusion

Ce chapitre traduit les parcours du chapitre 7 en règles d'implémentation vérifiables : chaque état listé ici doit correspondre à un composant du Design System (chapitre 6) et chaque message d'erreur doit être repris textuellement, sans reformulation, au moment du développement.

## Recommandation pour la suite

Deux directions restent ouvertes pour la suite du blueprint :

1. **Chapitre 9 — Modèle de données** : formaliser les entités (Utilisateur, Organisation, Carte, Contact/Lead, Rôle) et leurs relations, nécessaire avant toute implémentation technique réelle.
2. **Chapitre 9 (alternatif) — Stratégie de monétisation** : détailler les limites précises par plan (Free/Pro/Business/Enterprise) au-delà du nom déjà posé au chapitre 2, avec les mécanismes d'upsell identifiés dans ce chapitre (ex. template verrouillé en Free).

Le modèle de données est la dépendance technique la plus urgente si l'objectif est de passer à l'implémentation ; la stratégie de monétisation est prioritaire si l'objectif est de valider le business model avant de coder.
