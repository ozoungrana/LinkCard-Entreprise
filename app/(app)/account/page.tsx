import {
  CreditCard,
  Download,
  FileText,
  Laptop,
  RefreshCw,
  Shield,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { label: "Affichage du QR code et du profil de base", enabled: true },
  { label: "Écriture et lecture de la puce NFC", enabled: true },
  { label: "Enregistrement local des nouveaux contacts scannés", enabled: true },
  { label: "Analytics et intégrations CRM en temps réel", enabled: false },
];

const invoices = [
  { date: "1 mai 2026", amount: "87,00 €" },
  { date: "1 avr. 2026", amount: "87,00 €" },
  { date: "1 mars 2026", amount: "58,00 €" },
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
            <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
              <Wifi className="size-5 text-success" />
              <div className="flex-1">
                <div className="text-sm font-medium">Vous êtes en ligne</div>
                <div className="text-xs text-muted-foreground">
                  Toutes les fonctionnalités sont disponibles
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Simuler hors-ligne</span>
              <Switch />
            </div>
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

          <Separator />

          <div>
            <h3 className="text-sm font-semibold">Synchronisation</h3>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <div className="text-sm font-medium">Dernière synchronisation</div>
                <div className="text-xs text-muted-foreground">
                  15 mai 2026, 14:30 — toutes les données sont à jour
                </div>
              </div>
              <Button size="sm">
                <RefreshCw />
                Synchroniser maintenant
              </Button>
            </div>
            <OptRow
              title="Synchronisation automatique"
              desc="Dès qu'une connexion est détectée"
              defaultOn
            />
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
            </div>
            <Button variant="outline">Changer de plan</Button>
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

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Moyen de paiement</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Visa •••• 4242</div>
                <div className="text-xs text-muted-foreground">Expire 08/28</div>
              </div>
              <Button variant="outline" size="sm">
                Mettre à jour
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Historique des factures</h3>
            <div className="flex flex-col gap-2">
              {invoices.map((inv) => (
                <div key={inv.date} className="flex items-center gap-3 text-sm">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-muted-foreground">{inv.date}</span>
                  <span className="font-medium">{inv.amount}</span>
                  <Badge variant="secondary">Payée</Badge>
                </div>
              ))}
            </div>
            <a href="#" className="mt-3 inline-block text-xs text-primary hover:underline">
              Voir toutes les factures
            </a>
          </div>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
