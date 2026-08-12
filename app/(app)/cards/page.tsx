import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCardDialog } from "@/components/features/create-card-dialog";
import { DeleteCardMenuItem } from "@/components/features/delete-card-button";
import { CardQrThumbnail, ShareCardDialog } from "@/components/features/share-card-dialog";
import { getMyProfiles, getViewCountsByProfile } from "@/lib/supabase/queries";

const typeLabels: Record<string, string> = {
  entreprise: "Entreprise",
  freelance: "Freelance",
  conference: "Conférence",
  custom: "Personnalisé",
};

const gradientByType: Record<string, string> = {
  entreprise: "from-primary to-blue-400",
  freelance: "from-accent to-cyan-600",
  conference: "from-gray-800 to-gray-600",
  custom: "from-secondary to-purple-400",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return "Modifiée aujourd'hui";
  if (days === 1) return "Modifiée hier";
  if (days < 30) return `Modifiée il y a ${days}j`;
  return `Modifiée il y a ${Math.floor(days / 30)} mois`;
}

export default async function CardsPage() {
  const profiles = await getMyProfiles();
  const viewCounts = await getViewCountsByProfile(profiles.map((p) => p.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold font-display">Mes cartes</h2>
        <CreateCardDialog />
      </div>

      {profiles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Tu n&apos;as pas encore de carte. Crée ta première carte pour commencer à réseauter.
          </p>
          <CreateCardDialog />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((card) => (
            <Card key={card.id} className="overflow-hidden py-0">
              <div
                className={`flex h-32 flex-col justify-between bg-gradient-to-br p-4 text-white ${gradientByType[card.type]}`}
              >
                <Badge variant="outline" className="w-fit border-white/40 text-white">
                  {typeLabels[card.type]}
                </Badge>
                <div>
                  <div className="font-display font-semibold">
                    {card.full_name ?? "Carte sans nom"}
                  </div>
                  <div className="text-sm text-white/85">
                    {[card.job_title, card.company].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm">{card.full_name ?? "Carte sans nom"}</strong>
                      <span
                        className={`text-xs font-medium ${
                          card.status === "published"
                            ? "text-success"
                            : card.status === "draft"
                              ? "text-warning"
                              : "text-muted-foreground"
                        }`}
                      >
                        ●{" "}
                        {card.status === "published"
                          ? "Publiée"
                          : card.status === "draft"
                            ? "Brouillon"
                            : "Archivée"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {viewCounts.get(card.id) ?? 0} vues
                      </span>
                      <span>{timeAgo(card.updated_at)}</span>
                    </div>
                  </div>
                  <ShareCardDialog
                    slug={card.slug}
                    cardName={card.full_name ?? "cette carte"}
                    trigger={<CardQrThumbnail slug={card.slug} />}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="secondary" size="sm" className="flex-1">
                    <Link href={`/editor/${card.id}`}>
                      <Pencil />
                      Éditer
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon-sm">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/editor/${card.id}`}>Modifier</Link>
                      </DropdownMenuItem>
                      <DeleteCardMenuItem cardId={card.id} cardName={card.full_name ?? "cette carte"} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}

          <CreateCardTile />
        </div>
      )}
    </div>
  );
}

function CreateCardTile() {
  return (
    <Card className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 border-dashed text-muted-foreground">
      <Plus className="size-6" />
      <span className="text-sm font-medium">Créer un profil</span>
      <span className="text-xs">Entreprise, freelance, événement…</span>
      <div className="mt-2">
        <CreateCardDialog />
      </div>
    </Card>
  );
}
