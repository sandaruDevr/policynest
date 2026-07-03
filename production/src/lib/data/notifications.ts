import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/types/notifications";

/**
 * Fetch notifications for the current user.
 *
 * Returns unread notifications first, then read notifications, ordered by date.
 */
export async function list(): Promise<NotificationItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", user.id)
    .order("read", { ascending: true })
    .order("at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((n) => ({
    id: n.id,
    category: n.category as NotificationItem["category"],
    level: n.level as NotificationItem["level"],
    title: n.title,
    body: n.body || undefined,
    at: n.at,
    read: n.read,
    href: n.href || undefined,
    actionLabel: n.action_label || undefined,
  }));
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(id: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("profile_id", user.id);

  return !error;
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("profile_id", user.id)
    .eq("read", false);

  return !error;
}
