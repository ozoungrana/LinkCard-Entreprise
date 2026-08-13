"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { restoreProfileVersion } from "@/lib/actions/profiles";
import type { ProfileVersion } from "@/lib/supabase/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionHistorySheet({
  profileId,
  versions,
  open,
  onOpenChange,
}: {
  profileId: string;
  versions: ProfileVersion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function restore(versionId: string) {
    setPendingId(versionId);
    startTransition(async () => {
      try {
        await restoreProfileVersion(profileId, versionId);
        toast.success("Version restaurée");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de la restauration");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Historique des versions</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-4">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune version enregistrée pour le moment — chaque sauvegarde en créera une.
            </p>
          ) : (
            versions.map((v, i) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{v.change_summary ?? "Modification"}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(v.created_at)}</div>
                </div>
                {i === 0 ? (
                  <span className="shrink-0 text-xs text-muted-foreground">Actuelle</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={pendingId === v.id}
                    onClick={() => restore(v.id)}
                  >
                    {pendingId === v.id ? "…" : "Restaurer"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
