import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScheduledClassesForWeek, getClassTemplates, getCoaches } from "@/lib/queries/calendar";
import { CalendarView } from "./CalendarView";
import { startOfWeek } from "date-fns";

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  const gymId = profile?.gym_id;

  if (!gymId) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-400">No se encontró un gimnasio asociado a tu cuenta.</p>
      </div>
    );
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const [initialClasses, templates, coaches] = await Promise.all([
    getScheduledClassesForWeek(weekStart, gymId),
    getClassTemplates(),
    getCoaches(gymId),
  ]);

  return (
    <CalendarView
      initialClasses={initialClasses}
      initialTemplates={templates}
      initialCoaches={coaches}
      gymId={gymId}
    />
  );
}