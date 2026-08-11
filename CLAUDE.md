# LinkCard Enterprise — Contexte projet pour Claude Code

Ce fichier est lu automatiquement par Claude Code au début de chaque session. Il synthétise le Blueprint Produit (8 chapitres) et le prototype HTML déjà validés, pour que le code généré reste cohérent avec les décisions déjà prises — sans avoir à tout réexpliquer à chaque session.

Documents de référence complets (à lire à la demande, pas à chaque session) :
- `docs/blueprint-chapitre-7-user-flows.md` — parcours utilisateurs détaillés avec cas limites
- `docs/blueprint-chapitre-8-specifications-ecrans.md` — états, validations, messages d'erreur exacts
- `docs/blueprint-chapitre-9-modele-donnees.md` — schéma complet, RLS, ordre des migrations Supabase
- `docs/blueprint-chapitre-10-monetisation.md` — grille tarifaire précise par plan, mécanismes d'upsell, métriques SaaS
- `reference/linkcard-prototype.html` — prototype HTML interactif (16+ écrans/flows), à ouvrir dans un navigateur pour voir le comportement attendu avant d'implémenter un écran

---

## 1. Vision produit (résumé)

LinkCard Enterprise n'est pas une carte de visite numérique — c'est une **plateforme de Digital Business Identity** : identité professionnelle, capture de leads, CRM, analytics et automatisation, dans un seul produit.

Trois segments cibles, chacun avec des besoins distincts :
- **B2C** : indépendants — simplicité, rapidité, portfolio, prise de rendez-vous
- **B2B** : PME/ETI — équipes, branding centralisé, intégrations CRM
- **Enterprise** : grands comptes — SSO/SCIM, RBAC, audit, conformité

Différenciateurs clés (à ne jamais sacrifier en cours de dev) :
1. **Éditeur WYSIWYG** — le plus puissant du marché, inspiré de Canva. Aucun concurrent (HiHello, Blinq, Popl) n'en a un vrai.
2. **Analytics avancées** — au-delà de vues/clics : heatmap, funnels, segmentation pays/appareil/canal.
3. **Approche Offline-to-Online** — QR, NFC, Wallet, OCR combinés, avec un vrai mode hors-ligne.
4. **Architecture Enterprise dès le départ** — RBAC, SSO, SCIM, audit ne sont pas des ajouts tardifs.
5. **IA intégrée** — scoring de leads, résumé de rencontre, transcription de notes vocales, suggestions de relance (pas encore dans le MVP, mais l'architecture doit pouvoir les accueillir).

Contrainte non négociable : le parcours du **Visiteur** (personne qui consulte une carte publique) ne doit **jamais** exiger de compte ni d'application. Zéro friction, chargement < 1s.

---

## 2. Stack technique cible

### Cœur
| Domaine | Techno | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router, Server Actions) | SSR pour la Page Publique (SEO + perf < 1s) |
| Langage | **TypeScript** | Strict mode activé dès le départ |
| Base de données | **Supabase (Postgres)** | RLS (Row Level Security) pour l'isolation multi-tenant par organisation |
| Auth | **Supabase Auth** | Email/password, Magic Link, OAuth (Google, Microsoft, Apple) — voir §5 pour les limites SSO Enterprise |
| Hébergement | **Vercel** | Edge Functions pour la Page Publique (latence mondiale) |
| Storage fichiers | **Supabase Storage** | Logos, photos, vidéos de présentation, brochures PDF |

### UI & Design System (aligné chapitre 6 du blueprint)
| Domaine | Techno |
|---|---|
| Styling | **Tailwind CSS v4** |
| Composants | **shadcn/ui** (Radix primitives) |
| Icônes | **Lucide Icons** (primaire), Heroicons (secondaire) |
| Animations | **Framer Motion** — micro-interactions uniquement, jamais décoratif (voir tokens de motion §4) |
| Thème | **next-themes** — mode sombre déjà prototypé, tokens prêts |
| Graphiques | **Recharts** ou **Tremor** — pour Analytics (funnels, area charts, donuts déjà maquettés) |
| QR Code | **qrcode** ou **qrcode.react** — génération dynamique avec logo au centre |

### Formulaires & validation
| Domaine | Techno |
|---|---|
| Formulaires | **React Hook Form** |
| Validation | **Zod** — les règles exactes sont dans `blueprint-chapitre-8` (regex téléphone, email, longueurs de champs, etc.) |
| Data fetching | **TanStack Query** — cache, retry automatique (aligné avec les états de sauvegarde/erreur déjà spécifiés) |

