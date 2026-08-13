"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createLeadManually } from "@/lib/actions/leads";
import { getPendingLeads, removePendingLead } from "@/lib/offline-lead-queue";

export function OfflineLeadSync() {
  const syncing = useRef(false);
  const router = useRouter();

  useEffect(() => {
    async function flush() {
      if (syncing.current || !navigator.onLine) return;
      syncing.current = true;
      try {
        const pending = await getPendingLeads();
        if (pending.length === 0) return;

        let synced = 0;
        for (const { localId, ...payload } of pending) {
          const result = await createLeadManually(payload);
          if (!("error" in result)) {
            await removePendingLead(localId);
            synced++;
          }
        }

        if (synced > 0) {
          toast.success(
            `${synced} contact${synced > 1 ? "s" : ""} hors-ligne synchronisé${synced > 1 ? "s" : ""}.`
          );
          router.refresh();
        }
      } finally {
        syncing.current = false;
      }
    }

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [router]);

  return null;
}
