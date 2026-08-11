# Blueprint Produit — Chapitre 7 : User Flows

**Objectif :** Détailler, étape par étape, les parcours utilisateurs critiques identifiés dans les personas (chapitre 3) et le sitemap (chapitre 5). Chaque flow précise le point d'entrée, les actions, les décisions, les états d'erreur et le point de sortie, afin de servir de référence directe pour la conception des écrans et l'implémentation.

## Conventions utilisées

- `↓` : étape suivante dans le parcours nominal
- `◇` : point de décision / branche
- `⚠` : état d'erreur ou cas limite à gérer
- `✓` : point de sortie / objectif atteint
- Chaque flow indique le **persona**, le **domaine fonctionnel** concerné (chapitre 4), et les **écrans** traversés (chapitre 5)

---

## Flow 1 — Freelance : de l'inscription au premier lead

**Persona :** Sarah Martin (Freelance) · **Domaines :** Identity & Profiles, Digital Business Cards, Sharing & Distribution, Lead Management

```
Landing Page
      ↓
Register (Email / Google / Magic Link)
      ↓
Onboarding — Étape 2 : Choix du profil → "Freelance"
      ↓
Onboarding — Étape 3 : Création du profil (nom, photo, bio)
      ↓
Onboarding — Étape 4 : Créer sa première carte
      ↓
Onboarding — Étape 5 : Choix d'un template (Corporate / Créatif / Minimal)
      ↓
Éditeur — Ajout des widgets (Portfolio, Calendly, LinkedIn)
      ↓
Onboarding — Étape 6 : Publication
      ↓
◇ Comment partager ?
      ├── QR Code → Génération + téléchargement PNG/SVG
      ├── Apple/Google Wallet → Ajout au wallet
      └── Lien direct → Copier / partager (WhatsApp, LinkedIn, email)
      ↓
Un prospect scanne le QR → Page Publique
      ↓
Le prospect télécharge la vCard ou remplit le formulaire de retour
      ↓
Nouveau Lead créé (Lead Management)
      ↓
Notification push/email à Sarah
      ↓
Sarah consulte le lead → programme un rendez-vous (Calendly)
      ↓
✓ Rendez-vous confirmé — Sarah consulte ses Analytics pour mesurer la performance de sa carte

⚠ Cas limites :
  - Sarah quitte l'onboarding avant publication → carte sauvegardée en brouillon, reprise possible depuis Dashboard
  - Template verrouillé indisponible en Free → upsell vers Pro à l'étape 5
```

---

## Flow 2 — Commercial terrain : capture en salon, sans friction

**Persona :** David (Commercial terrain) · **Domaines :** Sharing & Distribution, Lead Management, Integrations & Automation

```
David arrive au salon avec sa carte NFC physique
      ↓
◇ Comment le prospect interagit ?
      ├── Tap NFC → Page Publique (< 1 s)
      ├── Scan QR imprimé sur le badge → Page Publique
      └── David scanne la carte papier du prospect → OCR
              ↓
        Recadrage automatique
              ↓
        Reconnaissance des champs (nom, fonction, entreprise, tél, email)
              ↓
        ◇ Les champs sont-ils corrects ?
              ├── Oui → Validation directe
              └── Non → Correction manuelle des champs erronés
              ↓
        Contextualisation : ajout auto de l'horodatage + géolocalisation
              ↓
        David ajoute une note vocale ("Intéressé par l'offre Enterprise, relancer sous 48h")
              ↓
        David ajoute des tags (#salon2026 #chaud)
      ↓
Lead créé dans LinkCard
      ↓
Synchronisation automatique → HubSpot (bidirectionnelle)
      ↓
Workflow automatique déclenché : email de suivi programmé à J+1
      ↓
✓ Le lead apparaît dans le Pipeline (Nouveau → Contacté)

⚠ Cas limites :
  - Pas de réseau au salon → Mode hors-ligne : le lead est stocké localement, synchronisé dès reconnexion
  - OCR échoue sur une carte manuscrite/abîmée → basculement en saisie manuelle guidée
  - Doublon détecté (même email) → proposition de fusion avec le contact existant
```

---

## Flow 3 — Visiteur / Prospect : le parcours le plus critique

**Persona :** Persona 12 — le Visiteur (aucun compte, aucune app) · **Domaines :** Sharing & Distribution (Page Publique), Lead Management

