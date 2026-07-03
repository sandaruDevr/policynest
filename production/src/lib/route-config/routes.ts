import {
  Home,
  Sparkles,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Siren,
  Star,
  ShieldCheck,
  MessageCircle,
  History,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface RouteEntry {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Group for sectioning the sidebar. */
  group: "primary" | "operations" | "personal";
  /** When true, surfaced in the mobile bottom-bar (max 5 entries). */
  mobilePrimary?: boolean;
}

/** Single source of truth for the staff app navigation. */
export const STAFF_ROUTES: RouteEntry[] = [
  {
    key: "home",
    href: "/app/home",
    label: "Home",
    icon: Home,
    group: "primary",
    mobilePrimary: true,
  },
  {
    key: "assistant",
    href: "/app/assistant",
    label: "Assistant",
    icon: Sparkles,
    group: "primary",
    mobilePrimary: true,
  },
  {
    key: "library",
    href: "/app/library",
    label: "Library",
    icon: BookOpen,
    group: "operations",
    mobilePrimary: true,
  },
  {
    key: "training",
    href: "/app/training",
    label: "Training",
    icon: GraduationCap,
    group: "operations",
  },
  {
    key: "incidents",
    href: "/app/incidents",
    label: "Incidents",
    icon: AlertTriangle,
    group: "operations",
  },
  {
    key: "emergency",
    href: "/app/emergency",
    label: "Emergency",
    icon: Siren,
    group: "operations",
    mobilePrimary: true,
  },
  {
    key: "quick-reference",
    href: "/app/quick-reference",
    label: "Quick Reference",
    icon: Star,
    group: "personal",
  },
  {
    key: "compliance",
    href: "/app/compliance",
    label: "My Compliance",
    icon: ShieldCheck,
    group: "personal",
  },
  {
    key: "feedback",
    href: "/app/feedback",
    label: "Feedback",
    icon: MessageCircle,
    group: "personal",
  },
  {
    key: "history",
    href: "/app/history",
    label: "History",
    icon: History,
    group: "personal",
  },
  {
    key: "profile",
    href: "/app/profile",
    label: "Profile",
    icon: UserRound,
    group: "personal",
  },
];

export const ROUTE_GROUPS: Record<RouteEntry["group"], string> = {
  primary: "Workspace",
  operations: "Operations",
  personal: "Personal",
};
