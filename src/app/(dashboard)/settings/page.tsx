import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGymSettings, getMembershipPlans } from "@/lib/queries/settings";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
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

  const [gym, plans] = await Promise.all([
    getGymSettings(gymId),
    getMembershipPlans(gymId),
  ]);

  return <SettingsView initialGym={gym} initialPlans={plans} gymId={gymId} />;
}