### Fonctionnalités spécifiques (ajouts non demandés explicitement, mais nécessaires)
| Besoin | Techno recommandée | Pourquoi |
|---|---|---|
| Paiements & abonnements | **Stripe** (Checkout + Billing) | Cité explicitement au chapitre 4 (Domaine 8) ; gère les 4 plans (Free/Pro/Business/Enterprise) et le prorata |
| Emails transactionnels | **Resend** + **React Email** | Nécessaire pour vérification d'email, mot de passe oublié, signatures — permet de garder l'éditeur de templates email (déjà prototypé) piloté par du JSX versionnable |
| SSO Enterprise (SAML) & SCIM | **WorkOS** | Supabase Auth ne couvre pas SAML/SCIM nativement à ce niveau ; WorkOS s'intègre proprement à côté de Supabase Auth pour Google Workspace / Microsoft Entra ID / Okta sans tout réécrire |
| OCR (scan de cartes papier) | **Claude API (vision)** | Plus flexible qu'un OCR classique : extraction structurée directement en JSON (nom, fonction, entreprise...), cohérent avec la stack Anthropic déjà utilisée pour le dev |
| IA (scoring, résumé, relances) | **Claude API** | Même raisonnement — un seul fournisseur IA à gérer plutôt que d'ajouter un service tiers |
| Automatisations (workflows) | **Inngest** ou **Trigger.dev** | Pour exécuter les workflows (Lead capturé → Action → Action) de façon fiable et observable, avec retry — correspond à l'écran "Historique des exécutions" déjà maquetté |
| Notifications | **Novu** (ou système maison via Supabase Realtime) | Centre de notifications in-app déjà prototypé ; Novu gère aussi email/push/SMS depuis un seul endroit |
| Recherche | **Postgres full-text search** (via Supabase) au départ ; **Algolia/Typesense** si le volume l'exige plus tard | Pas besoin d'over-engineer dès le MVP |
| Tests | **Vitest** (unitaires) + **Playwright** (e2e) | Les specs du chapitre 8 (states, validations) sont directement transposables en cas de test |

### Pourquoi ces choix collent au blueprint
- Le chapitre 6 imposait déjà Next.js + Tailwind + shadcn/ui + Framer Motion : rien à changer.
- Le chapitre 4 imposait une approche **API First** : Server Actions Next.js + routes API exposées permettent ça nativement.
- Le chapitre 4 imposait Stripe explicitement pour la facturation.
- Supabase RLS est le moyen le plus direct d'implémenter le RBAC (Super Admin / Admin d'équipe / Utilisateur / Lecteur) et l'isolation entre organisations sans construire une couche d'autorisation maison.

---

## 3. Modèle de données (à valider/affiner avant le premier `supabase migration`)

> Schéma complet avec types exacts, RLS policies et ordre des migrations : voir `docs/blueprint-chapitre-9-modele-donnees.md`. Résumé ci-dessous pour référence rapide.

Entités déduites du blueprint et du prototype :

```
organizations
  id, name, plan (free|pro|business|enterprise), logo_url,
  brand_primary_color, brand_secondary_color, layout_locked (bool),
  scim_endpoint, sso_provider (google|entra|okta|null), created_at

users
  id, organization_id (nullable pour les indépendants), email, name,
  role (super_admin|org_admin|user|reader), avatar_url, created_at

profiles  -- "cartes" au sens produit (un user peut en avoir plusieurs)
  id, user_id, name, type (entreprise|freelance|conference|custom),
  full_name, job_title, company, phone, email, address,
  website_url, linkedin_url, calendly_url, portfolio_url,
  brand_primary_color, brand_secondary_color, font, template,
  avatar_url, cover_video_url, audio_intro_url,
  status (draft|published|archived), widget_order (jsonb),
  created_at, updated_at

profile_versions  -- historique des versions (chapitre 8 §2.3)
  id, profile_id, snapshot (jsonb), change_summary, created_at

leads  -- "contacts" capturés
  id, organization_id, captured_by_user_id, profile_id,
  name, company, email, phone, channel (qr|nfc|email|lien|ocr),
  stage (nouveau|contacte|qualifie|proposition|client|perdu),
  tags (text[]), notes (text), voice_note_url,
  meeting_location, meeting_at, consent_given (bool), created_at

workflows
  id, organization_id, name, trigger_type, is_active (bool), created_at

workflow_steps
  id, workflow_id, position, action_type (create_crm_contact|send_email|notify|...), config (jsonb)

workflow_executions
  id, workflow_id, triggered_by, status (success|failed), duration_ms, created_at

email_templates
  id, organization_id, name, subject, body, variables (text[]), created_at

crm_connections
  id, organization_id, provider (hubspot|salesforce|pipedrive|zoho), status, credentials (encrypted), created_at

analytics_events
  id, profile_id, event_type (view|click|download|save_contact), channel, country, device, browser, created_at
```

Points d'attention :
- **RLS Supabase** : chaque table avec `organization_id` doit avoir une policy qui filtre par l'organisation de l'utilisateur connecté, sauf pour `profiles` en lecture publique (Page Publique = accessible sans auth).
- `profile_versions` : ne pas versionner à chaque frappe (debounce déjà spécifié au chapitre 8 — 2s), seulement aux sauvegardes commitées.
- `analytics_events` : volume potentiellement élevé → partitionner par mois dès que le produit a du trafic réel.

---

