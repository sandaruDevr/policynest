import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";

export interface NamedCount {
  label: string;
  value: number;
}

export interface TrendPoint {
  date: string; // ISO day
  value: number;
}

export interface AdminAnalytics {
  documents: {
    total: number;
    byStatus: NamedCount[];
    expiringSoon: number;
    overdueReview: number;
  };
  acknowledgements: {
    requiredDocuments: number;
    expectedSignatures: number;
    completedSignatures: number;
    completionRate: number;
  };
  training: {
    totalAssignments: number;
    byStatus: NamedCount[];
    completionRate: number;
    overdue: number;
  };
  credentials: {
    total: number;
    valid: number;
    expiringSoon: number;
    expired: number;
  };
  incidents: {
    total: number;
    open: number;
    byType: NamedCount[];
    bySeverity: NamedCount[];
    trend: TrendPoint[];
  };
  surveys: {
    totalAssignments: number;
    completed: number;
    completionRate: number;
  };
  ai: {
    totalQueries: number;
    escalated: number;
    escalationRate: number;
    avgConfidence: number | null;
    pendingReviews: number;
  };
  sites: NamedCount[];
}

const EMPTY: AdminAnalytics = {
  documents: { total: 0, byStatus: [], expiringSoon: 0, overdueReview: 0 },
  acknowledgements: {
    requiredDocuments: 0,
    expectedSignatures: 0,
    completedSignatures: 0,
    completionRate: 0,
  },
  training: {
    totalAssignments: 0,
    byStatus: [],
    completionRate: 0,
    overdue: 0,
  },
  credentials: { total: 0, valid: 0, expiringSoon: 0, expired: 0 },
  incidents: { total: 0, open: 0, byType: [], bySeverity: [], trend: [] },
  surveys: { totalAssignments: 0, completed: 0, completionRate: 0 },
  ai: {
    totalQueries: 0,
    escalated: 0,
    escalationRate: 0,
    avgConfidence: null,
    pendingReviews: 0,
  },
  sites: [],
};

function tally(values: (string | null)[]): NamedCount[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v || "unspecified";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Build a 30-day daily trend from a list of ISO timestamps. */
function buildTrend(dates: string[], days = 30): TrendPoint[] {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const iso of dates) {
    const key = iso.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    value,
  }));
}

