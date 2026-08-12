"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadDetailSheet } from "@/components/features/lead-detail-sheet";
import type { LeadWithNotes } from "@/lib/supabase/queries";
import { channelLabels, formatDate, initialsOf, stageLabels, stageVariant } from "@/lib/leads-labels";

export function ContactsTable({ leads }: { leads: LeadWithNotes[] }) {
  const [selected, setSelected] = useState<LeadWithNotes | null>(null);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun contact pour l&apos;instant. Partage ta carte publique pour commencer à en
          recevoir.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Étape</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelected(lead)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>{initialsOf(lead.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.company ?? lead.email ?? "—"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {channelLabels[lead.channel]}
                </TableCell>
                <TableCell>
                  <Badge variant={stageVariant[lead.stage]}>{stageLabels[lead.stage]}</Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDate(lead.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadDetailSheet lead={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