```
Scan QR Code / Tap NFC / Clic sur lien (signature email, réseau social)
      ↓
Chargement de la Page Publique (objectif : < 1 seconde)
      ↓
Le visiteur consulte : photo, nom, fonction, entreprise, bio, liens
      ↓
◇ Que fait le visiteur ?
      ├── Télécharger le contact (.vcf) → Ajout direct au répertoire du téléphone
      ├── Appeler / Envoyer un email → Ouverture app native
      ├── Ouvrir LinkedIn / site web / portfolio
      ├── Télécharger une brochure PDF
      ├── Prendre rendez-vous → Redirection Calendly/Cal.com
      └── Remplir le formulaire de retour (nom, email, tél, message + consentement RGPD)
              ↓
        ◇ Consentement coché ?
              ├── Oui → Envoi des coordonnées
              └── Non → Bouton d'envoi désactivé, message explicatif affiché
              ↓
        Écran de confirmation "Merci"
              ↓
        Email de confirmation envoyé au visiteur
      ↓
✓ Aucune création de compte requise à aucun moment du parcours

⚠ Cas limites :
  - Carte désactivée/archivée par son propriétaire → page "Cette carte n'est plus disponible"
  - Visiteur hors-ligne au moment du scan → affichage des informations essentielles en cache (mode hors-ligne)
  - Navigateur ne supportant pas le téléchargement vCard natif → lien de secours "Ajouter manuellement"
```

---

## Flow 4 — Recruteur : traiter 200 candidats en un salon emploi

**Persona 10 — Recruteur** · **Domaines :** Lead Management (OCR, Notes, Tags), Analytics

```
Le recruteur scanne en continu les cartes/badges des candidats
      ↓
Pour chaque scan : OCR → correction rapide → tag automatique "#salonemploi2026"
      ↓
Ajout d'une note vocale de 10-15s par candidat (ressenti, poste visé)
      ↓
En fin de journée : le recruteur ouvre la liste des Leads
      ↓
Filtre par tag "#salonemploi2026"
      ↓
Recherche/tri par poste visé, disponibilité, note
      ↓
◇ Décision par candidat
      ├── Profil intéressant → Tag "#à recontacter" + export vers ATS
      └── Profil non retenu → Archivage
      ↓
Export CSV/Excel de la liste qualifiée
      ↓
✓ Suivi des candidats retenus dans le pipeline RH

⚠ Cas limites :
  - Volume élevé (200+ scans/jour) → traitement par lot, OCR en file d'attente asynchrone
  - Candidat sans carte physique → saisie manuelle rapide via formulaire simplifié
```

---

## Flow 5 — Responsable Commercial : piloter la performance de l'équipe

**Persona 3 — Responsable Commercial** · **Domaines :** Analytics & Intelligence, Enterprise Workspace

```
Connexion → Dashboard Équipe (et non Dashboard personnel)
      ↓
Vue d'ensemble : cartes partagées, leads générés, taux de conversion, ROI
      ↓
◇ Que veut analyser le Responsable ?
      ├── Classement des commerciaux → Analytics > Performance par membre
      ├── Évolution mensuelle → Graphique temporel
      ├── Canaux les plus performants → Analytics > Canaux (QR/NFC/Wallet/Email)
      └── Un commercial en particulier → Analytics > Détail membre
              ↓
        Vue détaillée : vues de carte, clics, leads, conversions du membre
      ↓
Identification d'un commercial sous-performant
      ↓
Message direct ou action corrective (coaching, réassignation de territoire)
      ↓
✓ Rapport exporté pour le point hebdomadaire avec la Direction

⚠ Cas limites :
  - Aucune donnée sur la période sélectionnée → état vide avec suggestion d'élargir la période
  - Accès refusé aux données d'un membre hors de son périmètre → contrôle RBAC
```

---

## Flow 6 — RH / IT : onboarding Enterprise automatisé (SSO/SCIM)

**Personas 5 & 6 — Responsable RH & Administrateur IT** · **Domaines :** Enterprise Workspace, Administration, Platform Services

