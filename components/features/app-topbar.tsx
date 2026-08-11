"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Moon, Search, Sun } from "lucide-react";

import { logout } from "@/lib/actions/auth";
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

const notifications = [
  { title: "Sophie Durand a enregistré votre contact", time: "il y a 2h", unread: true },
  { title: "Le workflow « Sync HubSpot » a échoué", time: "Hier, 18:47", unread: true },
  { title: "Votre carte a été vue 23 fois", time: "il y a 1j", unread: false },
];

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

export function AppTopbar({ user }: { user: { name: string; email: string } }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const current =
    allItems.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))) ??
    allItems[0];

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
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            <span className="text-xs font-normal text-primary">Tout marquer comme lu</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.map((n) => (
            <DropdownMenuItem key={n.title} className="flex flex-col items-start gap-0.5">
              <span className="flex items-center gap-2 text-sm">
                {n.unread && <span className="size-1.5 rounded-full bg-primary" />}
                {n.title}
              </span>
              <span className="text-xs text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))}
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
