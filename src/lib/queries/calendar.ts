import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { addDays, startOfWeek, format } from "date-fns";
import type { ScheduledClassWithDetails, ClassTemplate } from "@/types";

export type CoachSelect = { id: string; profile: { full_name: string } };

export const getClassTemplates = cache(async (): Promise<ClassTemplate[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_templates")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching class templates:", error);
    return [];
  }

  return data || [];
});

export const getCoaches = cache(async (gymId: string): Promise<CoachSelect[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("id, profiles(full_name)")
    .eq("is_active", true)
    .eq("gym_id", gymId);

  if (error) {
    console.error("Error fetching coaches:", error);
    return [];
  }

  type CoachRaw = { id: string; profiles?: { full_name?: string } };
  return (data as CoachRaw[]).map((coach) => ({
    id: coach.id,
    profile: { full_name: coach.profiles?.full_name ?? "" },
  }));
});

export const getScheduledClassesForWeek = cache(async (week: Date, gymId: string): Promise<ScheduledClassWithDetails[]> => {
  const supabase = await createClient();
  const ws = startOfWeek(week, { weekStartsOn: 1 });
  const startDate = format(addDays(ws, 0), "yyyy-MM-dd");
  const endDate = format(addDays(ws, 6), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("scheduled_classes")
    .select(`
      *,
      class_templates (*),
      coaches (*, profile:profiles(full_name))
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("gym_id", gymId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching scheduled classes:", error);
    return [];
  }

  return (data || []).map((c) => ({
    ...c,
    spots_remaining: c.capacity - (c.current_bookings || 0),
  }));
});

export const getBookingsForClass = cache(async (classId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      athlete_id,
      status,
      athletes(
        id,
        profile:profiles(id, full_name, email),
        memberships(status, end_date, plan:membership_plans(name))
      )
    `)
    .eq("scheduled_class_id", classId);

  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }

  return data || [];
});