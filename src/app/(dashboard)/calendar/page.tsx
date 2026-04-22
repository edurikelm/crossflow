"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Users, LayoutList, FileText } from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import type { ScheduledClassWithDetails, ClassTemplate } from "@/types";
import { useAuthStore } from "@/store";

type CoachSelect = { id: string; profile: { full_name: string } };

interface AttendeeRow {
  id: string;
  athlete_id: string;
  status: string;
  athletes?: {
    id?: string;
    full_name?: string;
    membership_plans?: { name?: string } | null;
  } | null;
}

const SECTION_LABEL_MAP: Record<string, string> = {
  warmup: "01_WARM_UP",
  warm: "01_WARM_UP",
  strength: "02_STRENGTH_SKILL",
  skill: "02_STRENGTH_SKILL",
  skills: "02_STRENGTH_SKILL",
  wod: "03_METCON",
  metcon: "03_METCON",
  conditioning: "03_METCON",
};

function getSectionLabel(name: string, index: number): string {
  const key = name.toLowerCase();
  return SECTION_LABEL_MAP[key] ?? `${String(index + 1).padStart(2, "0")}_${name.toUpperCase()}`;
}

function getStatusStyle(status: string): string {
  const s = status.toLowerCase();
  if (s === "checked_in" || s === "confirmed") {
    return "bg-emerald-900/60 text-emerald-400 border border-emerald-800/60";
  }
  if (s === "waiting" || s === "waitlist") {
    return "bg-neutral-800 text-neutral-400";
  }
  if (s === "no_show" || s === "cancelled") {
    return "bg-red-900/60 text-red-400 border border-red-800/60";
  }
  return "bg-neutral-800 text-neutral-400";
}

