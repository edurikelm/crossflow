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
      accent: "bg-primary",
    },
    {
      title: "Clases Hoy",
      value: metrics.classesToday,
      icon: Calendar,
      accent: "bg-secondary",
    },
    {
      title: "Tickets Pendientes",
      value: metrics.pendingTickets,
      icon: Ticket,
      accent: "bg-tertiary",
    },
    {
      title: "Total Atletas",
      value: metrics.totalAthletes,
      icon: Users,
      accent: "bg-error",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Panel de Control"
        description="Resumen de la actividad de tu gimnasio"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ambient-shadow"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="relative z-10">
                <div className={`inline-flex rounded-md ${stat.accent} p-2.5`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <p className="text-4xl font-display font-bold text-surface-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-on_surface_variant mt-1">{stat.title}</p>
                {stat.total !== undefined && (
                  <p className="text-xs text-on_surface_variant">
                    de {stat.total} total
                  </p>
                )}
              </div>
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.accent} opacity-10 blur-2xl`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-display">
              CLASES DE HOY
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-on_surface_variant hover:text-primary">
              <Link href="/calendar">
                Ver calendario <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-md bg-surface_container_high p-4 mb-4">
                  <Calendar className="h-8 w-8 text-on_surface_variant" />
                </div>
                <p className="text-sm text-on_surface_variant">
                  No hay clases programadas para hoy
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/calendar">Programar clase</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {todayClasses.map((cls: ScheduledClassWithDetails) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-md p-3 mx-5 mb-1 bg-surface_container_low transition-all duration-200 hover:bg-surface_container_high"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-0.5 rounded-full"
                        style={{ backgroundColor: cls.class_templates?.color || "var(--color-primary)" }}
                      />
                      <div>
                        <p className="font-medium text-surface-foreground">{cls.class_templates?.name || "Clase"}</p>
                        <div className="flex items-center gap-2 text-xs text-on_surface_variant">
                          <Clock className="h-3 w-3" />
                          <span>
                            {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                          </span>
                          {cls.profiles?.full_name && (
                            <>
                              <span className="text-surface_container_high">•</span>
                              <span>{cls.profiles.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-foreground">
                        {cls.current_bookings || 0}/{cls.capacity}
                      </p>
                      <p className="text-xs text-on_surface_variant">cupos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-display">
              TICKETS RECIENTES
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-on_surface_variant hover:text-primary">
              <Link href="/tickets">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-md bg-surface_container_high p-4 mb-4">
                  <Ticket className="h-8 w-8 text-on_surface_variant" />
                </div>
                <p className="text-sm text-on_surface_variant">
                  No hay tickets pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTickets.map((ticket: TicketWithDetails) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-md p-3 mx-5 mb-1 bg-surface_container_low transition-all duration-200 hover:bg-surface_container_high"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-surface-foreground">{ticket.subject}</p>
                      <p className="text-xs text-on_surface_variant">
                        {ticket.athlete?.profile?.full_name || "Sin asignar"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        ticket.priority === "urgent"
                          ? "destructive"
                          : ticket.priority === "high"
                          ? "warning"
                          : "secondary"
                      }
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