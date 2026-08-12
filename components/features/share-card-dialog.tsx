"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Mail, Radio, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

// Web NFC (NDEFReader) isn't in TypeScript's DOM lib yet — only Chrome on
// Android implements it, behind a user gesture and a secure context.
type NdefWriter = { write: (message: { records: { recordType: string; data: string }[] }) => Promise<void> };
declare global {
  interface Window {
    NDEFReader?: new () => NdefWriter;
  }
}

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function buildSignatureHtml({
  url,
  cardName,
  jobTitle,
  company,
  phone,
  email,
  color,
}: {
  url: string;
  cardName: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  email?: string;
  color: string;
}) {
  const roleLine = [jobTitle, company].filter(Boolean).join(" · ");
  return `<table style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;border-collapse:collapse;">
  <tr>
    <td style="border-left:3px solid ${color};padding:4px 0 4px 12px;">
      <div style="font-weight:bold;font-size:14px;">${cardName}</div>
      ${roleLine ? `<div style="color:#6B7280;">${roleLine}</div>` : ""}
      <div style="margin-top:6px;">
        ${phone ? `<span>${phone}</span> · ` : ""}${email ? `<a href="mailto:${email}" style="color:${color};text-decoration:none;">${email}</a>` : ""}
      </div>
      <div style="margin-top:6px;">
        <a href="${url}" style="color:${color};text-decoration:none;font-weight:bold;">Voir ma carte digitale →</a>
      </div>
    </td>
  </tr>
</table>`;
}

export const CardQrThumbnail = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { slug: string; size?: number }
>(function CardQrThumbnail({ slug, size = 56, ...props }, ref) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/c/${slug}?channel=qr`);
  }, [slug]);

  return (
    <button
      ref={ref}
      type="button"
      className="shrink-0 rounded-md border bg-white p-1 transition-opacity hover:opacity-80"
      aria-label="Afficher et partager le QR Code"
      {...props}
    >
      {url ? (
        <QRCodeCanvas value={url} size={size} marginSize={0} level="M" />
      ) : (
        <div className="bg-muted" style={{ width: size, height: size }} />
      )}
    </button>
  );
});

export function ShareCardDialog({
  slug,
  cardName,
  trigger,
  jobTitle,
  company,
  phone,
  email,
  color = "#2563EB",
}: {
  slug: string;
  cardName: string;
  trigger?: React.ReactNode;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  color?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signatureCopied, setSignatureCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [nfcState, setNfcState] = useState<"idle" | "writing" | "success" | "error">("idle");
  const [nfcSupported, setNfcSupported] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNfcSupported(typeof window !== "undefined" && "NDEFReader" in window);
  }, []);

  useEffect(() => {
    if (open) setUrl(`${window.location.origin}/c/${slug}`);
  }, [open, slug]);

  const qrUrl = url ? `${url}?channel=qr` : "";
  const signatureHtml = url
    ? buildSignatureHtml({
        url: `${url}?channel=email_signature`,
        cardName,
        jobTitle: jobTitle ?? undefined,
        company: company ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
        color: color ?? "#2563EB",
      })
    : "";

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR Code téléchargé");
  }

  function copySignature() {
    navigator.clipboard.writeText(signatureHtml);
    setSignatureCopied(true);
    setTimeout(() => setSignatureCopied(false), 2000);
    toast.success("Code HTML copié — colle-le dans les paramètres de signature de ta messagerie");
  }

  async function writeNfcTag() {
    if (!window.NDEFReader) return;
    setNfcState("writing");
    try {
      const ndef = new window.NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: `${url}?channel=nfc` }] });
      setNfcState("success");
      toast.success("Puce NFC programmée");
    } catch (err) {
      setNfcState("error");
      toast.error(err instanceof Error ? err.message : "Échec de l'écriture NFC");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon-sm">
            <Share2 />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager « {cardName} »</DialogTitle>
          <DialogDescription>
            QR code dynamique — le contenu de la carte peut changer sans jamais changer ce code.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="qr">
          <TabsList className="w-full">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="nfc">NFC</TabsTrigger>
            <TabsTrigger value="signature">Signature email</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="flex flex-col items-center gap-4">
            <div ref={canvasRef} className="rounded-lg border bg-white p-4">
              {qrUrl && <QRCodeCanvas value={qrUrl} size={200} marginSize={0} level="M" />}
            </div>

            <div className="flex w-full items-center gap-2">
              <Input readOnly value={url} className="font-mono text-xs" />
              <Button variant="outline" size="icon-sm" onClick={copyLink} aria-label="Copier le lien">
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={downloadQr}>
              <Download />
              Télécharger le QR Code
            </Button>
          </TabsContent>

          <TabsContent value="nfc" className="flex flex-col items-center gap-4 py-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Radio className="size-7 text-muted-foreground" />
            </div>
            {nfcSupported ? (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Approche une puce NFC vierge (ou réinscriptible) du téléphone, puis lance
                  l&apos;écriture.
                </p>
                <Button className="w-full" disabled={nfcState === "writing"} onClick={writeNfcTag}>
                  {nfcState === "writing"
                    ? "En attente de la puce…"
                    : nfcState === "success"
                      ? "Puce programmée ✓"
                      : "Écrire sur la puce NFC"}
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                L&apos;écriture NFC nécessite Chrome sur Android (Web NFC). Ce navigateur/appareil
                ne la prend pas en charge.
              </p>
            )}
          </TabsContent>

          <TabsContent value="signature" className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Ajoute ce bloc à ta signature Gmail, Outlook ou autre — le lien pointe vers ta carte
              publique.
            </p>
            <div
              className="rounded-lg border bg-white p-4"
              // Preview only — this is our own generated HTML, not user input.
              dangerouslySetInnerHTML={{ __html: signatureHtml }}
            />
            <Button variant="outline" className="w-full" onClick={copySignature}>
              {signatureCopied ? <Check className="text-success" /> : <Mail />}
              Copier le code HTML
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
