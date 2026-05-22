import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AthleteWithProfile } from "@/types";
import { computeAthleteStatus } from "@/lib/athletes";

export const getAthletes = cache(async (gymId: string): Promise<AthleteWithProfile[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athletes")
    .select(`
      *,
      profile:profiles(id, full_name, email, phone),
      membership:memberships(*, plan:membership_plans(*))
    `)
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching athletes:", error);
    return [];
  }

  return (data || []).map((athlete) => ({
    ...athlete,
    computed_status: computeAthleteStatus(athlete),
  }));
});

export { getMembershipPlans } from "./memberships";