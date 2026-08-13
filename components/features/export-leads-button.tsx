"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/lib/csv";
import { channelLabels, formatDate, stageLabels } from "@/lib/leads-labels";
import type { Lead } from "@/lib/supabase/types";

export function ExportLeadsButton({ leads }: { leads: Lead[] }) {
  function handleExport() {
    const header = ["Nom", "Entreprise", "Email", "Téléphone", "Canal", "Étape", "Créé le"];
    const rows = leads.map((l) => [
      l.name,
      l.company ?? "",
      l.email ?? "",
      l.phone ?? "",
      channelLabels[l.channel],
      stageLabels[l.stage],
      formatDate(l.created_at),
    ]);
    // Leading BOM so Excel detects UTF-8 and renders accented characters correctly.
    const BOM = String.fromCharCode(0xfeff);
    const csv = BOM + toCsv([header, ...rows]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={leads.length === 0}>
      <Download />
      Exporter
    </Button>
  );
}
