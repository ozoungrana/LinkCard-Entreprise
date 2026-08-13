import {
  LayoutDashboard,
  IdCard,
  Users,
  BarChart3,
  Workflow,
  Building2,
  Settings,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Espace de travail",
    items: [
      { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { title: "Mes cartes", href: "/cards", icon: IdCard },
      { title: "Contacts", href: "/contacts", icon: Users },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Automatisations", href: "/automations", icon: Workflow },
    ],
  },
  {
    label: "Administration",
    items: [{ title: "Équipe & Admin", href: "/admin", icon: Building2 }],
  },
  {
    label: "Compte",
    items: [
      { title: "Guide utilisateur", href: "/guide", icon: BookOpen },
      { title: "Mon compte", href: "/account", icon: Settings },
    ],
  },
];
