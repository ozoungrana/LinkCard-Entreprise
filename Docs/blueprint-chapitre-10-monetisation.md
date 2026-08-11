# Blueprint Produit — Chapitre 10 : Stratégie de Monétisation

**Objectif :** Détailler précisément ce que chaque plan inclut, où se situent les limites exactes, comment elles déclenchent une conversion sans créer de friction hostile, et comment la mécanique de facturation s'articule avec Stripe. Ce chapitre transforme les 4 plans nommés au chapitre 2 (Free/Pro/Business/Enterprise) en grille opérationnelle, prête à être implémentée dans `subscriptions`/`invoices` (chapitre 9).

## 1. Philosophie de pricing

Deux mouvements commerciaux coexistent, et l'un ne doit pas contaminer l'autre :

- **Product-Led Growth (PLG)** pour Free → Pro → Business : l'utilisateur découvre la valeur seul, sans commercial, et upgrade quand une limite le gêne réellement dans son usage.
- **Sales-Led** pour Enterprise : SSO/SCIM et les besoins de conformité impliquent systématiquement une conversation humaine (sécurité, contrat, DPA) — jamais un self-serve pur.

Principe directeur : **chaque limite doit correspondre à un vrai palier de valeur perçue**, jamais à une restriction arbitraire qui frustre sans raison. Un utilisateur qui atteint une limite doit comprendre *pourquoi* elle existe à ce niveau précis.

## 2. Grille tarifaire détaillée

### Free — 0 €/mois
Pour découvrir le produit et valider l'usage sur un cas simple.

| Dimension | Limite |
|---|---|
| Cartes | 1 carte active |
| Utilisateurs | 1 |
| Contacts capturés | 5 / mois (au-delà : capture bloquée, pas de compte, message explicite) |
| Partage | QR Code + lien direct uniquement |
| NFC / Wallet | ❌ Non inclus |
| Analytics | Vues et clics uniquement, rétention 7 jours |
| Templates | 3 modèles de base uniquement (le marketplace et les modèles premium sont verrouillés — cf. écran « Modèles verrouillés » déjà prototypé) |
| Signature email | ❌ |
| OCR | ❌ |
| Intégrations CRM | ❌ |
| Automatisations | ❌ |
| Marque LinkCard | Visible en bas de la page publique (« Propulsé par LinkCard ») |
| Support | Centre d'aide uniquement |

### Pro — 9 €/mois (ou 90 €/an, soit ~17% de réduction)
Pour un indépendant ou un professionnel qui utilise LinkCard comme outil principal de networking.

| Dimension | Limite |
|---|---|
| Cartes | Illimitées (multi-profils : Entreprise/Freelance/Conférence) |
| Utilisateurs | 1 |
| Contacts capturés | Illimités |
| Partage | QR + lien + **NFC + Apple/Google Wallet** |
| Analytics | Segmentation pays/appareil/navigateur, heatmap, rétention 90 jours |
| Templates | Tous les modèles gratuits du marketplace |
| Signature email | ✓ Générateur illimité |
| OCR | 50 scans / mois |
| Intégrations CRM | 1 connexion (HubSpot ou Pipedrive) |
| Automatisations | 1 workflow actif |
| Marque LinkCard | Retirable |
| Support | Email, réponse sous 48h |

### Business — 19 €/utilisateur/mois (minimum 3 sièges), ou 190 €/utilisateur/an
Pour une équipe qui veut une image de marque cohérente et un pipeline commercial mesurable.

