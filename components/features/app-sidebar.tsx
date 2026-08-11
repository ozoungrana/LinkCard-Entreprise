"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { navGroups } from "@/lib/nav";

type SidebarUser = { name: string; email: string };
type SidebarPlan = { label: string; seatsUsed: number; seatsLimit: number | null } | null;

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

export function AppSidebar({ user, plan }: { user: SidebarUser; plan: SidebarPlan }) {
  const pathname = usePathname();
  const seatsPct =
    plan?.seatsLimit && plan.seatsLimit > 0
      ? Math.min(100, (plan.seatsUsed / plan.seatsLimit) * 100)
      : 100;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </div>
          <span className="font-display text-sm font-semibold group-data-[collapsible=icon]:hidden">
            LinkCard
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {plan && (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
            <div className="text-xs text-muted-foreground">Plan actuel</div>
            <div className="text-sm font-semibold">{plan.label}</div>
            {plan.seatsLimit && (
              <>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${seatsPct}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {plan.seatsUsed} / {plan.seatsLimit} sièges utilisés
                </div>
              </>
            )}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/account">
                <Avatar className="size-6">
                  <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
