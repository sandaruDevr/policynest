import {
  LayoutDashboard,
  Building2,
  FileStack,
  Brain,
  ShieldCheck,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface PlatformRouteEntry {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  group: "overview" | "governance" | "intelligence" | "operations";
  description?: string;
}

/**
 * Single source of truth for Super Admin (platform) navigation.
 * Phases 1–14 map to these groups. Routes are added incrementally as
 * each phase ships — only Phase 1 (Dashboard) is live today.
 */
export const PLATFORM_ROUTES: PlatformRouteEntry[] = [
  {
    key: "dashboard",
    href: "/platform",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "overview",
    description: "Platform health & growth at a glance",
  },
  {
    key: "tenants",
    href: "/platform/tenants",
    label: "Tenants",
    icon: Building2,
    group: "overview",
    description: "Organization lifecycle & provisioning",
  },
  {
    key: "templates",
    href: "/platform/templates",
    label: "Master Templates",
    icon: FileStack,
    group: "governance",
    description: "Platform template library & lineage",
  },
  {
    key: "ai-governance",
    href: "/platform/ai-governance",
    label: "AI Governance",
    icon: Brain,
    group: "governance",
    description: "Model registry, prompts & evaluation",
  },
  {
    key: "hitl",
    href: "/platform/hitl",
    label: "HITL Center",
    icon: ShieldCheck,
    group: "governance",
    description: "Cross-tenant review queues & golden answers",
  },
  {
    key: "audit",
    href: "/platform/audit",
    label: "Audit & Security",
    icon: ScrollText,
    group: "operations",
    description: "Platform audit trail & security events",
  },
];

export const PLATFORM_ROUTE_GROUPS: Record<PlatformRouteEntry["group"], string> = {
  overview: "Overview",
  governance: "Governance",
  intelligence: "Intelligence",
  operations: "Operations",
};
