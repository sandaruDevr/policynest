import { createClient } from "@/lib/supabase/server";
import type { SurveySummary } from "@/types";

export async function listSurveys(): Promise<SurveySummary[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  if (!profile) return [];

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  const { data: assignments } = await supabase
    .from("survey_assignments")
    .select("*")
    .eq("profile_id", userId);

  const assignmentMap = new Map(
    (assignments || []).map((a) => [a.survey_id, a])
  );

  return (surveys || []).map((s) => {
    const assignment = assignmentMap.get(s.id);
    const isCompleted = assignment?.status === "completed" || s.status === "completed";
    return {
      id: s.id,
      title: s.title,
      description: s.description || undefined,
      status: isCompleted ? "completed" : (s.status as SurveySummary["status"]),
      questionCount: s.question_count || 0,
      estimatedMinutes: s.estimated_minutes || 0,
      closesAt: s.closes_at || undefined,
      anonymous: s.anonymous || false,
      completedAt: assignment?.completed_at || undefined,
    };
  });
}
