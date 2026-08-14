"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/features/contacts-table";
import { ContactsKanban } from "@/components/features/contacts-kanban";
import type { LeadWithNotes } from "@/lib/supabase/queries";
import type { Lead } from "@/lib/supabase/types";
import { channelLabels, stageLabels, stageOrder } from "@/lib/leads-labels";

type SortOption = "recent" | "ancien" | "nom_asc" | "nom_desc";

const sortLabels: Record<SortOption, string> = {
  recent: "Plus récent",
  ancien: "Plus ancien",
  nom_asc: "Nom (A→Z)",
  nom_desc: "Nom (Z→A)",
};

export function ContactsView({ leads }: { leads: LeadWithNotes[] }) {
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<Lead["channel"] | "all">("all");
  const [stage, setStage] = useState<Lead["stage"] | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");

  const hasActiveFilters = search.trim() !== "" || channel !== "all" || stage !== "all";

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = leads.filter((lead) => {
      if (channel !== "all" && lead.channel !== channel) return false;
      if (stage !== "all" && lead.stage !== stage) return false;
      if (query) {
        const haystack = [lead.name, lead.company, lead.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "ancien":
          return a.created_at.localeCompare(b.created_at);
        case "nom_asc":
          return a.name.localeCompare(b.name);
        case "nom_desc":
          return b.name.localeCompare(a.name);
        case "recent":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
  }, [leads, search, channel, stage, sort]);

  function resetFilters() {
    setSearch("");
    setChannel("all");
    setStage("all");
  }

  return (
    <Tabs defaultValue="liste">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="liste">
            <List />
            Liste
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <LayoutGrid />
            Pipeline
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 basis-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, une entreprise, un email…"
            className="pl-8"
          />
        </div>

        <Select value={channel} onValueChange={(v) => setChannel(v as Lead["channel"] | "all")}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les canaux</SelectItem>
            {Object.entries(channelLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stage} onValueChange={(v) => setStage(v as Lead["stage"] | "all")}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Étape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les étapes</SelectItem>
            {stageOrder.map((s) => (
              <SelectItem key={s} value={s}>
                {stageLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X />
            Réinitialiser
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filteredLeads.length} contact{filteredLeads.length !== 1 ? "s" : ""}
        </span>
      </div>

      <TabsContent value="liste">
        <ContactsTable leads={filteredLeads} />
      </TabsContent>
      <TabsContent value="pipeline">
        <ContactsKanban leads={filteredLeads} />
      </TabsContent>
    </Tabs>
  );
}
