import Link from "next/link";
import { Building2, ExternalLink, LayoutDashboard, Network, ShieldAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllOrganizations,
  getAllUsers,
  getCurrentUser,
  getIsPlatformAdmin,
  getNetworkProfiles,
  getPlatformStats,
} from "@/lib/supabase/queries";
import type { OrgPlan } from "@/lib/supabase/types";

const planLabels: Record<OrgPlan, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

const statusLabels: Record<string, string> = {
  published: "Publiée",
  draft: "Brouillon",
  archived: "Archivée",
};

export default async function AdminSaasPage() {
  const [user, isPlatformAdmin] = await Promise.all([getCurrentUser(), getIsPlatformAdmin()]);

  if (!user || !isPlatformAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 px-6 text-center">
        <ShieldAlert className="size-8 text-danger" />
        <h1 className="font-display text-lg font-semibold">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">
          Cette section est réservée aux comptes Super Admin.
        </p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const [stats, organizations, users, networkProfiles] = await Promise.all([
    getPlatformStats(),
    getAllOrganizations(),
    getAllUsers(),
    getNetworkProfiles(),
  ]);

  const kpis = [
    { label: "Organisations", value: stats.organizations },
    { label: "Utilisateurs", value: stats.users },
    { label: "Cartes créées", value: stats.profiles },
    { label: "Cartes publiées", value: stats.publishedProfiles },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display font-semibold">LinkCard</span>
          <Badge variant="secondary">Super Admin</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          Connecté en tant que <b>{user.name ?? user.email}</b>
          <Link href="/dashboard" className="text-primary hover:underline">
            Quitter
          </Link>
        </div>
      </header>

      <div className="p-6">
        <Tabs
          defaultValue="dashboard"
          orientation="vertical"
          className="items-start gap-4 lg:grid lg:grid-cols-[220px_1fr]"
        >
          <Card className="w-full gap-0 p-2">
            <TabsList className="h-auto w-full flex-col gap-1 bg-transparent p-0">
              <TabsTrigger value="dashboard" className="w-full justify-start px-3 py-2">
                <LayoutDashboard />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="users" className="w-full justify-start px-3 py-2">
                <Users />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="orgs" className="w-full justify-start px-3 py-2">
                <Building2 />
                Organisations
              </TabsTrigger>
              <TabsTrigger value="reseau" className="w-full justify-start px-3 py-2">
                <Network />
                Réseau LinkCard
              </TabsTrigger>
            </TabsList>
          </Card>

          <div className="flex w-full flex-col gap-4">
            <TabsContent value="dashboard" className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => (
                  <Card key={k.label}>
                    <CardContent className="pt-6">
                      <div className="text-xs text-muted-foreground">{k.label}</div>
                      <div className="mt-1 text-xl font-semibold font-display">{k.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Facturation & monitoring</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  MRR, churn et supervision d&apos;infrastructure arriveront une fois Stripe et
                  l&apos;observabilité connectés.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead className="text-right">Inscrit le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          Aucun utilisateur.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="text-sm font-medium">{u.name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {new Date(u.created_at).toLocaleDateString("fr-FR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="orgs">
              <Card className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Créée le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Aucune organisation.
                        </TableCell>
                      </TableRow>
                    ) : (
                      organizations.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.name}</TableCell>
                          <TableCell className="font-mono text-xs">{o.plan}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {new Date(o.created_at).toLocaleDateString("fr-FR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="reseau" className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {networkProfiles.length} carte{networkProfiles.length > 1 ? "s" : ""} appartenant à
                une organisation avec un abonnement payant (Pro, Business ou Enterprise) — les
                organisations en Free ne sont pas listées ici.
              </p>
              <Card className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carte</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Vues</TableHead>
                      <TableHead className="text-right">Créée le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {networkProfiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucune carte parmi les organisations abonnées pour l&apos;instant.
                        </TableCell>
                      </TableRow>
                    ) : (
                      networkProfiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {p.full_name ?? "Carte sans nom"}
                              </span>
                              {p.status === "published" && (
                                <Link
                                  href={`/c/${p.slug}`}
                                  target="_blank"
                                  className="text-muted-foreground hover:text-primary"
                                  aria-label="Ouvrir la carte publique"
                                >
                                  <ExternalLink className="size-3.5" />
                                </Link>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {[p.job_title, p.company].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{p.owner?.name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{p.owner?.email ?? "—"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{p.organization?.name ?? "—"}</div>
                            {p.organization && (
                              <Badge variant="secondary" className="mt-0.5 font-mono text-[10px]">
                                {planLabels[p.organization.plan]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs font-medium ${
                                p.status === "published"
                                  ? "text-success"
                                  : p.status === "draft"
                                    ? "text-warning"
                                    : "text-muted-foreground"
                              }`}
                            >
                              ● {statusLabels[p.status] ?? p.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{p.view_count}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {new Date(p.created_at).toLocaleDateString("fr-FR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
