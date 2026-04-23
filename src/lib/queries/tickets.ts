import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TicketWithDetails } from "@/types";

export const getTickets = cache(async (gymId: string): Promise<TicketWithDetails[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      athlete:athlete_id (
        id,
        profile:profiles(id, full_name)
      )
    `)
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return data || [];
});