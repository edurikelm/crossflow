import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MembershipPlan } from "@/types";

export const getGymSettings = cache(async (gymId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", gymId)
    .single();

  if (error) {
    console.error("Error fetching gym:", error);
    return null;
  }

  return data;
});

export { getMembershipPlans } from "./memberships";