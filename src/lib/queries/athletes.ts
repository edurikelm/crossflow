import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AthleteWithProfile, MembershipPlan } from "@/types";

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

  return data || [];
});

export const getMembershipPlans = cache(async (gymId: string): Promise<MembershipPlan[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("gym_id", gymId)
    .eq("is_active", true)
    .order("price");

  if (error) {
    console.error("Error fetching membership plans:", error);
    return [];
  }

  return data || [];
});