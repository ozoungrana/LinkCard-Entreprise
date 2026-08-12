import type { Lead } from "@/lib/supabase/types";

export const stageOrder: Lead["stage"][] = [
  "nouveau",
  "contacte",
  "qualifie",
  "proposition",
  "client",
  "perdu",
];

export const stageLabels: Record<Lead["stage"], string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  qualifie: "Qualifié",
  proposition: "Proposition",
  client: "Client",
  perdu: "Perdu",
};

export const stageVariant: Record<Lead["stage"], "default" | "secondary" | "outline" | "destructive"> = {
  nouveau: "outline",
  contacte: "secondary",
  qualifie: "secondary",
  proposition: "default",
  client: "default",
  perdu: "destructive",
};

export const channelLabels: Record<Lead["channel"], string> = {
  qr: "QR Code",
  nfc: "NFC",
  email_signature: "Signature email",
  lien_direct: "Lien direct",
  ocr: "OCR",
  import_csv: "Import CSV",
};

export function initialsOf(name: string) {
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

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
