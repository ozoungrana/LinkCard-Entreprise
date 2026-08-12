"use client";

import { LayoutGrid, List } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTable } from "@/components/features/contacts-table";
import { ContactsKanban } from "@/components/features/contacts-kanban";
import type { LeadWithNotes } from "@/lib/supabase/queries";

export function ContactsView({ leads }: { leads: LeadWithNotes[] }) {
  return (
    <Tabs defaultValue="liste">
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
      <TabsContent value="liste">
        <ContactsTable leads={leads} />
      </TabsContent>
      <TabsContent value="pipeline">
        <ContactsKanban leads={leads} />
      </TabsContent>
    </Tabs>
  );
}
