import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ScheduledClassWithDetails, TicketWithDetails } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Ticket, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getMetrics(gymId: string) {
  const supabase = await createClient();

  const { count: totalAthletes } = await supabase
    .from("athletes")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId);

  const { count: activeAthletes } = await supabase
    .from("athletes")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("is_active", true);

  const today = new Date().toISOString().split("T")[0];

  const { count: classesToday } = await supabase
    .from("scheduled_classes")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("date", today);

  const { count: pendingTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("status", "open");

  return {
    totalAthletes: totalAthletes || 0,
    activeAthletes: activeAthletes || 0,
    classesToday: classesToday || 0,
    pendingTickets: pendingTickets || 0,
  };
}

async function getTodayClasses(gymId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: classes } = await supabase
    .from("scheduled_classes")
    .select(`
      *,
      class_templates (*),
      profiles:coach_id (full_name)
    `)
    .eq("gym_id", gymId)
    .eq("date", today)
    .order("start_time", { ascending: true });

  return classes || [];
}

async function getRecentTickets(gymId: string) {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      athletes:athlete_id (
        profile:profile_id (full_name)
      )
    `)
    .eq("gym_id", gymId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(5);

  return tickets || [];
}

export default async function DashboardPage() {
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

  if (!profile) {
    redirect("/login");
  }

  const gymId = profile.gym_id;
  const metrics = await getMetrics(gymId);
  const todayClasses = await getTodayClasses(gymId);
  const recentTickets = await getRecentTickets(gymId);

  const statCards = [
    {
      title: "Atletas Activos",
      value: metrics.activeAthletes,
      total: metrics.totalAthletes,
      icon: Users,
      gradient: "from-[#22c55e] to-[#16a34a]",
      glow: "shadow-[#22c55e]/20",
    },
    {
      title: "Clases Hoy",
      value: metrics.classesToday,
      icon: Calendar,
      gradient: "from-[#3b82f6] to-[#2563eb]",
      glow: "shadow-[#3b82f6]/20",
    },
    {
      title: "Tickets Pendientes",
      value: metrics.pendingTickets,
      icon: Ticket,
      gradient: "from-[#f59e0b] to-[#d97706]",
      glow: "shadow-[#f59e0b]/20",
    },
    {
      title: "Total Atletas",
      value: metrics.totalAthletes,
      icon: Users,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      glow: "shadow-[#8b5cf6]/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Control"
        description="Resumen de la actividad de tu gimnasio"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-[#1A1A24] bg-[#0D0D12] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="relative z-10">
                <div className={`inline-flex rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg ${stat.glow}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <p className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {stat.value}
                </p>
                <p className="text-xs text-[#8B8B9A] mt-1">{stat.title}</p>
                {stat.total !== undefined && (
                  <p className="text-xs text-[#8B8B9A]">
                    de {stat.total} total
                  </p>
                )}
              </div>
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#1A1A24] bg-[#0D0D12]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#1A1A24]">
            <CardTitle className="text-lg text-white" style={{ fontFamily: "var(--font-display)" }}>
              CLASES DE HOY
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#8B8B9A] hover:text-[#22c55e]">
              <Link href="/dashboard/calendar">
                Ver calendario <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-[#1A1A24] p-4 mb-4">
                  <Calendar className="h-8 w-8 text-[#8B8B9A]" />
                </div>
                <p className="text-sm text-[#8B8B9A]">
                  No hay clases programadas para hoy
                </p>
                <Button className="mt-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:opacity-90" asChild>
                  <Link href="/dashboard/calendar">Programar clase</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls: ScheduledClassWithDetails) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-lg border border-[#1A1A24] bg-[#1A1A24]/50 p-3 transition-all duration-200 hover:bg-[#1A1A24] hover:border-[#22c55e]/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-1 rounded-full shadow-lg"
                        style={{ backgroundColor: cls.class_templates?.color || "#22c55e" }}
                      />
                      <div>
                        <p className="font-medium text-white">{cls.class_templates?.name || "Clase"}</p>
                        <div className="flex items-center gap-2 text-xs text-[#8B8B9A]">
                          <Clock className="h-3 w-3" />
                          <span>
                            {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                          </span>
                          {cls.profiles?.full_name && (
                            <>
                              <span className="text-[#1A1A24]">•</span>
                              <span>{cls.profiles.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {cls.current_bookings || 0}/{cls.capacity}
                      </p>
                      <p className="text-xs text-[#8B8B9A]">cupos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#1A1A24] bg-[#0D0D12]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#1A1A24]">
            <CardTitle className="text-lg text-white" style={{ fontFamily: "var(--font-display)" }}>
              TICKETS RECIENTES
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#8B8B9A] hover:text-[#22c55e]">
              <Link href="/dashboard/tickets">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {recentTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-[#1A1A24] p-4 mb-4">
                  <Ticket className="h-8 w-8 text-[#8B8B9A]" />
                </div>
                <p className="text-sm text-[#8B8B9A]">
                  No hay tickets pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket: TicketWithDetails) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-lg border border-[#1A1A24] bg-[#1A1A24]/50 p-3 transition-all duration-200 hover:bg-[#1A1A24]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-white">{ticket.subject}</p>
                        <p className="text-xs text-[#8B8B9A]">
                          {ticket.athlete?.profile?.full_name || "Sin asignar"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        ticket.priority === "urgent"
                          ? "destructive"
                          : ticket.priority === "high"
                          ? "warning"
                          : "secondary"
                      }
                      className={ticket.priority === "urgent" ? "bg-[#ef4444]" : ticket.priority === "high" ? "bg-[#f59e0b]" : "bg-[#1A1A24] text-[#8B8B9A]"}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