| Dimension | Limite |
|---|---|
| Tout Pro, plus : | |
| Utilisateurs | 3 minimum, illimité au-delà (facturation au siège) |
| Équipe & rôles | RBAC complet (Admin d'équipe / Utilisateur / Lecteur) |
| Charte graphique | Verrouillable pour toute l'organisation |
| Intégrations CRM | Illimitées, synchronisation bidirectionnelle |
| Automatisations | Illimitées + Webhooks sortants |
| OCR | Illimité |
| Analytics | Export PDF, rétention 12 mois |
| Templates | Modèles premium du marketplace inclus |
| Support | Prioritaire, réponse sous 4h ouvrées |

### Enterprise — Sur devis
Pour les grandes organisations avec des exigences de sécurité et de conformité.

| Dimension | Détail |
|---|---|
| Tout Business, plus : | |
| SSO | Google Workspace, Microsoft Entra ID, Okta |
| SCIM | Provisioning/déprovisioning automatique |
| Audit | Journal complet, export, rétention illimitée |
| SLA | Garanti contractuellement (disponibilité, temps de réponse support) |
| Support | Account Manager dédié + support téléphonique |
| Facturation | Annuelle, sur facture (pas de carte bancaire) |
| Personnalisation | Environnement dédié en option, DPA/contrat sur-mesure |
| API | Rate limits élevés, accès prioritaire aux nouveaux endpoints |

## 3. Tableau comparatif synthétique

| | Free | Pro | Business | Enterprise |
|---|---|---|---|---|
| Prix | 0 € | 9 €/mois | 19 €/utilisateur/mois | Sur devis |
| Cartes | 1 | Illimitées | Illimitées | Illimitées |
| Contacts/mois | 5 | Illimités | Illimités | Illimités |
| NFC / Wallet | ❌ | ✓ | ✓ | ✓ |
| CRM | ❌ | 1 connexion | Illimité | Illimité |
| Automatisations | ❌ | 1 workflow | Illimitées | Illimitées |
| RBAC / Rôles | ❌ | ❌ | ✓ | ✓ |
| SSO / SCIM | ❌ | ❌ | ❌ | ✓ |
| Support | Aide | Email 48h | Prioritaire 4h | Dédié + SLA |

## 4. Mécanismes d'upsell (mappés aux écrans déjà prototypés)

Chaque limite doit se manifester **au moment précis où l'utilisateur en a besoin**, jamais en amont sous forme d'avertissement générique.

| Déclencheur | Écran concerné | Comportement |
|---|---|---|
| Créer une 2ᵉ carte en Free | Mes cartes | La tuile « Nouvelle carte » ouvre directement un écran d'upgrade avec le bénéfice concret (« Passe à Pro pour créer des cartes illimitées ») plutôt qu'un simple message d'erreur |
| 6ᵉ contact du mois en Free | Formulaire de retour (Page Publique) | Le contact n'est **jamais perdu** pour le visiteur — le formulaire fonctionne toujours côté visiteur, mais le propriétaire reçoit un email « Tu as atteint ta limite mensuelle, upgrade pour le récupérer dans ton tableau de bord » : on ne punit jamais le prospect pour la limite du propriétaire |
| Sélection d'un modèle premium (marketplace) | Marketplace de thèmes | Badge « Premium » visible avant le clic (déjà dans le prototype), pas de surprise après sélection |
| Tentative de connexion NFC/Wallet en Free | Diffusion | Sections visibles mais grisées avec un bandeau clair, pas masquées — montrer la valeur plutôt que la cacher |
| Ajout d'un 2ᵉ workflow en Pro | Automatisations | Le bouton « Nouveau workflow » reste actif, un message contextuel apparaît à la sauvegarde du 2ᵉ workflow |
| Invitation d'un 4ᵉ membre en dessous du minimum Business | Équipe & Admin | Le parcours d'invitation calcule le prorata et l'affiche avant confirmation, jamais de facturation surprise |
| Tentative de connexion SSO en Business | Compte > Sécurité | Redirige vers une prise de contact commerciale plutôt qu'un mur bloquant — c'est une conversation humaine, pas un paywall automatique |

Principe transverse : **aucune fonctionnalité déjà utilisée ne doit jamais disparaître brutalement** en cas de non-renouvellement — les cartes déjà publiées restent visibles (lecture seule) même si le compte repasse en Free, seule la création de nouvelles cartes est bloquée. Une page publique qui disparaît soudainement casse la confiance et nuit à l'image de marque du client, donc à LinkCard par ricochet.

## 5. Add-ons (consommation à la carte)

Pour les besoins ponctuels sans changer de plan :

| Add-on | Prix | Disponible sur |
|---|---|---|
| Siège supplémentaire | 19 €/mois | Business |
| Pack cartes NFC physiques (25 unités) | 149 € (matériel + activation) | Pro, Business, Enterprise |
| Crédits OCR additionnels (100 scans) | 5 € | Pro |
| Connexion CRM additionnelle | 15 €/mois | Pro |

## 6. Cycle de facturation

- **Mensuel ou annuel** (Free excepté) — l'annuel offre systématiquement une réduction équivalente à ~2 mois offerts, mécanisme Stripe Billing standard (`price` avec `recurring.interval`).
- **Essai gratuit 14 jours** sur Pro et Business, carte bancaire requise dès le départ pour Business (réduit le taux de désabonnement post-essai côté PLG classique), mais **pas requise** pour l'essai Pro — cohérent avec la friction minimale attendue par le Persona Freelance.
- **Proration automatique** via Stripe pour tout changement de plan ou ajout de siège en cours de cycle.
- **Downgrade** : jamais immédiat — prend effet à la fin de la période déjà payée, pour éviter qu'un utilisateur perde l'accès à une fonctionnalité qu'il a déjà payée ce mois-ci.

## 7. Métriques à instrumenter dès le lancement

Reprises et précisées depuis les KPIs du chapitre 1 :

| Métrique | Définition | Fréquence de suivi |
|---|---|---|
| MRR / ARR | Revenu récurrent mensuel/annuel | Quotidien |
| ARPU | Revenu moyen par organisation payante | Mensuel |
| Taux de conversion Free → Payant | % d'organisations Free qui upgradent sous 90 jours | Hebdomadaire |
| Churn (logo) | % d'organisations payantes perdues | Mensuel |
| Net Revenue Retention (NRR) | Expansion (sièges, upsell) moins churn, en % du MRR de départ | Mensuel — cible > 100% dès l'an 2 |
| LTV:CAC | Valeur vie client vs coût d'acquisition | Trimestriel |
| Temps jusqu'au 1ᵉʳ lead capturé | Depuis l'inscription — proxy direct de l'activation produit | Par cohorte hebdomadaire |

Le dernier indicateur (temps jusqu'au 1ᵉʳ lead) est probablement le plus prédictif de la conversion Free → Pro : un utilisateur qui reçoit un contact dans les 48h suivant son inscription convertit nettement mieux qu'un utilisateur qui crée une carte et ne la partage jamais — c'est un signal à instrumenter en priorité dans `analytics_events`.

## 8. Garde-fous à ne pas franchir

- Ne jamais rendre le plan Free inutilisable au point de ne plus démontrer la valeur du produit — l'objectif du Free est la conversion, pas la frustration.
- Ne jamais verrouiller les données du client derrière un mur de paiement — export CSV/vCard toujours disponible, quel que soit le plan (cohérent avec le droit à la portabilité RGPD déjà mentionné au chapitre 8).
- Ne jamais facturer un dépassement de limite sans consentement explicite préalable (pas de « facturation surprise » à la fin du mois).

## Conclusion

Cette grille traduit le positionnement du chapitre 2 (« simplicité + puissance Enterprise ») en mécanique commerciale concrète : la friction augmente progressivement avec la taille et les besoins de l'organisation, jamais de façon arbitraire. Chaque limite renvoie à un écran déjà existant dans le prototype, ce qui permet de câbler la logique de facturation directement sur l'UI déjà validée plutôt que de la concevoir dans l'abstrait.

## Recommandation pour la suite

Il reste un chapitre naturel à ouvrir : l'**API publique** (endpoints, authentification par clé API, rate limiting par plan — les limites définies ici s'y appliqueront directement). C'est aussi le bon moment, si tu préfères, de retourner au développement : le modèle de données (chapitre 9) et cette grille tarifaire suffisent à câbler Stripe et les policies RLS liées au plan (`organizations.plan`) dans Claude Code.
