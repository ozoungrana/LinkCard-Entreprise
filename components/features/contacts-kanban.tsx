"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeadDetailSheet } from "@/components/features/lead-detail-sheet";
import { updateLeadStage } from "@/lib/actions/leads";
import type { LeadWithNotes } from "@/lib/supabase/queries";
import type { Lead } from "@/lib/supabase/types";
import { initialsOf, stageLabels, stageOrder } from "@/lib/leads-labels";

export function ContactsKanban({ leads }: { leads: LeadWithNotes[] }) {
  const [selected, setSelected] = useState<LeadWithNotes | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticLeads, moveLead] = useOptimistic(
    leads,
    (state, { id, stage }: { id: string; stage: Lead["stage"] }) =>
      state.map((l) => (l.id === id ? { ...l, stage } : l))
  );

  function handleDrop(leadId: string, stage: Lead["stage"]) {
    startTransition(async () => {
      moveLead({ id: leadId, stage });
      try {
        await updateLeadStage(leadId, stage);
      } catch {
        toast.error("Échec de la mise à jour de l'étape");
      }
    });
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stageOrder.map((stage) => {
          const columnLeads = optimisticLeads.filter((l) => l.stage === stage);
          return (
            <div
              key={stage}
              className="flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData("text/plain");
                if (leadId) handleDrop(leadId, stage);
              }}
            >
              <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
                <span>{stageLabels[stage]}</span>
                <span>{columnLeads.length}</span>
              </div>
              <div className="flex min-h-16 flex-col gap-2">
                {columnLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => setSelected(lead)}
                    className="cursor-grab gap-2 p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">{initialsOf(lead.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{lead.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {lead.company ?? lead.email ?? "—"}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {columnLeads.length === 0 && (
                  <p className="px-1 text-xs text-muted-foreground">Aucun contact</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailSheet lead={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
