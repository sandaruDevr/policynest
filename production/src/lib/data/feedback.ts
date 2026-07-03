import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SafeVoiceCategory, SafeVoiceSubmission } from "@/types";

const SAFE_VOICE_CATEGORIES: SafeVoiceCategory[] = [
  "near-miss",
  "improvement",
  "psychosocial",
  "facility",
  "other",
];

const SAFE_VOICE_STATUSES: SafeVoiceSubmission["status"][] = [
  "received",
  "reviewing",
  "actioned",
];

export interface FeedbackInput {
  category: string;
  message: string;
  anonymous?: boolean;
}

export interface SafeVoiceInput {
  category: "near-miss" | "improvement" | "psychosocial" | "facility" | "other";
  message: string;
  anonymous?: boolean;
}

/**
 * Submit feedback.
 */
export async function submitFeedback(input: FeedbackInput): Promise<{ id: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("feedback_submissions")
    .insert({
      tenant_id: profile.tenant_id,
      profile_id: input.anonymous ? null : user.id,
      category: input.category,
      message: input.message,
      anonymous: input.anonymous || false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

/**
 * List the signed-in user's non-anonymous Safe Voice submissions.
 *
 * Anonymous submissions store `profile_id = null` by design, so they are
 * intentionally excluded — they cannot be traced back to the submitter.
 */
export async function listSafeVoiceHistory(
  limit = 50,
): Promise<SafeVoiceSubmission[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("safe_voice_submissions")
    .select("id, category, message, anonymous, status, submitted_at")
    .eq("profile_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  return (rows || []).map((r) => ({
    id: r.id,
    submittedAt: r.submitted_at,
    category: SAFE_VOICE_CATEGORIES.includes(r.category as SafeVoiceCategory)
      ? (r.category as SafeVoiceCategory)
      : "other",
    message: r.message,
    anonymous: r.anonymous,
    status: SAFE_VOICE_STATUSES.includes(
      r.status as SafeVoiceSubmission["status"],
    )
      ? (r.status as SafeVoiceSubmission["status"])
      : "received",
  }));
}

/**
 * Submit safe-voice (anonymous by default).
 */
export async function submitSafeVoice(input: SafeVoiceInput): Promise<{ id: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("safe_voice_submissions")
    .insert({
      tenant_id: profile.tenant_id,
      profile_id: input.anonymous !== false ? null : user.id,
      category: input.category,
      message: input.message,
      anonymous: input.anonymous !== false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}