```
Administrateur IT connecte l'annuaire d'entreprise
      ↓
◇ Fournisseur d'identité
      ├── Google Workspace
      ├── Microsoft Entra ID
      └── Okta
      ↓
Configuration du endpoint SCIM + activation du provisioning automatique
      ↓
Un nouvel employé est ajouté dans l'annuaire d'entreprise (événement externe)
      ↓
Provisioning automatique déclenché
      ↓
Compte LinkCard créé automatiquement pour l'employé
      ↓
Rôle assigné automatiquement selon le groupe annuaire (ex. "Sales" → rôle "Utilisateur")
      ↓
Template de marque appliqué automatiquement (branding verrouillé)
      ↓
Carte pré-remplie avec les informations de l'annuaire (nom, poste, téléphone, photo)
      ↓
Email de bienvenue envoyé à l'employé → première connexion
      ↓
✓ L'employé n'a qu'à vérifier/publier sa carte, sans configuration manuelle

◇ Flow inverse — départ d'un collaborateur
      ↓
Employé supprimé/désactivé dans l'annuaire
      ↓
Déprovisioning automatique déclenché
      ↓
Compte LinkCard désactivé, cartes physiques (NFC) invalidées
      ↓
✓ Aucune carte active ne reste en circulation après un départ

⚠ Cas limites :
  - Conflit d'email entre un compte existant et un compte provisionné → fusion manuelle requise par l'admin
  - Connexion SCIM interrompue → file d'attente des événements, reprise à la reconnexion, alerte à l'Admin IT
```

---

## Flow 7 — Marketing : déployer une nouvelle charte graphique à toute l'équipe

**Persona 4 — Responsable Marketing** · **Domaines :** Enterprise Workspace (Branding), Digital Business Cards

```
Responsable Marketing → Équipe & Admin > Charte graphique
      ↓
Upload du nouveau logo + définition couleurs primaire/secondaire
      ↓
◇ Verrouiller la mise en page pour tous les utilisateurs ?
      ├── Oui → Les membres ne peuvent plus modifier le design, seulement leurs informations
      └── Non → Le nouveau branding est proposé par défaut mais reste modifiable
      ↓
Aperçu de l'impact avant publication (combien de cartes seront affectées)
      ↓
Publication de la mise à jour de marque
      ↓
Propagation automatique à toutes les cartes actives de l'organisation
      ↓
Les Wallet Pass déjà installés se mettent à jour automatiquement (pas de réinstallation)
      ↓
✓ Toutes les cartes de l'entreprise reflètent la nouvelle identité en quelques minutes

⚠ Cas limites :
  - Un membre avait personnalisé sa carte avant le verrouillage → ses réglages sont archivés, pas supprimés (restauration possible si déverrouillage futur)
```

---

## Synthèse — Les 3 parcours structurants (rappel chapitre 5) enrichis

| Parcours | Déclencheur | Domaines traversés | Écrans clés | Objectif mesurable |
|---|---|---|---|---|
| B2C (Freelance) | Inscription | Identity, Cards, Sharing, Leads | Onboarding, Éditeur, Page publique | 1er lead en < 24h |
| B2B (Entreprise) | Création d'organisation | Enterprise Workspace, Cards, CRM | Équipe & Admin, Charte graphique, Intégrations | Déploiement < 1 semaine |
| Enterprise | Connexion SSO/SCIM | Enterprise Workspace, Administration, Platform Services | Provisioning, Audit, Conformité | Onboarding/offboarding 100 % automatisé |

## Principes transverses identifiés dans ces flows

1. **Le parcours du Visiteur (Flow 3) ne doit jamais être interrompu** par une demande de compte, d'app ou de connexion — c'est la contrainte la plus stricte de tout le produit.
2. **Chaque capture de lead (NFC, QR, OCR) doit fonctionner hors-ligne** puis se synchroniser — condition nécessaire pour les usages terrain (salons, événements).
3. **L'automatisation Enterprise (Flow 6) doit être bidirectionnelle** : provisioning ET déprovisioning, sans quoi le risque de sécurité (cartes actives d'anciens employés) reste ouvert.
4. **Les erreurs de reconnaissance (OCR) doivent toujours proposer une correction manuelle rapide**, jamais un blocage.

## Recommandation pour la suite

Ces flows couvrent les parcours prioritaires du MVP (B2C, terrain commercial, visiteur, Enterprise). Le chapitre suivant logique est le **Chapitre 8 : Spécifications fonctionnelles détaillées par écran** (states, validations, messages d'erreur) pour les écrans identifiés comme critiques ici — en particulier la Page Publique (Flow 3) et l'Éditeur de carte, qui concentrent le plus de branches et de cas limites.
