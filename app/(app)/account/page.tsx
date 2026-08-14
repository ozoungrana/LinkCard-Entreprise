import {
  CreditCard,
  Download,
  FileText,
  Laptop,
  Shield,
  Smartphone,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageBillingButton, UpgradePlanDialog } from "@/components/features/billing-actions";
import { OfflineStatus } from "@/components/features/offline-status";
import {
  getCurrentOrganization,
  getMyLeads,
  getMyProfiles,
  getOrganizationMembers,
} from "@/lib/supabase/queries";
import type { OrgPlan } from "@/lib/supabase/types";

// Chapter 10 §2/§3 pricing grid.
const PLAN_INFO: Record<OrgPlan, { label: string; price: string; period: string; cardLimit: number | null }> = {
  free: { label: "Free", price: "0 €", period: "/mois", cardLimit: 1 },
  pro: { label: "Pro", price: "9 €", period: "/mois", cardLimit: null },
  business: { label: "Business", price: "19 €", period: "/utilisateur/mois", cardLimit: null },
  enterprise: { label: "Enterprise", price: "Sur devis", period: "", cardLimit: null },
};

const sessions = [
  { icon: Laptop, label: "MacBook Pro · Abidjan", sub: "Chrome · Dernière activité à l'instant", current: true },
  { icon: Smartphone, label: "iPhone 15 Pro · Abidjan", sub: "App LinkCard · il y a 2h", current: false },
  { icon: Laptop, label: "Windows · Paris", sub: "Edge · il y a 6 jours", current: false },
];

const offlineChecklist = [
  { label: "Affichage de la dernière carte publique consultée", enabled: true },
  { label: "Téléchargement du contact (vCard) déjà en cache", enabled: true },
  { label: "Ajout manuel d'un contact, synchronisé au retour du réseau", enabled: true },
  { label: "Écriture et lecture de la puce NFC hors-ligne", enabled: false },
  { label: "Scan OCR d'une carte de visite hors-ligne", enabled: false },
];

function OptRow({ title, desc, defaultOn, locked }: { title: string; desc: string; defaultOn: boolean; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked={defaultOn} disabled={locked} />
    </div>
  );
}

