import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";

export interface DashboardDocument {
  id: string;
  title: string;
  status: string;
  version: string;
  updatedAt: string;
  expiryDate: string | null;
}

export interface AdminDashboard {
  documents: {
    total: number;
    published: number;
    inReview: number;
    draft: number;
    archived: number;
  };
  pendingReviews: DashboardDocument[];
  upcomingExpiries: DashboardDocument[];
  people: {
    users: number;
    sites: number;
  };
  incidents: {
    open: number;
  };
  acknowledgements: {
    requiredDocuments: number;
  };
}

const EMPTY: AdminDashboard = {
  documents: { total: 0, published: 0, inReview: 0, draft: 0, archived: 0 },
  pendingReviews: [],
  upcomingExpiries: [],
  people: { users: 0, sites: 0 },
  incidents: { open: 0 },
  acknowledgements: { requiredDocuments: 0 },
};

/**
 * Aggregate real, tenant-scoped operational metrics for the admin dashboard.
 * Every query is independent and tenant-filtered; failures degrade to zero
 * rather than breaking the page.
 */
export async function getAdminDashboard(): Promise<AdminDashboard> {
  const admin = await requireAdmin();
  if (!admin) return EMPTY;

  const supabase = createClient();
  const tenantId = admin.tenantId;
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [
    documentsRes,
    usersRes,
    sitesRes,
    incidentsRes,
    pendingRes,
    expiriesRes,
    ackReqRes,
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("status")
      .eq("tenant_id", tenantId),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["submitted", "reviewing"]),
    supabase
      .from("documents")
      .select("id, title, status, version, updated_at, expiry_date")
      .eq("tenant_id", tenantId)
      .eq("status", "in_review")
      .order("updated_at", { ascending: true })
      .limit(6),
    supabase
      .from("documents")
      .select("id, title, status, version, updated_at, expiry_date")
      .eq("tenant_id", tenantId)
      .in("status", ["published", "approved"])
      .not("expiry_date", "is", null)
      .gte("expiry_date", todayStr)
      .lte("expiry_date", in30)
      .order("expiry_date", { ascending: true })
      .limit(6),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("acknowledgement_required", true)
      .eq("status", "published"),
  ]);

  const statuses = documentsRes.data || [];
  const countBy = (s: string) =>
    statuses.filter((d) => d.status === s).length;

  const mapDoc = (d: {
    id: string;
    title: string;
    status: string;
    version: string;
    updated_at: string;
    expiry_date: string | null;
  }): DashboardDocument => ({
    id: d.id,
    title: d.title,
    status: d.status,
    version: d.version,
    updatedAt: d.updated_at,
    expiryDate: d.expiry_date,
  });

  return {
    documents: {
      total: statuses.length,
      published: countBy("published"),
      inReview: countBy("in_review"),
      draft: countBy("draft"),
      archived: countBy("archived"),
    },
    pendingReviews: (pendingRes.data || []).map(mapDoc),
    upcomingExpiries: (expiriesRes.data || []).map(mapDoc),
    people: {
      users: usersRes.count ?? 0,
      sites: sitesRes.count ?? 0,
    },
    incidents: {
      open: incidentsRes.count ?? 0,
    },
    acknowledgements: {
      requiredDocuments: ackReqRes.count ?? 0,
    },
  };
}
