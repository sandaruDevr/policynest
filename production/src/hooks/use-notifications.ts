"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationItem } from "@/types";

async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  const { data } = await res.json();
  return data;
}

async function markAsRead(id: string): Promise<boolean> {
  const res = await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  const { data } = await res.json();
  return data.success;
}

async function markAllAsRead(): Promise<boolean> {
  const res = await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error("Failed to mark all as read");
  const { data } = await res.json();
  return data.success;
}

export function useNotifications(initialData: NotificationItem[] = []) {
  const queryClient = useQueryClient();

  const { data: notifications = initialData } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    initialData,
    refetchInterval: 60 * 1000, // Poll every 60 seconds
    staleTime: 30 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}
