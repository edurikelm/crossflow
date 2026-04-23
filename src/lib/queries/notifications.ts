import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";

export const getNotifications = cache(async (gymId: string): Promise<Notification[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
});