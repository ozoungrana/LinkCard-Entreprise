"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Mail, MapPin, Phone, Trash2, Upload } from "lucide-react";

import { deleteLead } from "@/lib/actions/leads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [pending, startTransition] = useTransition();
  const [alertOpen, setAlertOpen] = useState(false);
  const router = useRouter();

  function submitDelete() {
    if (!lead) return;
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Contact supprimé");
      setAlertOpen(false);
      onOpenChange(false);
      router.refresh();
    });
  }

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

                <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-danger hover:text-danger">
                      <Trash2 />
                      Supprimer le contact
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer « {lead.name} » ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est définitive. Les notes associées à ce contact seront
                        supprimées aussi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button variant="destructive" disabled={pending} onClick={submitDelete}>
                          {pending ? "Suppression…" : "Supprimer définitivement"}
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
