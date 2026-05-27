import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar gymName={profile.gyms?.name} userRole={profile.role} />
      <div className="lg:pl-64">
        <DashboardHeader user={profile} gym={profile.gyms ?? undefined} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
