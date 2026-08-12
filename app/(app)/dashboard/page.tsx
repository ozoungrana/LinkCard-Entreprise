import Link from "next/link";
import { Download, Pencil, Plus, Share2, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CardQrThumbnail, ShareCardDialog } from "@/components/features/share-card-dialog";
import { getAnalyticsCounts, getCurrentUser, getMyLeads, getMyProfiles } from "@/lib/supabase/queries";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default async function DashboardPage() {
  const [user, profiles, leads] = await Promise.all([
    getCurrentUser(),
    getMyProfiles(),
    getMyLeads(),
  ]);

  const counts = await getAnalyticsCounts(profiles.map((p) => p.id));
  const activeCard = profiles[0] ?? null;
  const recentLeads = leads.slice(0, 4);
  const firstName = user?.name?.split(" ")[0] ?? "là";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold font-display">Bonjour, {firstName}</h2>
        <p className="text-sm text-muted-foreground">
          {activeCard
            ? `Voici comment votre carte « ${activeCard.full_name ?? "sans nom"} » a performé.`
            : "Créez votre première carte pour commencer à suivre vos performances."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vues de carte</span>
              <TrendingUp className="size-3.5 text-success" />
            </div>
            <div className="mt-2 text-2xl font-semibold font-display">{counts.view}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Clics sur les liens</span>
              <TrendingUp className="size-3.5 text-success" />
            </div>
            <div className="mt-2 text-2xl font-semibold font-display">{counts.click}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contacts collectés</span>
              <TrendingUp className="size-3.5 text-success" />
            </div>
            <div className="mt-2 text-2xl font-semibold font-display">{leads.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Activité récente</CardTitle>
            <Link href="/contacts" className="text-xs text-primary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun contact capturé pour l&apos;instant. Partage ta carte pour commencer à en
                recevoir.
              </p>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Users className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <b>{lead.name}</b> a enregistré ses coordonnées
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.company ?? lead.email ?? "Via la carte publique"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(lead.created_at)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Carte active</CardTitle>
            {activeCard && (
              <Link href={`/editor/${activeCard.id}`} className="text-xs text-primary hover:underline">
                Éditer
              </Link>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {activeCard ? (
              <>
                <div className="flex items-start justify-between gap-3 rounded-lg bg-gradient-to-br from-primary to-blue-400 p-4 text-primary-foreground">
                  <div>
                    <Avatar className="size-10 border-2 border-white/40">
                      <AvatarFallback className="bg-white/20 text-white">
                        {initialsOf(activeCard.full_name ?? "Carte")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-3 font-display font-semibold">
                      {activeCard.full_name ?? "Carte sans nom"}
                    </div>
                    <div className="text-sm text-primary-foreground/80">
                      {[activeCard.job_title, activeCard.company].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <ShareCardDialog
                    slug={activeCard.slug}
                    cardName={activeCard.full_name ?? "cette carte"}
                    trigger={<CardQrThumbnail slug={activeCard.slug} />}
                  />
                </div>
                <div className="flex gap-2">
                  <ShareCardDialog
                    slug={activeCard.slug}
                    cardName={activeCard.full_name ?? "cette carte"}
                    trigger={
                      <Button className="flex-1">
                        <Share2 />
                        Partager ma carte
                      </Button>
                    }
                  />
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/editor/${activeCard.id}`}>
                      <Pencil />
                      Personnaliser
                    </Link>
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="w-fit">
                  <Download />
                  Exporter en vCard
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  Tu n&apos;as pas encore de carte. Crée ta première carte pour commencer à
                  réseauter.
                </p>
                <Button asChild>
                  <Link href="/cards">
                    <Plus />
                    Créer une carte
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
