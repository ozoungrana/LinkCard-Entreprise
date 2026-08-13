import Link from "next/link";
import { Download, Lock, ScanLine, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddLeadDialog } from "@/components/features/add-lead-dialog";
import { ContactsView } from "@/components/features/contacts-view";
import { getCurrentOrganization, getMyLeads, type LeadWithNotes } from "@/lib/supabase/queries";

// Chapter 10 §2/§4 — Free is capped at 5 captured contacts/month. The
// reciprocal form on the public card must never refuse a visitor, so the
// lead is still stored; only the owner's view past the 5th of the month is
// locked here, with an upsell hint instead of a hard error.
const FREE_MONTHLY_CONTACT_LIMIT = 5;

function partitionForFreePlan(leads: LeadWithNotes[]) {
  const now = new Date();
  const isThisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const thisMonth = leads.filter((l) => isThisMonth(l.created_at));
  const thisMonthAsc = [...thisMonth].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const visibleIds = new Set(thisMonthAsc.slice(0, FREE_MONTHLY_CONTACT_LIMIT).map((l) => l.id));

  const visible = leads.filter((l) => !isThisMonth(l.created_at) || visibleIds.has(l.id));
  const lockedCount = thisMonth.length - visibleIds.size;

  return { visible, lockedCount };
}

export default async function ContactsPage() {
  const [organization, allLeads] = await Promise.all([getCurrentOrganization(), getMyLeads()]);

  const isFree = organization?.plan === "free";
  const { visible: leads, lockedCount } = isFree
    ? partitionForFreePlan(allLeads)
    : { visible: allLeads, lockedCount: 0 };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold font-display">Contacts ({leads.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Upload />
            Importer CSV
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download />
            Exporter
          </Button>
          <Button variant="outline" size="sm" disabled>
            <ScanLine />
            Scanner une carte
          </Button>
          <AddLeadDialog />
        </div>
      </div>

      {lockedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
          <Lock className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">
            Le plan Free est limité à {FREE_MONTHLY_CONTACT_LIMIT} contacts par mois. {lockedCount}{" "}
            contact{lockedCount > 1 ? "s" : ""} supplémentaire{lockedCount > 1 ? "s" : ""} ce
            mois-ci {lockedCount > 1 ? "sont" : "est"} déjà enregistré
            {lockedCount > 1 ? "s" : ""} et t&apos;attend{lockedCount > 1 ? "ent" : ""}.
          </span>
          <Button asChild size="sm">
            <Link href="/account">Passer à Pro</Link>
          </Button>
        </div>
      )}

      <ContactsView leads={leads} />
    </div>
  );
}
