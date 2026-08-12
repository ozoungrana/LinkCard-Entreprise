"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

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
}: {
  slug: string;
  cardName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setUrl(`${window.location.origin}/c/${slug}`);
  }, [open, slug]);

  const qrUrl = url ? `${url}?channel=qr` : "";

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

        <div className="flex flex-col items-center gap-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