export default async function AccountPage() {
  const organization = await getCurrentOrganization();
  const [profiles, leads, members] = organization
    ? await Promise.all([
        getMyProfiles(),
        getMyLeads(),
        getOrganizationMembers(organization.id),
      ])
    : [[], [], []];

  const plan = PLAN_INFO[organization?.plan ?? "free"];
  const activeMembers = members.filter((m) => m.status === "active").length;
  const seatsLimit = organization?.seats_limit;
  const now = new Date();
  const contactsThisMonth = leads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const usage = [
    {
      label: "Sièges utilisateurs",
      value: seatsLimit ? `${activeMembers} / ${seatsLimit}` : `${activeMembers}`,
      pct: seatsLimit ? Math.min(100, (activeMembers / seatsLimit) * 100) : 100,
    },
    {
      label: "Cartes actives",
      value: plan.cardLimit ? `${profiles.length} / ${plan.cardLimit}` : `${profiles.length}`,
      pct: plan.cardLimit ? Math.min(100, (profiles.length / plan.cardLimit) * 100) : 100,
    },
    {
      label: "Contacts ce mois-ci",
      value:
        organization?.plan === "free" ? `${contactsThisMonth} / 5` : `${contactsThisMonth}`,
      pct: organization?.plan === "free" ? Math.min(100, (contactsThisMonth / 5) * 100) : 100,
    },
  ];

  return (
    <Tabs defaultValue="securite" orientation="vertical" className="items-start gap-4 lg:grid lg:grid-cols-[240px_1fr]">
      <Card className="w-full gap-0 p-2">
        <TabsList className="h-auto w-full flex-col gap-1 bg-transparent p-0">
          <TabsTrigger value="securite" className="w-full justify-start px-3 py-2">
            <Shield />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="rgpd" className="w-full justify-start px-3 py-2">
            <FileText />
            RGPD & Confidentialité
          </TabsTrigger>
          <TabsTrigger value="offline" className="w-full justify-start px-3 py-2">
            <WifiOff />
            Mode hors-ligne
          </TabsTrigger>
          <TabsTrigger value="abonnement" className="w-full justify-start px-3 py-2">
            <CreditCard />
            Abonnement & Facturation
          </TabsTrigger>
        </TabsList>
      </Card>

      <Card className="w-full p-6">
        <TabsContent value="securite" className="flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold">Authentification</h3>
            <p className="mb-1 text-xs text-muted-foreground">
              Renforce la protection de ton compte et de tes cartes.
            </p>
            <OptRow
              title="Authentification à deux facteurs"
              desc="Un code supplémentaire est demandé à chaque connexion"
              defaultOn
            />
            <OptRow
              title="Alerte sur nouvelle connexion"
              desc="Recevoir un email lors d'une connexion depuis un nouvel appareil"
              defaultOn
            />
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <div className="text-sm font-medium">Mot de passe</div>
                <div className="text-xs text-muted-foreground">Dernier changement il y a 3 mois</div>
              </div>
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold">Sessions actives</h3>
            <p className="mb-2 text-xs text-muted-foreground">3 sessions actives sur tes appareils.</p>
            <div className="flex flex-col gap-2">
              {sessions.map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-lg border p-3">
                  <s.icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {s.label}
                      {s.current && <Badge variant="secondary">Cet appareil</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                  {!s.current && (
                    <Button variant="ghost" size="sm">
                      Déconnecter
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-3">
              Gérer les appareils de confiance
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="rgpd" className="flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-semibold">Consentement</h3>
            <p className="mb-1 text-xs text-muted-foreground">
              Choisis quelles données LinkCard peut traiter, conformément au RGPD et au CCPA.
            </p>
            <OptRow
              title="Données nécessaires au service"
              desc="Requises pour créer et afficher tes cartes — non désactivable"
              defaultOn
              locked
            />
            <OptRow
              title="Analyse d'usage"
              desc="Nous aide à améliorer les statistiques et les fonctionnalités"
              defaultOn
            />
            <OptRow
              title="Communications marketing"
              desc="Actualités produit, conseils réseautage"
              defaultOn={false}
            />
            <a href="#" className="mt-1 inline-block text-xs text-primary hover:underline">
              Voir la politique de confidentialité
            </a>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold">Tes données</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Exporte ou supprime les données associées à ton compte.
            </p>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <div className="text-sm font-medium">Exporter mes données</div>
                <div className="text-xs text-muted-foreground">
                  Reçois une archive complète (profil, cartes, contacts) par email
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download />
                Exporter
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <div className="text-sm font-medium text-danger">Droit à l&apos;oubli</div>
                <div className="text-xs text-muted-foreground">
                  Supprime définitivement ton compte et toutes tes données
                </div>
              </div>
              <Button variant="destructive" size="sm">
                Demander la suppression
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="offline" className="flex flex-col gap-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Statut</h3>
            <OfflineStatus />
            <p className="mb-2 mt-4 text-xs text-muted-foreground">
              Ce qui reste disponible sans connexion réseau :
            </p>
            <div className="flex flex-col gap-1.5">
              {offlineChecklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 text-sm ${
                    item.enabled ? "" : "text-muted-foreground line-through"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${item.enabled ? "bg-success" : "bg-muted-foreground"}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="abonnement" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="text-xs text-muted-foreground">Plan actuel</div>
              <div className="text-lg font-semibold font-display">{plan.label}</div>
              <div className="text-xs text-muted-foreground">
                <b>{plan.price}</b> {plan.period} · facturation mensuelle
              </div>
              {organization?.payment_provider === "cinetpay" && organization.plan_expires_at && (
                <div className="mt-1 text-xs text-warning">
                  Payé via Mobile Money · accès valide jusqu&apos;au{" "}
                  {new Date(organization.plan_expires_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
            {organization?.plan === "free" || !organization ? (
              <UpgradePlanDialog />
            ) : organization.payment_provider === "cinetpay" ? (
              <UpgradePlanDialog
                defaultMethod="cinetpay"
                trigger={<Button variant="outline">Renouveler (Mobile Money)</Button>}
              />
            ) : (
              <div className="flex flex-col items-end gap-2">
                <ManageBillingButton />
                <UpgradePlanDialog
                  trigger={
                    <button type="button" className="text-xs text-primary hover:underline">
                      Changer de formule
                    </button>
                  }
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {usage.map((u) => (
              <div key={u.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{u.label}</span>
                  <span className="font-medium">{u.value}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${u.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {organization?.plan !== "free" && organization?.payment_provider === "cinetpay" ? (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">Moyen de paiement & factures</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Payé via Mobile Money (CinetPay) — pas de reconduction automatique. Renouvelle
                  avant l&apos;échéance ci-dessus pour garder ton plan actif ; tu recevras une
                  notification quelques jours avant.
                </p>
                <UpgradePlanDialog
                  defaultMethod="cinetpay"
                  trigger={<Button variant="outline">Renouveler (Mobile Money)</Button>}
                />
              </div>
            </>
          ) : (
            organization?.plan !== "free" && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Moyen de paiement & factures</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Géré de façon sécurisée par Stripe — mets à jour ta carte, télécharge tes
                    factures ou annule ton abonnement.
                  </p>
                  <ManageBillingButton />
                </div>
              </>
            )
          )}
        </TabsContent>
      </Card>
    </Tabs>
  );
}
