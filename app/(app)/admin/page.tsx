import { Palette, Plug, Shield, ShieldCheck, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandingForm } from "@/components/features/branding-form";
import {
  getCrmConnections,
  getCurrentOrganization,
  getOrganizationMembers,
} from "@/lib/supabase/queries";
import type { CrmProvider } from "@/lib/supabase/types";

const CRM_PROVIDERS: { value: CrmProvider; label: string }[] = [
  { value: "hubspot", label: "HubSpot" },
  { value: "salesforce", label: "Salesforce" },
  { value: "pipedrive", label: "Pipedrive" },
  { value: "zoho", label: "Zoho" },
];

const roleLabels: Record<string, string> = {
  org_admin: "Admin d'organisation",
  team_admin: "Admin d'équipe",
  member: "Membre",
  reader: "Lecteur",
};

function initialsOf(input: string) {
  return (
    input
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export default async function AdminPage() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
        <CardContent className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Impossible de charger ton organisation pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const [members, crmConnections] = await Promise.all([
    getOrganizationMembers(organization.id),
    getCrmConnections(organization.id),
  ]);

  return (
    <Tabs
      defaultValue="membres"
      orientation="vertical"
      className="items-start gap-4 lg:grid lg:grid-cols-[240px_1fr]"
    >
      <Card className="w-full gap-0 p-2">
        <TabsList className="h-auto w-full flex-col gap-1 bg-transparent p-0">
          <TabsTrigger value="membres" className="w-full justify-start px-3 py-2">
            <Users />
            Membres
          </TabsTrigger>
          <TabsTrigger value="roles" className="w-full justify-start px-3 py-2">
            <Shield />
            Rôles & Permissions
          </TabsTrigger>
          <TabsTrigger value="charte" className="w-full justify-start px-3 py-2">
            <Palette />
            Charte graphique
          </TabsTrigger>
          <TabsTrigger value="crm" className="w-full justify-start px-3 py-2">
            <Plug />
            Intégrations CRM
          </TabsTrigger>
          <TabsTrigger value="sso" className="w-full justify-start px-3 py-2">
            <ShieldCheck />
            SSO & Provisioning
          </TabsTrigger>
        </TabsList>
      </Card>

      <Card className="w-full p-6">
        <TabsContent value="membres" className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold">Membres de l&apos;équipe</h3>
            <p className="text-xs text-muted-foreground">
              {members.length} membre{members.length > 1 ? "s" : ""} dans {organization.name}.
            </p>
          </div>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar className="size-8">
                <AvatarFallback>{initialsOf(m.user?.name ?? m.user?.email ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{m.user?.name ?? m.user?.email}</div>
                <div className="truncate text-xs text-muted-foreground">{m.user?.email}</div>
              </div>
              <span className="text-xs text-muted-foreground">{roleLabels[m.role]}</span>
              {m.status !== "active" && (
                <Badge variant="outline">{m.status === "invited" ? "Invité" : "Suspendu"}</Badge>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="roles">
          <p className="text-sm text-muted-foreground">
            Les rôles disponibles sont Admin d&apos;organisation, Admin d&apos;équipe, Membre et
            Lecteur (table <code className="font-mono text-xs">organization_members.role</code>).
            L&apos;édition fine des permissions par rôle arrive prochainement.
          </p>
        </TabsContent>

        <TabsContent value="charte">
          <BrandingForm organization={organization} />
        </TabsContent>

        <TabsContent value="crm" className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold">Intégrations CRM</h3>
            <p className="text-xs text-muted-foreground">
              Synchronise tes contacts capturés vers ton CRM.
            </p>
          </div>
          {CRM_PROVIDERS.map((provider) => {
            const connection = crmConnections.find((c) => c.provider === provider.value);
            const connected = connection?.status === "connected";
            return (
              <div key={provider.value} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Plug className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{provider.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {connected ? "Connecté" : "Non connecté"}
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {connected ? "Déconnecter" : "Connecter"}
                </Button>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            La connexion nécessite l&apos;enregistrement d&apos;une application OAuth auprès de
            chaque fournisseur — désactivée tant que ces identifiants ne sont pas configurés.
          </p>
        </TabsContent>

        <TabsContent value="sso">
          <p className="text-sm text-muted-foreground">
            Le SSO et le provisioning SCIM (via WorkOS) arrivent bientôt.
          </p>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
