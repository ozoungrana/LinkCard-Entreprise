"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateOrganizationBranding } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Organization } from "@/lib/supabase/types";

export function BrandingForm({ organization }: { organization: Organization }) {
  const [primary, setPrimary] = useState(organization.brand_primary_color ?? "#2563EB");
  const [secondary, setSecondary] = useState(organization.brand_secondary_color ?? "#06B6D4");
  const [locked, setLocked] = useState(organization.layout_locked);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateOrganizationBranding({
          brand_primary_color: primary,
          brand_secondary_color: secondary,
          layout_locked: locked,
        });
        toast.success("Charte graphique enregistrée");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Couleur primaire / secondaire</FieldLabel>
        <div className="flex gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="size-6 shrink-0 rounded-md" style={{ background: primary }} />
            <Input value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <div className="size-6 shrink-0 rounded-md" style={{ background: secondary }} />
            <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </div>
        </div>
      </Field>

      <div className="flex items-center justify-between gap-4 py-2">
        <div>
          <div className="text-sm font-medium">Verrouiller la mise en page</div>
          <div className="text-xs text-muted-foreground">
            Les utilisateurs ne peuvent modifier que leurs informations, pas le design
          </div>
        </div>
        <Switch checked={locked} onCheckedChange={setLocked} />
      </div>

      <Button className="w-fit" disabled={pending} onClick={handleSave}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
