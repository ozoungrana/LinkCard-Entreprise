"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Moon, Search, Sun } from "lucide-react";

import { logout } from "@/lib/actions/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { navGroups } from "@/lib/nav";
import type { AppNotification } from "@/lib/supabase/types";

const allItems = navGroups.flatMap((g) => g.items);

function initialsOf(input: string) {
  return (
    input
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function notificationText(n: AppNotification): string {
  const p = n.payload as Record<string, string | undefined>;
  switch (n.type) {
    case "lead_captured":
      return `${p.lead_name ?? "Un visiteur"} a enregistré son contact sur « ${p.profile_name ?? "ta carte"} »`;
    case "card_viewed":
      return `Ta carte « ${p.profile_name ?? ""} » a été vue`;
    case "workflow_failed":
      return `Le workflow « ${p.workflow_name ?? ""} » a échoué`;
    case "workflow_succeeded":
      return `Le workflow « ${p.workflow_name ?? ""} » s'est exécuté avec succès`;
    case "reminder_due":
      return p.message ?? "Rappel programmé";
    default:
      return p.message ?? "Notification";
  }
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function AppTopbar({
  user,
  notifications,
}: {
  user: { name: string; email: string };
  notifications: AppNotification[];
}) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const current =
    allItems.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))) ??
    allItems[0];

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function handleNotificationClick(n: AppNotification) {
    if (n.read_at) return;
    startTransition(async () => {
      await markNotificationRead(n.id);
      router.refresh();
    });
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold font-display">{current.title}</h1>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 text-muted-foreground sm:flex"
      >
        <Search className="size-4" />
        Rechercher…
        <kbd className="ml-2 rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Changer de thème"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 scale-100 dark:scale-0" />
        <Moon className="absolute size-4 scale-0 dark:scale-100" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline"
                onClick={handleMarkAllRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              Aucune notification pour l&apos;instant.
            </p>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-0.5"
                onSelect={() => handleNotificationClick(n)}
              >
                <span className="flex items-center gap-2 text-sm">
                  {!n.read_at && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  {notificationText(n)}
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="size-8">
              <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">Mon compte</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Aide & support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
