import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CoachWithProfile } from "@/types";

export const getCoaches = cache(async (gymId: string): Promise<CoachWithProfile[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select(`
      *,
      profile:profiles(id, full_name, email, phone)
    `)
    .eq("gym_id", gymId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching coaches:", error);
    return [];
  }

  return data || [];
});