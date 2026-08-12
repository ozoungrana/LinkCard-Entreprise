"use client";

import { Calendar, Mail, MapPin, Phone, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { LeadWithNotes } from "@/lib/supabase/queries";
import { formatDate, initialsOf } from "@/lib/leads-labels";

export function LeadDetailSheet({
  lead,
  onOpenChange,
}: {
  lead: LeadWithNotes | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent>
        {lead && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{initialsOf(lead.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{lead.name}</SheetTitle>
                  {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-4">
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium uppercase text-muted-foreground">Coordonnées</div>
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    {lead.email}
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    {lead.phone}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  Contexte de la rencontre
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  {formatDate(lead.created_at)}
                </div>
                {lead.meeting_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    {lead.meeting_location}
                  </div>
                )}
              </div>

              {lead.lead_notes.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-medium uppercase text-muted-foreground">Notes</div>
                    {lead.lead_notes.map((note) => (
                      <p key={note.id} className="text-sm">
                        {note.content}
                      </p>
                    ))}
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <Button>
                  <Calendar />
                  Programmer une relance
                </Button>
                <Button variant="outline">
                  <Upload />
                  Synchroniser vers le CRM
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
