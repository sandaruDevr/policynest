import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Users,
  Building2,
  BarChart3,
  GraduationCap,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { type SystemRole } from "@/types/admin";

export interface AdminRouteEntry {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  group: "overview" | "governance" | "organization" | "insights";
  description?: string;
  /** If set, only these roles can access this route. If undefined, all admins can access. */
  roles?: SystemRole[];
}

/** Single source of truth for Organization Admin navigation. */
export const ADMIN_ROUTES: AdminRouteEntry[] = [
  {
    key: "dashboard",
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "overview",
    description: "Operational readiness at a glance",
  },
  {
    key: "documents",
    href: "/admin/documents",
    label: "Documents",
    icon: FileText,
    group: "governance",
    description: "Policy & procedure governance",
  },
  {
    key: "governance",
    href: "/admin/governance",
    label: "AI Governance",
    icon: ShieldCheck,
    group: "governance",
    description: "Validation, HITL & golden answers",
  },
  {
    key: "audit",
    href: "/admin/audit",
    label: "Audit & Compliance",
    icon: ScrollText,
    group: "governance",
    description: "Audit trail & readiness",
  },
  {
    key: "users",
    href: "/admin/users",
    label: "Users & Roles",
    icon: Users,
    group: "organization",
    description: "Workforce access management",
    roles: ["organisation_admin", "platform_admin"],
  },
  {
    key: "sites",
    href: "/admin/sites",
    label: "Sites",
    icon: Building2,
    group: "organization",
    description: "Locations & applicability",
    roles: ["organisation_admin", "platform_admin"],
  },
  {
    key: "reports",
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    group: "insights",
    description: "Analytics & exports",
  },
  {
    key: "training",
    href: "/admin/training",
    label: "Training & Surveys",
    icon: GraduationCap,
    group: "insights",
    description: "Workforce enablement",
  },
];

export const ADMIN_ROUTE_GROUPS: Record<AdminRouteEntry["group"], string> = {
  overview: "Overview",
  governance: "Governance",
  organization: "Organization",
  insights: "Insights",
};
