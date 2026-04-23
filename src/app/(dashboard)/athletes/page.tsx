import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAthletes, getMembershipPlans } from "@/lib/queries/athletes";
import { AthletesView } from "./AthletesView";

export default async function AthletesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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

  const [athletes, plans] = await Promise.all([
    getAthletes(gymId),
    getMembershipPlans(gymId),
  ]);

  return <AthletesView initialAthletes={athletes} initialPlans={plans} />;
}