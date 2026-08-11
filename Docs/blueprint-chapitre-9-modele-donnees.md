# Blueprint Produit — Chapitre 9 : Modèle de Données

**Objectif :** Formaliser le schéma de données complet — tables, colonnes, types, relations, index — prêt à être traduit en migrations Supabase/Postgres. Ce chapitre affine et complète le schéma esquissé dans `CLAUDE.md`, avec une attention particulière à la sécurité multi-tenant (RLS) puisque la plateforme sert aussi bien des indépendants que des organisations de plusieurs milliers de collaborateurs.

## 1. Principes de modélisation

1. **Identifiants** : UUID (`gen_random_uuid()`) partout, jamais d'ID auto-incrémenté exposé côté client — évite l'énumération d'organisations ou de leads concurrents.
2. **Multi-tenant par `organization_id`** : chaque table contenant des données d'entreprise porte une colonne `organization_id`, protégée par une policy RLS. Les indépendants (Persona Freelance) sont rattachés à une organisation personnelle créée automatiquement à l'inscription — évite une branche de code séparée « avec/sans organisation ».
3. **Séparation Auth Super Admin vs RBAC organisation** : `users.is_platform_admin` (booléen, réservé à l'équipe LinkCard) est totalement indépendant du rôle qu'un utilisateur a *dans* une organisation (`organization_members.role`). Un Super Admin n'a pas automatiquement de rôle dans les organisations clientes.
4. **Horodatage systématique** : `created_at`, `updated_at` sur toutes les tables métier. `deleted_at` (soft delete) sur les tables où la restauration a du sens (`profiles`, `leads`) — cohérent avec la corbeille à 30 jours déjà spécifiée au chapitre 8.
5. **Append-only pour l'audit** : `audit_logs`, `profile_versions`, `webhook_logs`, `workflow_executions`, `scim_events` ne sont jamais mis à jour ni supprimés par l'application — seulement insérés.
6. **JSONB avec parcimonie** : utilisé pour des structures vraiment variables (`workflow_steps.config`, `profiles.widget_order`), jamais pour des champs qui méritent une vraie colonne typée et indexable.

## 2. Enums

```sql
create type org_plan as enum ('free', 'pro', 'business', 'enterprise');
create type org_role as enum ('org_admin', 'team_admin', 'member', 'reader');
create type profile_type as enum ('entreprise', 'freelance', 'conference', 'custom');
create type profile_status as enum ('draft', 'published', 'archived');
create type lead_channel as enum ('qr', 'nfc', 'email_signature', 'lien_direct', 'ocr', 'import_csv');
create type lead_stage as enum ('nouveau', 'contacte', 'qualifie', 'proposition', 'client', 'perdu');
create type workflow_action_type as enum ('create_crm_contact', 'send_email', 'notify_slack', 'notify_teams', 'webhook_call', 'wait');
create type execution_status as enum ('success', 'failed', 'running');
create type sso_provider as enum ('google_workspace', 'microsoft_entra_id', 'okta');
create type crm_provider as enum ('hubspot', 'salesforce', 'pipedrive', 'zoho', 'dynamics');
create type notification_type as enum ('lead_captured', 'card_viewed', 'workflow_failed', 'workflow_succeeded', 'reminder_due', 'system');
```

## 3. Vue d'ensemble des relations

```
organizations 1───* organization_members *───1 users (auth.users)
organizations 1───* profiles
organizations 1───* leads
organizations 1───* tags
organizations 1───* workflows
organizations 1───* email_templates
organizations 1───* crm_connections
organizations 1───* sso_connections
organizations 1───* invoices / subscription (1─1)

profiles 1───* profile_versions
profiles 1───* nfc_cards
profiles 1───* analytics_events
profiles 1───* wallet_installs

leads *───* tags (via lead_tags)
leads 1───* lead_notes
leads *───1 profiles (carte via laquelle le lead a été capturé)
leads *───1 users (captured_by)

workflows 1───* workflow_steps
workflows 1───* workflow_executions

users 1───* audit_logs (actor)
users 1───* notifications
```

## 4. Tables cœur

### `organizations`
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| name | text | not null |
| slug | text | unique, not null — utilisé dans les URLs publiques |
| plan | org_plan | not null, default `'free'` |
| seats_limit | int | default 1 |
| logo_url | text | |
| brand_primary_color | text | default `'#2563EB'` |
| brand_secondary_color | text | default `'#7C3AED'` |
| layout_locked | boolean | default false — verrouillage de charte graphique (ch.8 §2.1) |
| is_personal | boolean | default false — organisation auto-créée pour un indépendant |
| stripe_customer_id | text | unique, nullable |
| created_at, updated_at | timestamptz | |

Index : `unique(slug)`.

### `organization_members`
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations, not null |
| user_id | uuid | FK → auth.users, not null |
| role | org_role | not null, default `'member'` |
| status | text | `'active' \| 'invited' \| 'suspended'`, default `'invited'` |
| invited_by | uuid | FK → auth.users, nullable |
| provisioned_via_scim | boolean | default false |
| joined_at | timestamptz | nullable |
| created_at | timestamptz | |

Index : `unique(organization_id, user_id)`.

> Note : `super_admin` (Persona 6, Administrateur IT côté LinkCard) n'est **pas** une valeur de `org_role`. C'est `users.is_platform_admin`, géré séparément (table `users` étendant `auth.users` via une table `profiles_users` ou des `raw_app_meta_data` Supabase).

### `profiles` (les « cartes »)
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations, not null |
| owner_id | uuid | FK → auth.users, not null |
| type | profile_type | not null, default `'entreprise'` |
| status | profile_status | not null, default `'draft'` |
| slug | text | unique, not null — utilisé pour `linkcard.app/{slug}` |
| full_name, job_title, company | text | |
| phone, email, address | text | nullable |
| website_url, linkedin_url, calendly_url, portfolio_url | text | nullable |
| brand_primary_color, brand_secondary_color | text | |
| font | text | default `'Manrope'` |
| template | text | default `'corporate'` |
| avatar_url, cover_video_url, audio_intro_url | text | nullable |
| widget_order | jsonb | ex. `[{"key":"linkedin","visible":true},{"key":"calendly","visible":true}]` |
| qr_public | boolean | default true |
| deleted_at | timestamptz | nullable — corbeille 30 jours |
| created_at, updated_at | timestamptz | |

Index : `unique(slug)`, `index(organization_id)`, `index(owner_id)`.

### `profile_versions`
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| profile_id | uuid | FK → profiles, not null |
| snapshot | jsonb | not null — état complet du profil à cet instant |
| change_summary | text | ex. « Couleur principale modifiée » (ch.8 §2.3, diff en langage courant) |
| created_by | uuid | FK → auth.users |
| created_at | timestamptz | |

Index : `index(profile_id, created_at desc)`.

### `leads`
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations, not null |
| profile_id | uuid | FK → profiles, nullable — carte via laquelle capturé |
| captured_by | uuid | FK → auth.users, nullable |
| name, company, email, phone | text | |
| channel | lead_channel | not null |
| stage | lead_stage | not null, default `'nouveau'` |
| meeting_location | text | nullable |
| meeting_at | timestamptz | nullable |
| consent_given | boolean | not null, default false — obligatoire RGPD (ch.8 §4.1) |
| deleted_at | timestamptz | nullable |
| created_at, updated_at | timestamptz | |

Index : `index(organization_id, stage)`, `index(captured_by)`.

### `lead_notes`
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| lead_id | uuid | FK → leads, not null |
| author_id | uuid | FK → auth.users |
| type | text | `'text' \| 'voice'` |
| content | text | nullable — texte ou transcription |
| audio_url | text | nullable |
| created_at | timestamptz | |

### `tags` et `lead_tags`
```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  created_at timestamptz default now(),
  unique(organization_id, name)
);

create table lead_tags (
  lead_id uuid not null references leads(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);
```
Table relationnelle plutôt qu'un simple `text[]` sur `leads` — nécessaire pour la fonctionnalité « Gérer les tags » déjà prototypée (renommer/supprimer un tag globalement sans parcourir tous les leads).

### `workflows`, `workflow_steps`, `workflow_executions`
```sql
create table workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  trigger_type text not null, -- 'lead_captured' | 'card_published' | 'member_provisioned' | ...
  is_active boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  position int not null,
  action_type workflow_action_type not null,
  config jsonb not null default '{}', -- ex. {"template_id": "...", "channel": "#ventes"}
  unique(workflow_id, position)
);

create table workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id),
  triggered_by_lead_id uuid references leads(id),
  status execution_status not null,
  duration_ms int,
  error_message text,
  created_at timestamptz default now()
);
```
Index : `index(workflow_id, created_at desc)` sur `workflow_executions` pour l'écran « Historique des exécutions ».

## 5. Tables secondaires (référence rapide)

| Table | Rôle | Colonnes clés |
|---|---|---|
| `nfc_cards` | Puces physiques associées à un profil | `uid_hex`, `profile_id`, `last_written_at` |
| `wallet_installs` | Suivi des passes Apple/Google Wallet installés, pour la mise à jour auto (ch.8 §Wallet) | `profile_id`, `wallet_type`, `push_token` |
| `email_templates` | Modèles utilisés par les workflows | `organization_id`, `name`, `subject`, `body`, `variables text[]` |
| `webhooks` / `webhook_logs` | Endpoints sortants + journal des appels | `url`, `events text[]`, `status_code`, `response_time_ms` |
| `crm_connections` / `crm_sync_logs` | Intégrations CRM et historique de synchro | `provider crm_provider`, `credentials` (chiffré via Supabase Vault) |
| `sso_connections` | Config SSO par organisation | `organization_id`, `provider sso_provider`, `metadata_url`, `status` |
| `scim_events` | Journal de provisioning/déprovisioning (append-only, ch.8 §5.2) | `organization_id`, `event_type`, `external_user_id`, `result` |
| `analytics_events` | Vues, clics, téléchargements sur les cartes publiques | `profile_id`, `event_type`, `channel`, `country`, `device`, `browser` — **partitionner par mois** dès un trafic significatif |
| `subscriptions` / `invoices` | Miroir local de l'état Stripe | `organization_id`, `stripe_subscription_id`, `status`, `current_period_end` |
| `notifications` | Centre de notifications in-app | `user_id`, `type notification_type`, `read_at`, `payload jsonb` |
| `audit_logs` | Journal d'audit plateforme (ch.4 domaine 11), append-only | `actor_id`, `action`, `target_type`, `target_id`, `metadata jsonb` |
| `feature_flags` | Flags globaux (Super Admin) | `key`, `description`, `rollout_percentage` |
| `support_tickets` | Tickets Super Admin | `organization_id`, `subject`, `priority`, `status` |
| `marketplace_themes` | Thèmes de la marketplace (ch.2, différenciateur) | `name`, `category`, `is_premium`, `preview_config jsonb` |

## 6. Stratégie RLS (Row Level Security)

Principe général : **RLS activé sur toutes les tables sans exception**, y compris celles qui semblent internes — un oubli est le scénario de fuite de données le plus courant en multi-tenant.

Exemple de policy pour `leads` (accès limité aux membres de l'organisation) :
```sql
alter table leads enable row level security;

create policy "org_members_can_read_leads"
  on leads for select
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "org_members_can_insert_leads"
  on leads for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );
```

Cas particulier — **`profiles` doit être lisible publiquement** (Page Publique, Persona Visiteur, aucun compte) :
```sql
create policy "published_profiles_are_public"
  on profiles for select
  using (status = 'published' and deleted_at is null);

create policy "owners_can_manage_their_profiles"
  on profiles for all
  using (owner_id = auth.uid() or organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and role in ('org_admin','team_admin') and status = 'active'
  ));
```

Cas particulier — **Super Admin contourne les policies organisation** via une fonction dédiée plutôt qu'une policy trop permissive :
```sql
create policy "platform_admins_bypass"
  on leads for all
  using (
    exists (select 1 from auth.users u where u.id = auth.uid() and (u.raw_app_meta_data->>'is_platform_admin')::boolean = true)
  );
```
Ce policy s'ajoute (OR) aux autres — Postgres RLS combine les policies du même type en OR par défaut.

Tables **append-only** (`audit_logs`, `scim_events`, `workflow_executions`) : policy `insert` ouverte aux services internes (via `service_role` côté serveur uniquement, jamais côté client), et **aucune policy `update`/`delete`** définie — l'absence de policy bloque l'opération par défaut sous RLS.

## 7. Migrations — ordre et conventions

Nommage : `supabase/migrations/YYYYMMDDHHMMSS_description.sql`.

Ordre obligatoire (dépendances FK) :
1. Enums (§2)
2. `organizations`
3. `organization_members` (dépend de `auth.users`, déjà géré par Supabase Auth)
4. `profiles` → `profile_versions` → `nfc_cards` → `wallet_installs`
5. `tags` → `leads` → `lead_tags` → `lead_notes`
6. `workflows` → `workflow_steps` → `workflow_executions`
7. `email_templates`, `webhooks`/`webhook_logs`, `crm_connections`/`crm_sync_logs`
8. `sso_connections`, `scim_events`
9. `analytics_events` (avec partitioning dès le départ si possible — plus simple à mettre en place à la création qu'à migrer après coup)
10. `subscriptions`, `invoices`
11. `notifications`, `audit_logs`
12. Tables Super Admin : `feature_flags`, `support_tickets`, `marketplace_themes`
13. RLS activé + policies, table par table, dans le même ordre

Chaque migration doit activer RLS et créer ses policies **dans la même migration** que la création de la table — ne jamais laisser une table sans RLS entre deux déploiements, même temporairement.

## 8. Points d'attention

- **Droit à l'oubli (RGPD, ch.8 §4)** : la suppression de compte doit anonymiser plutôt que supprimer les lignes `leads`/`analytics_events` où l'utilisateur apparaît comme *sujet* (ex. un visiteur qui a rempli le formulaire de retour), pour ne pas casser l'intégrité référentielle ni les statistiques agrégées d'un tiers.
- **Debounce de versioning** : `profile_versions` ne doit recevoir un insert qu'au moment où l'état `saved` est atteint côté client (ch.8 §2.3), jamais à chaque frappe — sinon la table explose en volume pour un bénéfice nul.
- **Chiffrement des credentials CRM/SSO** : utiliser Supabase Vault (ou équivalent) pour `crm_connections.credentials`, jamais du texte en clair même dans une colonne « privée ».
- **Seed data** : prévoir un script de seed avec les données déjà utilisées dans le prototype (Alex Martin, Sophie Durand, Acme Corp...) pour que les premiers écrans développés soient testables immédiatement avec des données cohérentes avec les maquettes.

## Conclusion

Ce schéma est un point de départ solide, pas une version figée (voir `CLAUDE.md` §8) — à ajuster au fil de l'implémentation, notamment sur le détail des `config jsonb` des workflow steps une fois le Workflow Builder réellement branché à Inngest/Trigger.dev.

## Recommandation pour la suite

Deux chapitres restent ouverts : la **stratégie de monétisation détaillée** (limites précises par plan, mécanismes d'upsell) et l'**API publique** (endpoints, authentification par clé API, rate limiting) — cette dernière prenant tout son sens maintenant que le modèle de données est posé.
