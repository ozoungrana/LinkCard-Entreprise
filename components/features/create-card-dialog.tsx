"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createProfile } from "@/lib/actions/profiles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateCardDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("freelance");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Créer une carte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une carte</DialogTitle>
          <DialogDescription>
            Choisis un nom et un type de profil. Tu pourras tout personnaliser ensuite.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="new-card-name">Nom de la carte</FieldLabel>
            <Input
              id="new-card-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profil Entreprise"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-card-type">Type</FieldLabel>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="new-card-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entreprise">Entreprise</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="conference">Conférence</SelectItem>
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button
            disabled={!name.trim() || pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await createProfile(name.trim(), type);
                } catch (e) {
                  // Next's redirect() throws a tagged error to drive navigation —
                  // let it propagate instead of treating it as a real failure.
                  if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
                    throw e;
                  }
                  toast.error(e instanceof Error ? e.message : "Échec de la création");
                }
              })
            }
          >
            {pending ? "Création…" : "Créer et personnaliser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
