"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleWorkflow } from "@/lib/actions/workflows";
import { Switch } from "@/components/ui/switch";

export function WorkflowToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Switch
      checked={isActive}
      disabled={pending}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          const result = await toggleWorkflow(id, checked);
          if (result?.error) {
            toast.error(result.error);
            return;
          }
          router.refresh();
        })
      }
    />
  );
}
