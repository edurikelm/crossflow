import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MembershipPlan } from "@/types";

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