function getMembershipStyle(name?: string): string {
  if (!name) return "bg-neutral-800 text-neutral-400";
  const n = name.toLowerCase();
  if (n.includes("platinum") || n.includes("ilimitado") || n.includes("unlimited")) {
    return "bg-amber-900/60 text-amber-400 border border-amber-800/60";
  }
  if (n.includes("premium") || n.includes("gold")) {
    return "bg-orange-900/60 text-orange-400 border border-orange-800/60";
  }
  return "bg-neutral-800 text-neutral-400";
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClassWithDetails[]>([]);
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [coaches, setCoaches] = useState<CoachSelect[]>([]);
  const [isLoading, setIsLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledClassWithDetails | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  const [formData, setFormData] = useState({
    class_template_id: "",
    coach_id: "",
    date: "",
    start_time: "",
    end_time: "",
    notes: "",
  });

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const fetchData = useCallback(async (week: Date) => {
    setIsLoading(true);
    const ws = startOfWeek(week, { weekStartsOn: 1 });
    const startDate = format(addDays(ws, 0), "yyyy-MM-dd");
    const endDate = format(addDays(ws, 6), "yyyy-MM-dd");

    const currentGymId = useAuthStore.getState().gymId;

    let classesQuery = supabase
      .from("scheduled_classes")
      .select(`
        *,
        class_templates (*),
        coaches (*, profile:profiles(full_name))
      `)
      .gte("date", startDate)
      .lte("date", endDate);

    if (currentGymId) {
      classesQuery = classesQuery.eq("gym_id", currentGymId);
    }

    const [classesRes, templatesRes] = await Promise.all([
      classesQuery,
      supabase.from("class_templates").select("*").eq("is_active", true),
    ]);

    let coachesRes: { data: CoachSelect[]; error: null } = { data: [], error: null };
    if (currentGymId) {
      const res = await supabase.from("coaches").select("id, profiles(full_name)").eq("is_active", true).eq("gym_id", currentGymId);
      if (!res.error && Array.isArray(res.data)) {
        type CoachRaw = { id: string; profiles?: { full_name?: string } };
        const mapped = (res.data as CoachRaw[]).map((coach) => ({
          id: coach.id,
          profile: { full_name: coach.profiles?.full_name ?? "" }
        }));
        coachesRes = { data: mapped, error: null };
      }
    }

    if (classesRes.data) {
      setScheduledClasses(classesRes.data.map(c => ({
        ...c,
        spots_remaining: c.capacity - (c.current_bookings || 0),
      })));
    }
    if (templatesRes.data) setClassTemplates(templatesRes.data);
    if (coachesRes.data) setCoaches(coachesRes.data);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(currentWeek);
  }, [currentWeek, fetchData]);

  const getClassesForDay = (day: Date) => {
    return scheduledClasses.filter((cls) =>
      isSameDay(parseISO(cls.date), day)
    );
  };

  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  const handleEventClick = async (cls: ScheduledClassWithDetails) => {
    setSelectedEvent(cls);
    setAttendees([]);
    setIsEventDialogOpen(true);
    setIsLoadingAttendees(true);
    const { data } = await supabase
      .from("attendance")
      .select("id, athlete_id, status, athletes(id, full_name, membership_plans(name))")
      .eq("scheduled_class_id", cls.id);
    setAttendees((data as AttendeeRow[]) ?? []);
    setIsLoadingAttendees(false);
  };

  const handleSubmit = async () => {
    if (!formData.class_template_id || !formData.coach_id) return;

    const template = classTemplates.find(t => t.id === formData.class_template_id);
    const endHour = parseInt(formData.start_time.split(":")[0]) + (template?.duration_minutes || 60) / 60;

    const res = await fetch("/api/scheduled_classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_template_id: formData.class_template_id,
        coach_id: formData.coach_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: `${Math.floor(endHour).toString().padStart(2, "0")}:${((endHour % 1) * 60).toString().padStart(2, "0")}`,
        notes: formData.notes,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Error creating class:", errorData);
      return;
    }

    setIsDialogOpen(false);
    fetchData(currentWeek);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isClassActive = (cls: ScheduledClassWithDetails) => {
    const now = currentTime;
    const classDate = parseISO(cls.date);
    if (!isSameDay(classDate, now)) return false;
    const [startH, startM] = (cls.start_time || "00:00").split(":").map(Number);
    const [endH, endM] = (cls.end_time || "00:00").split(":").map(Number);
    const classStart = startH * 60 + startM;
    const classEnd = endH * 60 + endM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= classStart && currentMinutes < classEnd;
  };

  const getAvailabilityBadge = (cls: ScheduledClassWithDetails) => {
    const remaining = cls.spots_remaining ?? 0;
    if (remaining === 0) {
      return { label: "Completa", className: "bg-error-container/20 text-error" };
    }
    if (remaining <= 3) {
      return { label: "Limitada", className: "bg-tertiary-container/20 text-tertiary" };
    }
    return { label: "Disponible", className: "bg-secondary-container/20 text-secondary" };
  };

  const monthYear = format(currentWeek, "MMMM yyyy").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 pb-4">
        <div className="space-y-1">
          <h2 className="font-display font-black text-5xl tracking-[-0.04em] text-primary_container uppercase">
            Rendimiento
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-secondary tracking-widest text-xs uppercase">
              {format(currentWeek, "yyyy.MM")}
            </span>
            <div className="h-px w-16 bg-outline-variant/30" />
            <span className="font-display font-bold text-xl uppercase tracking-tighter">
              {monthYear}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek} className="hover:bg-surface-container-high">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())} className="px-4 font-mono text-xs uppercase tracking-widest font-bold hover:text-primary_container">
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek} className="hover:bg-surface-container-high">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
        className="font-display"
        onClick={() => {
          setFormData({
            class_template_id: "",
            coach_id: "",
            date: format(new Date(), "yyyy-MM-dd"),
            start_time: "09:00",
            end_time: "10:00",
            notes: "",
          });
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Clase
        </Button>
      </header>

      {/* Calendar Grid */}
      <div className="bg-surface_container_low rounded-lg overflow-hidden font-display">
        <div className="grid grid-cols-8 border-b">
          <div className="border-r p-2 " />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r p-2 text-center",
                isSameDay(day, new Date()) && "bg-primary/5"
              )}
            >
              <p className="text-xs text-muted-foreground">
                {format(day, "EEE", { locale: es })}
              </p>
              <p className={cn(
                "text-lg font-semibold",
                isSameDay(day, new Date()) && "text-primary"
              )}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        <div className="max-h-150 overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="border-r p-2 text-xs text-muted-foreground">
                {hour}:00
              </div>
              {weekDays.map((day) => {
                const dayClasses = getClassesForDay(day).filter(
                  (cls) => parseInt(cls.start_time.split(":")[0]) === hour
                );
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "border-r min-h-20 p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                      isSameDay(day, new Date()) && "bg-primary/5"
                    )}
                  >
                    {dayClasses.map((cls) => {
                      const isActive = isClassActive(cls);
                      const badge = getAvailabilityBadge(cls);
                      return (
                        <div
                          key={cls.id}
                          className={cn(
                            "rounded p-2 text-xs mb-1 cursor-pointer transition-all relative",
                            isActive
                              ? "bg-primary_container shadow-lg shadow-primary_container/20"
                              : "bg-[rgba(28,27,27,0.7)] hover:bg-[#2a2a2a]"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(cls);
                          }}
                        >
                          {!isActive && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                              style={{ backgroundColor: cls.class_templates?.color || "#3B82F6" }}
                            />
                          )}
                          <h4 className={cn(
                            "font-display font-black text-xs uppercase tracking-tight leading-none mb-1 truncate",
                            isActive ? "text-white" : "group-hover:text-primary_container"
                          )}
                          style={!isActive ? { color: cls.class_templates?.color || "#3B82F6" } : undefined}
                          >
                            {cls.class_templates?.name || "Clase"}
                          </h4>
                          <p className={cn("font-mono text-[10px] mb-1", isActive ? "text-white/70" : "text-outline")}>
                            {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                          </p>
                          {cls.coaches && (
                            <p className={cn("text-[10px] mb-2 truncate", isActive ? "text-white/60" : "text-outline/70")}>
                              {cls.coaches.profile?.full_name}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className={cn("font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase", isActive ? "bg-white/20 text-white" : "bg-surface_container_lowest text-secondary")}>
                              {(cls.capacity ?? 0) - (cls.spots_remaining ?? 0)}/{cls.capacity ?? 0}
                            </span>
                            <span className={cn("font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase", badge.className, isActive && "bg-white/20 text-white")}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Class Templates Sidebar */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1 bg-surface_container_low rounded-lg p-4">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-outline mb-3">Plantillas</h3>
          <div className="space-y-2">
            {classTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-2 rounded-md border border-outline-variant/20 p-2 cursor-pointer hover:bg-surface_container_high transition-colors"
                onClick={() => {
                  setFormData({
                    class_template_id: template.id,
                    coach_id: "",
                    date: format(new Date(), "yyyy-MM-dd"),
                    start_time: "09:00",
                    end_time: "10:00",
                    notes: "",
                  });
                  setIsDialogOpen(true);
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: template.color }}
                />
                <span className="text-sm truncate">{template.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent aria-describedby="event-dialog-description" className="w-full max-w-4xl max-h-[90vh] bg-surface_container_lowest overflow-hidden rounded-lg shadow-2xl shadow-black/80 p-0 flex flex-col">
          <DialogTitle className="sr-only">
            {selectedEvent?.class_templates?.name || "Clase"}
          </DialogTitle>
          <DialogDescription id="event-dialog-description" className="sr-only">
            Detalles de la clase programada
          </DialogDescription>

          {/* Close Button Top Right */}
          <button
            onClick={() => setIsEventDialogOpen(false)}
            className="absolute top-4 right-4 z-10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90"
          >
          </button>

          {/* Header Section */}
          <div className="relative shrink-0 bg-surface_container_lowest p-8">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary_container" />
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-black tracking-[0.2em] text-primary_container uppercase font-display">
                INFORMACIÓN DE LA CLASE
              </span>
              <h2 className="text-4xl font-display font-extrabold tracking-tighter text-white uppercase">
                {selectedEvent?.class_templates?.name || "CLASE"}
              </h2>
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary_container/20 border border-primary_container/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-primary_container">
                      {getInitials(selectedEvent?.coaches?.profile?.full_name)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Entrenador Principal</p>
                    <p className="text-sm font-bold text-white">{selectedEvent?.coaches?.profile?.full_name || "No asignado"}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-neutral-800" />
                <div>
                  <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Horario</p>
                  <p className="text-sm font-bold text-white">
                    {selectedEvent?.start_time?.slice(0, 5)} - {selectedEvent?.end_time?.slice(0, 5)}
                  </p>
                </div>
                <div className="h-8 w-px bg-neutral-800" />
                <div>
                  <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Fecha</p>
                  <p className="text-sm font-bold text-white uppercase">
                    {selectedEvent ? format(parseISO(selectedEvent.date), "dd MMM yyyy") : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Class Details Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <LayoutList className="w-4 h-4 text-primary_container" />
                <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-display">DETALLES DE LA CLASE</h3>
              </div>
              <div className="bg-surface_container_low p-5 rounded-lg">
                {selectedEvent?.class_templates?.sections && selectedEvent.class_templates.sections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {selectedEvent.class_templates.sections.slice(0, 3).map((section, idx) => (
                      <div key={idx}>
                        <h4 className="text-[10px] font-bold text-primary_container tracking-widest uppercase mb-3 border-b border-primary_container/20 pb-1">
                          {getSectionLabel(section.name, idx)}
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-white uppercase">{section.name}</p>
                          <p className="text-xs font-mono text-neutral-300 bg-surface_container_high px-2 py-1 inline-block">
                            {section.minutes} MIN
                          </p>
                          {section.description && (
                            <p className="text-xs text-neutral-400 font-medium leading-relaxed italic">{section.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Sin detalles de secciones para esta clase.</p>
                )}
              </div>
            </section>

            {/* Attendance Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-primary_container" />
                  <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-display">
                    LISTA DE ATLETAS ({attendees.length}/{selectedEvent?.capacity || 0})
                  </h3>
                </div>
                <button className="text-[10px] font-bold text-primary_container hover:underline tracking-widest uppercase">
                  AGREGAR ATLETA
                </button>
              </div>
              {isLoadingAttendees ? (
                <div className="bg-surface_container_low rounded-lg p-8 text-center">
                  <p className="text-neutral-500 text-sm">Cargando asistentes...</p>
                </div>
              ) : attendees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface_container_lowest">
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">ID DE ATLETA</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">NOMBRE</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">MEMBRESÍA</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/50">
                      {attendees.map((athlete) => {
                        const planName = athlete.athletes?.membership_plans?.name;
                        return (
                          <tr key={athlete.id} className="hover:bg-surface_container_low transition-colors">
                            <td className="px-4 py-4 text-xs font-mono text-neutral-400">#{athlete.athlete_id?.slice(0, 6) || "N/A"}</td>
                            <td className="px-4 py-4 text-sm font-bold text-white">{athlete.athletes?.full_name || "Atleta"}</td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-sm uppercase ${getMembershipStyle(planName)}`}>
                                {planName || "ESTÁNDAR"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-sm uppercase ${getStatusStyle(athlete.status)}`}>
                                {athlete.status?.replace(/_/g, " ") || "PENDIENTE"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-surface_container_low rounded-lg p-8 text-center">
                  <p className="text-neutral-500 text-sm">No hay atletas registrados en esta clase</p>
                </div>
              )}
            </section>

            {/* Description & Notes */}
            {(selectedEvent?.class_templates?.description || selectedEvent?.notes) && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-4 h-4 text-primary_container" />
                  <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-display">INFORMACIÓN ADICIONAL</h3>
                </div>
                <div className="space-y-4">
                  {selectedEvent?.class_templates?.description && (
                    <div className="bg-surface_container_low p-5 rounded-lg">
                      <p className="text-[10px] text-primary_container font-bold tracking-widest uppercase mb-2">Descripción</p>
                      <p className="text-sm text-white">{selectedEvent.class_templates.description}</p>
                    </div>
                  )}
                  {selectedEvent?.notes && (
                    <div className="bg-surface_container_low p-5 rounded-lg">
                      <p className="text-[10px] text-primary_container font-bold tracking-widest uppercase mb-2">Notas</p>
                      <p className="text-sm text-white">{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Footer Section */}
          <div className="p-6 bg-surface_container_lowest shrink-0 flex justify-end items-center gap-4">
            <button
              onClick={() => setIsEventDialogOpen(false)}
              className="px-6 py-2.5 text-xs font-bold text-neutral-400 border border-neutral-800 rounded hover:text-white hover:border-neutral-600 transition-all uppercase tracking-widest font-display active:scale-95"
            >
              EDITAR CLASE
            </button>
            <button
              onClick={() => setIsEventDialogOpen(false)}
              className="px-8 py-2.5 text-xs font-bold bg-primary_container text-on_primary_container rounded hover:brightness-110 transition-all uppercase tracking-widest font-display shadow-lg shadow-primary_container/20 active:scale-95"
            >
              CERRAR
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby="create-class-description" className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogTitle className="text-left uppercase tracking-wide">
              Nueva Clase
            </DialogTitle>
            <DialogDescription id="create-class-description" className="text-left mt-1">
              Ingresa los datos de la nueva clase
            </DialogDescription>
          </div>
          <div className="px-6 pb-4 space-y-4">
            {/* Tipo de clase */}
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Tipo de Clase</Label>
              <Select
                value={formData.class_template_id}
                onValueChange={(value) => setFormData({ ...formData, class_template_id: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {classTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: template.color }}
                        />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coach */}
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Coach</Label>
              <Select
                value={formData.coach_id}
                onValueChange={(value) => setFormData({ ...formData, coach_id: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.profile?.full_name || "Coach"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha y horario */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Fecha</Label>
                <Input
                  type="date"
                  value={formData.date}
                  className="h-11"
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Inicio</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  className="h-11"
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Fin</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  className="h-11"
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Notas</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Equipamiento, indicaciones, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-11"
                onClick={handleSubmit}
                disabled={!formData.class_template_id || !formData.coach_id}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