## 4. Design tokens (chapitre 6 — à reproduire exactement dans `tailwind.config`)

```
Couleurs
  primary: #2563EB       primary-hover: #1D4ED8      primary-light: #DBEAFE
  secondary: #7C3AED     secondary-light: #EDE9FE
  accent: #06B6D4
  success: #22C55E       warning: #F59E0B    danger: #EF4444    info: #3B82F6
  gray-50 → gray-900 : échelle Tailwind standard
  dark mode: bg #0F172A, surface #1E293B, text #F8FAFC

Typographie
  Inter (texte courant) / Manrope (titres, display) / JetBrains Mono (data, labels, badges)
  Échelle : Display XL 64 / Display 48 / H1 40 / H2 32 / H3 28 / H4 24 / H5 20 / H6 18 / Body 16 / Small 14 / Caption 12

Spacing : grille 8px — 4,8,12,16,24,32,40,48,64,80,96,128
Radius  : xs 4 / sm 8 / md 12 / lg 16 / xl 20 / 2xl 24 / full 9999
```

Principes UX à respecter dans chaque composant généré : Mobile First, animations 150-350ms max et jamais décoratives, WCAG 2.2 AA (contraste 4.5:1 minimum — le prototype a déjà un vérificateur de contraste sur les couleurs personnalisées, à reproduire), `prefers-reduced-motion` respecté.

---

## 5. Parcours prioritaires (résumé du chapitre 7 — voir le fichier complet pour le détail et les cas limites)

Ordre de priorité pour le MVP :

1. **Parcours Visiteur** (Page Publique) — LE plus critique. Zéro compte, zéro app, < 1s de chargement, vCard téléchargeable, formulaire de retour RGPD-compliant.
2. **Parcours B2C** — Auth → Onboarding (6 étapes déjà maquettées) → Éditeur → Publication → Partage.
3. **Parcours terrain (commercial/recruteur)** — NFC/QR/OCR → capture de lead → doit fonctionner **hors-ligne** puis se synchroniser.
4. **Parcours Enterprise** — SSO/SCIM → provisioning automatique → déprovisioning automatique (priorité absolue en cas de conflit de queue, voir chapitre 8 §5.2 — sécurité).

## 6. États & validations obligatoires (résumé chapitre 8)

Ne pas réinventer ces règles, elles sont déjà spécifiées précisément :
- Chaque écran a des états explicites : chargement (skeleton, jamais un spinner plein écran), vide (toujours avec une action), erreur réseau (jamais un écran blanc, toujours un retry), succès (toast auto-disparition 3s).
- Éditeur : autosave avec debounce 2s, retry automatique 3x en cas d'échec réseau puis bouton manuel.
- Formulaires : validation au blur + à la soumission, jamais de blocage silencieux (toujours un message explicite).
- Suppression destructive : toujours une confirmation nommant explicitement l'élément concerné (jamais un « Es-tu sûr ? » générique).

---

## 7. Conventions de code

- **App Router** exclusivement, Server Components par défaut, Client Components seulement quand nécessaire (interactivité, hooks).
- **Server Actions** pour toutes les mutations (création de carte, capture de lead, etc.) plutôt que des routes API classiques, sauf pour les webhooks entrants (Stripe, CRM, SCIM) qui nécessitent des routes API.
- Structure de dossiers suggérée :
  ```
  app/
    (marketing)/           # Landing, tarifs, blog, aide — layout public
    (auth)/                 # Login, register, MFA...
    (app)/                  # Dashboard et tout l'espace connecté, layout avec sidebar
      cards/
      editor/[cardId]/
      contacts/
      analytics/
      automations/
      admin/
      account/
    c/[slug]/                # Page Publique (route courte, publique, SSR)
    admin-saas/              # Super Admin, accès restreint séparément
  components/
    ui/                      # shadcn/ui
    features/                # composants métier groupés par domaine
  lib/
    supabase/
    validations/             # schémas Zod (chapitre 8)
    ai/                      # appels Claude API (OCR, scoring, résumés)
  ```
- Toujours vérifier `reference/linkcard-prototype.html` pour le comportement exact d'un écran (états, micro-interactions) avant de l'implémenter — le prototype fait foi sur l'UX, pas sur le code.
- Ne pas ajouter de fonctionnalité hors-scope sans la rattacher explicitement à un persona du chapitre 3 ou un domaine du chapitre 4 (principe déjà énoncé dans le blueprint : éviter le développement sans valeur métier identifiée).

---

## 8. Ce qui n'est volontairement pas encore tranché

- Choix définitif entre Recharts et Tremor pour les graphiques — à trancher à l'implémentation de l'écran Analytics.
- Inngest vs Trigger.dev pour les workflows — les deux fonctionnent bien avec Vercel, comparer au moment de construire le Workflow Builder.
- Le modèle de données ci-dessus est une proposition de départ, pas une migration figée — l'ajuster au fil de l'implémentation plutôt que de chercher l'exhaustivité avant de coder.
