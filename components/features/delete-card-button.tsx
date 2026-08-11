"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteProfile } from "@/lib/actions/profiles";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function DeleteCardMenuItem({ cardId, cardName }: { cardId: string; cardName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
          <Trash2 />
          Supprimer
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {cardName} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive. La carte, sa page publique et son historique de
            versions seront supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(() => deleteProfile(cardId))}
            >
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
