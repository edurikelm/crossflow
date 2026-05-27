import { useState, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttendeeRow } from "@/app/(dashboard)/calendar/_utils";

export function useBookings(supabase: SupabaseClient) {
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  const fetchBookings = useCallback(
    async (classId: string) => {
      setIsLoadingAttendees(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          athlete_id,
          status,
          athletes(
            id,
            profile:profiles(id, full_name, email),
            memberships(status, end_date, plan:membership_plans(name))
          )
        `,
        )
        .eq("scheduled_class_id", classId);
      if (error) {
        console.error("Error fetching bookings:", error);
      }
      setAttendees((data as AttendeeRow[]) ?? []);
      setIsLoadingAttendees(false);
    },
    [supabase],
  );

  return { attendees, isLoadingAttendees, fetchBookings, setAttendees };
}