/**
 * Aggregate real, tenant-scoped operational analytics. Every query is
 * independent and tenant-filtered; failures degrade to empty rather than
 * breaking the page.
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const admin = await requireAdmin();
  if (!admin) return EMPTY;

  const supabase = createClient();
  const tenantId = admin.tenantId;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in30Str = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    documentsRes,
    profilesRes,
    sitesRes,
    acksRes,
    trainingRes,
    credentialsRes,
    incidentsRes,
    surveysRes,
    aiLogsRes,
    pendingHitlRes,
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("status, expiry_date, review_due_at, acknowledgement_required")
      .eq("tenant_id", tenantId),
    supabase
      .from("profiles")
      .select("id, site_id, status")
      .eq("tenant_id", tenantId),
    supabase.from("sites").select("id, name").eq("tenant_id", tenantId),
    supabase
      .from("document_acknowledgements")
      .select("profile_id, document_id")
      .eq("tenant_id", tenantId),
    supabase
      .from("training_assignments")
      .select("status, due_at, completed_at")
      .eq("tenant_id", tenantId),
    supabase
      .from("credentials")
      .select("status, expires_at, required")
      .eq("tenant_id", tenantId),
    supabase
      .from("incidents")
      .select("incident_type, severity, status, created_at")
      .eq("tenant_id", tenantId),
    supabase
      .from("survey_assignments")
      .select("status, completed_at")
      .eq("tenant_id", tenantId),
    supabase
      .from("rag_audit_logs")
      .select("confidence, escalated")
      .eq("tenant_id", tenantId)
      .gte("created_at", since30),
    supabase
      .from("hitl_queue")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "pending"),
  ]);

  // --- Documents ---
  const docs = documentsRes.data || [];
  const activeProfiles = (profilesRes.data || []).filter(
    (p) => p.status !== "inactive",
  );
  const docExpiring = docs.filter(
    (d) =>
      (d.status === "published" || d.status === "approved") &&
      d.expiry_date &&
      d.expiry_date >= todayStr &&
      d.expiry_date <= in30Str,
  ).length;
  const docOverdueReview = docs.filter(
    (d) => d.review_due_at && d.review_due_at < todayStr,
  ).length;

  // --- Acknowledgements ---
  const requiredDocs = docs.filter(
    (d) => d.acknowledgement_required && d.status === "published",
  ).length;
  const expectedSignatures = requiredDocs * activeProfiles.length;
  const completedSignatures = (acksRes.data || []).length;

  // --- Training ---
  const training = trainingRes.data || [];
  const trainingCompleted = training.filter(
    (t) => t.status === "completed",
  ).length;
  const trainingOverdue = training.filter(
    (t) => t.status !== "completed" && t.due_at && t.due_at < todayStr,
  ).length;

  // --- Credentials ---
  const creds = credentialsRes.data || [];
  let credValid = 0;
  let credExpiring = 0;
  let credExpired = 0;
  for (const c of creds) {
    if (!c.expires_at) {
      credValid++;
      continue;
    }
    const exp = c.expires_at.slice(0, 10);
    if (exp < todayStr) credExpired++;
    else if (exp <= in30Str) credExpiring++;
    else credValid++;
  }

  // --- Incidents ---
  const incidents = incidentsRes.data || [];
  const incidentsOpen = incidents.filter(
    (i) => i.status === "submitted" || i.status === "reviewing",
  ).length;

  // --- Surveys ---
  const surveys = surveysRes.data || [];
  const surveysCompleted = surveys.filter(
    (s) => s.status === "completed",
  ).length;

  // --- AI ---
  const aiLogs = aiLogsRes.data || [];
  const aiEscalated = aiLogs.filter((l) => l.escalated).length;
  const aiConfidences = aiLogs
    .map((l) => l.confidence)
    .filter((c): c is number => typeof c === "number");
  const aiAvg =
    aiConfidences.length > 0
      ? aiConfidences.reduce((a, b) => a + b, 0) / aiConfidences.length
      : null;

  // --- Sites (active users per site) ---
  const siteNames = new Map<string, string>();
  for (const s of sitesRes.data || []) siteNames.set(s.id, s.name);
  const siteCounts = new Map<string, number>();
  for (const p of activeProfiles) {
    if (p.site_id) siteCounts.set(p.site_id, (siteCounts.get(p.site_id) || 0) + 1);
  }
  const sites: NamedCount[] = Array.from(siteNames.entries())
    .map(([id, name]) => ({ label: name, value: siteCounts.get(id) || 0 }))
    .sort((a, b) => b.value - a.value);

  return {
    documents: {
      total: docs.length,
      byStatus: tally(docs.map((d) => d.status)),
      expiringSoon: docExpiring,
      overdueReview: docOverdueReview,
    },
    acknowledgements: {
      requiredDocuments: requiredDocs,
      expectedSignatures,
      completedSignatures,
      completionRate:
        expectedSignatures > 0
          ? Math.min(1, completedSignatures / expectedSignatures)
          : 0,
    },
    training: {
      totalAssignments: training.length,
      byStatus: tally(training.map((t) => t.status)),
      completionRate:
        training.length > 0 ? trainingCompleted / training.length : 0,
      overdue: trainingOverdue,
    },
    credentials: {
      total: creds.length,
      valid: credValid,
      expiringSoon: credExpiring,
      expired: credExpired,
    },
    incidents: {
      total: incidents.length,
      open: incidentsOpen,
      byType: tally(incidents.map((i) => i.incident_type)),
      bySeverity: tally(incidents.map((i) => i.severity)),
      trend: buildTrend(incidents.map((i) => i.created_at)),
    },
    surveys: {
      totalAssignments: surveys.length,
      completed: surveysCompleted,
      completionRate: surveys.length > 0 ? surveysCompleted / surveys.length : 0,
    },
    ai: {
      totalQueries: aiLogs.length,
      escalated: aiEscalated,
      escalationRate: aiLogs.length > 0 ? aiEscalated / aiLogs.length : 0,
      avgConfidence: aiAvg,
      pendingReviews: pendingHitlRes.count ?? 0,
    },
    sites,
  };
}
