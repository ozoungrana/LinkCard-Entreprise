"use client";

import { useState } from "react";
import { Calendar, Mail, MapPin, Phone, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { Lead } from "@/lib/supabase/types";
import type { LeadWithNotes } from "@/lib/supabase/queries";

const stageLabels: Record<Lead["stage"], string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  qualifie: "Qualifié",
  proposition: "Proposition",
  client: "Client",
  perdu: "Perdu",
};

const stageVariant: Record<Lead["stage"], "default" | "secondary" | "outline" | "destructive"> = {
  nouveau: "outline",
  contacte: "secondary",
  qualifie: "secondary",
  proposition: "default",
  client: "default",
  perdu: "destructive",
};

const channelLabels: Record<Lead["channel"], string> = {
  qr: "QR Code",
  nfc: "NFC",
  email_signature: "Signature email",
  lien_direct: "Lien direct",
  ocr: "OCR",
  import_csv: "Import CSV",
};

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{initialsOf(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selected.name}</SheetTitle>
                    {selected.company && (
                      <p className="text-xs text-muted-foreground">{selected.company}</p>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Coordonnées
                  </div>
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      {selected.email}
                    </div>
                  )}
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      {selected.phone}
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
                    {formatDate(selected.created_at)}
                  </div>
                  {selected.meeting_location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-4 text-muted-foreground" />
                      {selected.meeting_location}
                    </div>
                  )}
                </div>

                {selected.lead_notes.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Notes
                      </div>
                      {selected.lead_notes.map((note) => (
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
    </>
  );
}
