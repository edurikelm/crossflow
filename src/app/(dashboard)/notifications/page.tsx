import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/queries/notifications";
import { NotificationsView } from "./NotificationsView";

export default async function NotificationsPage() {
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

  const notifications = await getNotifications(gymId);

  return <NotificationsView initialNotifications={notifications} gymId={gymId} />;
}