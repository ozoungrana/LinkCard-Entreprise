"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { navGroups } from "@/lib/nav";

const QUICK_ACTIONS = [
  { title: "Créer une carte", href: "/cards" },
  { title: "Voir mes contacts", href: "/contacts" },
  { title: "Gérer mon abonnement", href: "/account" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function handleToggleEvent() {
      setOpen((prev) => !prev);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleToggleEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleToggleEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const navItems = useMemo(() => navGroups.flatMap((g) => g.items), []);

  const q = query.trim().toLowerCase();
  const filteredNav = q ? navItems.filter((item) => item.title.toLowerCase().includes(q)) : navItems;
  const filteredActions = q
    ? QUICK_ACTIONS.filter((a) => a.title.toLowerCase().includes(q))
    : QUICK_ACTIONS;

  function go(href: string) {
    // CommandPalette lives in the persistent app layout and never unmounts
    // across navigations, unlike every other Dialog in this app. Calling
    // router.push in the same tick as setOpen(false) interrupts Radix's
    // close animation mid-flight (the navigation re-render cancels the
    // animationend event Radix waits for), leaving the dialog stuck visible
    // with data-state="closed". Deferring the navigation one tick lets the
    // close finish cleanly first.
    setOpen(false);
    setTimeout(() => router.push(href), 0);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Recherche</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page ou une action…"
            className="border-none px-0 shadow-none focus-visible:ring-0"
          />
          <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredNav.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                Pages
              </div>
              {filteredNav.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => go(item.href)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                Actions rapides
              </div>
              {filteredActions.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => go(action.href)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <Plus className="size-4 text-muted-foreground" />
                  {action.title}
                </button>
              ))}
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Aucun résultat pour « {query} ».
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
