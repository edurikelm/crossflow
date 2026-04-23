import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ClassTemplate } from "@/types";

export const getClassTemplates = cache(async (gymId: string): Promise<ClassTemplate[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_templates")
    .select("*")
    .eq("gym_id", gymId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching class templates:", error);
    return [];
  }

  return data || [];
});