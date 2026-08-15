import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/features/app-sidebar";
import { AppTopbar } from "@/components/features/app-topbar";
import { CommandPalette } from "@/components/features/command-palette";
import { OfflineLeadSync } from "@/components/features/offline-lead-sync";
import {
  getCurrentOrganization,
  getCurrentUser,
  getIsPlatformAdmin,
  getMyNotifications,
  getOrganizationMembers,
} from "@/lib/supabase/queries";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, organization, notifications, isPlatformAdmin] = await Promise.all([
    getCurrentUser(),
    getCurrentOrganization(),
    getMyNotifications(),
    getIsPlatformAdmin(),
  ]);
  const members = organization ? await getOrganizationMembers(organization.id) : [];
  const activeSeats = members.filter((m) => m.status === "active").length;

  const sidebarUser = {
    name: user?.name ?? user?.email ?? "Utilisateur",
    email: user?.email ?? "",
  };
  const sidebarPlan = organization
    ? {
        label: PLAN_LABELS[organization.plan] ?? organization.plan,
        seatsUsed: activeSeats,
        seatsLimit: organization.seats_limit,
      }
    : null;

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} plan={sidebarPlan} isPlatformAdmin={isPlatformAdmin} />
      <SidebarInset>
        <AppTopbar user={sidebarUser} notifications={notifications} />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
      <CommandPalette />
      <OfflineLeadSync />
    </SidebarProvider>
  );
}
