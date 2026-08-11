import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditorForm } from "@/components/features/editor-form";
import { DeleteCardMenuItem } from "@/components/features/delete-card-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMyProfileById } from "@/lib/supabase/queries";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const profile = await getMyProfileById(cardId);

  if (!profile) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Cette carte n&apos;existe pas ou tu n&apos;y as pas accès.
        </p>
        <Button asChild variant="outline">
          <Link href="/cards">
            <ArrowLeft />
            Retour à mes cartes
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary" className="w-fit">
          {profile.full_name ?? "Carte sans nom"} ·{" "}
          {profile.status === "published"
            ? "Publiée"
            : profile.status === "draft"
              ? "Brouillon"
              : "Archivée"}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DeleteCardMenuItem
              cardId={profile.id}
              cardName={profile.full_name ?? "cette carte"}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditorForm profile={profile} />
    </div>
  );
}
