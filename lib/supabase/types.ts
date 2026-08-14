// Hand-written types mirroring Docs/blueprint-chapitre-9-modele-donnees.md
// and supabase/migrations/0006_schema.sql.
// Swap for `supabase gen types typescript` output once the CLI is linked.

export type OrgPlan = "free" | "pro" | "business" | "enterprise";
export type OrgRole = "org_admin" | "team_admin" | "member" | "reader";
export type ProfileType = "entreprise" | "freelance" | "conference" | "custom";
export type ProfileStatus = "draft" | "published" | "archived";
export type LeadChannel = "qr" | "nfc" | "email_signature" | "lien_direct" | "ocr" | "import_csv" | "manuel";
export type LeadStage = "nouveau" | "contacte" | "qualifie" | "proposition" | "client" | "perdu";
export type ExecutionStatus = "success" | "failed" | "running";
export type CrmProvider = "hubspot" | "salesforce" | "pipedrive" | "zoho" | "dynamics";

export type CrmConnection = {
  id: string;
  organization_id: string;
  provider: CrmProvider;
  status: string;
  created_at: string;
};

export type ProfileVersion = {
  id: string;
  profile_id: string;
  snapshot: Record<string, unknown>;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
};

export type SsoProvider = "google_workspace" | "microsoft_entra_id" | "okta";

export type SsoConnection = {
  id: string;
  organization_id: string;
  provider: SsoProvider;
  metadata_url: string | null;
  status: string;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  seats_limit: number | null;
  logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  layout_locked: boolean;
  is_personal: boolean;
  stripe_customer_id: string | null;
  plan_expires_at: string | null;
  payment_provider: "stripe" | "cinetpay" | null;
  created_at: string;
  updated_at: string;
};

export type CinetpayTransaction = {
  id: string;
  organization_id: string;
  transaction_id: string;
  plan: OrgPlan;
  seats: number;
  amount: number;
  currency: string;
  status: "pending" | "accepted" | "refused" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: "active" | "invited" | "suspended";
  invited_by: string | null;
  provisioned_via_scim: boolean;
  joined_at: string | null;
  created_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  organization_id: string;
  owner_id: string;
  type: ProfileType;
  status: ProfileStatus;
  slug: string;
  full_name: string | null;
  job_title: string | null;
  company: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  calendly_url: string | null;
  portfolio_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  font: string | null;
  template: string | null;
  avatar_url: string | null;
  cover_video_url: string | null;
  audio_intro_url: string | null;
  widget_order: unknown;
  qr_public: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  organization_id: string;
  profile_id: string | null;
  captured_by: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  channel: LeadChannel;
  stage: LeadStage;
  meeting_location: string | null;
  meeting_at: string | null;
  consent_given: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  type: "text" | "voice";
  content: string | null;
  audio_url: string | null;
  created_at: string;
};

export type Workflow = {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkflowExecution = {
  id: string;
  workflow_id: string;
  triggered_by_lead_id: string | null;
  status: ExecutionStatus;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
};

export type WorkflowActionType =
  | "create_crm_contact"
  | "send_email"
  | "notify_slack"
  | "notify_teams"
  | "webhook_call"
  | "wait";

export type WorkflowStep = {
  id: string;
  workflow_id: string;
  position: number;
  action_type: WorkflowActionType;
  config: Record<string, unknown>;
};

export type EmailTemplate = {
  id: string;
  organization_id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
};

export type Webhook = {
  id: string;
  organization_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
};

export const WEBHOOK_EVENTS = ["lead_captured", "card_published", "contact_synced"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type NotificationType =
  | "lead_captured"
  | "card_viewed"
  | "workflow_failed"
  | "workflow_succeeded"
  | "reminder_due"
  | "system";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type AnalyticsEvent = {
  id: string;
  profile_id: string | null;
  event_type: "view" | "click" | "download" | "save_contact";
  channel: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  created_at: string;
};
