import Link from "next/link";
import { Building2, LayoutDashboard, ShieldAlert, Users } from "lucide-react";

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
  getPlatformStats,
} from "@/lib/supabase/queries";

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

  const [stats, organizations, users] = await Promise.all([
    getPlatformStats(),
    getAllOrganizations(),
    getAllUsers(),
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
          </div>
        </Tabs>
      </div>
    </div>
  );
}
