"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { importLeadsCsv, type ImportLeadRow } from "@/lib/actions/leads";
import { parseCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NAME_ALIASES = ["nom", "nom complet", "name", "full name"];
const COMPANY_ALIASES = ["entreprise", "société", "societe", "company"];
const EMAIL_ALIASES = ["email", "e-mail", "mail"];
const PHONE_ALIASES = ["téléphone", "telephone", "tel", "phone"];

function findColumn(header: string[], aliases: string[]) {
  const normalized = header.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function ImportLeadsDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportLeadRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setFileName(null);
    setRows(null);
    setParseError(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setRows(null);

    file.text().then((text) => {
      const table = parseCsv(text);
      if (table.length < 2) {
        setParseError("Le fichier est vide ou ne contient pas de ligne de données.");
        return;
      }
      const [header, ...dataRows] = table;
      const nameIdx = findColumn(header, NAME_ALIASES);
      if (nameIdx === -1) {
        setParseError(
          'Colonne "Nom" introuvable. Colonnes attendues : Nom, Entreprise, Email, Téléphone.'
        );
        return;
      }
      const companyIdx = findColumn(header, COMPANY_ALIASES);
      const emailIdx = findColumn(header, EMAIL_ALIASES);
      const phoneIdx = findColumn(header, PHONE_ALIASES);

      const parsed = dataRows
        .map((r) => ({
          name: r[nameIdx]?.trim() ?? "",
          company: companyIdx !== -1 ? r[companyIdx]?.trim() : undefined,
          email: emailIdx !== -1 ? r[emailIdx]?.trim() : undefined,
          phone: phoneIdx !== -1 ? r[phoneIdx]?.trim() : undefined,
        }))
        .filter((r) => r.name);

      if (parsed.length === 0) {
        setParseError("Aucune ligne avec un nom valide n'a été trouvée.");
        return;
      }
      setRows(parsed);
    });
  }

  function submit() {
    if (!rows || rows.length === 0) return;
    startTransition(async () => {
      const result = await importLeadsCsv(rows);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${result.imported} contact${result.imported > 1 ? "s" : ""} importé${
          result.imported > 1 ? "s" : ""
        }` +
          (result.skipped > 0
            ? ` (${result.skipped} ligne${result.skipped > 1 ? "s" : ""} ignorée${
                result.skipped > 1 ? "s" : ""
              } sans nom)`
            : "")
      );
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload />
          Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des contacts</DialogTitle>
          <DialogDescription>
            Fichier CSV avec une ligne d&apos;en-têtes : Nom (obligatoire), Entreprise, Email,
            Téléphone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            {fileName ?? "Choisir un fichier .csv"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
          {parseError && <p className="text-sm text-danger">{parseError}</p>}
          {rows && (
            <p className="text-sm text-muted-foreground">
              {rows.length} contact{rows.length > 1 ? "s" : ""} prêt{rows.length > 1 ? "s" : ""} à
              importer.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button disabled={!rows || rows.length === 0 || pending} onClick={submit}>
            {pending ? "Import…" : "Importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
