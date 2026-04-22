"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, ChevronLeft, ChevronRight, Clock, Users, Trash2 } from "lucide-react";
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
import type { ScheduledClassWithDetails, ClassTemplate, CoachWithProfile } from "@/types";
import { useAuthStore } from "@/store";

type CoachSelect = { id: string; full_name: string };

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClassWithDetails[]>([]);
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [coaches, setCoaches] = useState<CoachSelect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledClassWithDetails | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);

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

    const gymId = useAuthStore.getState().gymId;

    let classesQuery = supabase
      .from("scheduled_classes")
      .select(`
        *,
        class_templates (*),
        profiles:coach_id (id, full_name)
      `)
      .gte("date", startDate)
      .lte("date", endDate);

    if (gymId) {
      classesQuery = classesQuery.eq("gym_id", gymId);
    }

    const [classesRes, templatesRes] = await Promise.all([
      classesQuery,
      supabase.from("class_templates").select("*").eq("is_active", true),
    ]);

    let coachesRes: { data: CoachSelect[]; error: null } = { data: [], error: null };
    if (gymId) {
      const res = await supabase.from("coaches").select("id, full_name").eq("is_active", true).eq("gym_id", gymId);
      if (!res.error) coachesRes = { data: res.data as CoachSelect[], error: null };
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

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({
      date: format(date, "yyyy-MM-dd"),
      hour,
    });
    setFormData({
      class_template_id: "",
      coach_id: "",
      date: format(date, "yyyy-MM-dd"),
      start_time: `${hour.toString().padStart(2, "0")}:00`,
      end_time: `${(hour + 1).toString().padStart(2, "0")}:00`,
      notes: "",
    });
    setIsDialogOpen(true);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario"
        description="Programación semanal de clases"
        actions={
          <Button onClick={() => {
            setSelectedSlot(null);
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
        }
      />

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            {format(weekDays[0], "dd MMM")} - {format(weekDays[6], "dd MMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
          Hoy
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="border-r p-2" />
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

          <div className="max-h-[600px] overflow-y-auto">
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
                        "border-r min-h-[80px] p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                        isSameDay(day, new Date()) && "bg-primary/5"
                      )}
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {dayClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="rounded-md p-1.5 text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: cls.class_templates?.color || "#3B82F6" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(cls);
                            setIsEventDialogOpen(true);
                          }}
                        >
                          <p className="font-medium text-white truncate">
                            {cls.class_templates?.name || "Clase"}
                          </p>
                          <p className="text-white/80 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cls.start_time?.slice(0, 5)}
                          </p>
                          {cls.profiles && (
                            <p className="text-white/80 truncate">
                              {cls.profiles.full_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Templates Sidebar */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Plantillas</CardTitle>
            <CardDescription>Arrastra o haz clic para crear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {classTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
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
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: template.color }}
                />
                <span className="text-sm">{template.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[921px] bg-surface overflow-hidden rounded-lg shadow-2xl shadow-black/80 p-0">
          <DialogTitle className="sr-only">
            {selectedEvent?.class_templates?.name || "Clase"}
          </DialogTitle>

          {/* Close Button Top Right */}
          <button
            onClick={() => setIsEventDialogOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {/* Header Section */}
          <div className="relative overflow-hidden bg-surface-container-lowest p-8 border-b-0">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-container" />
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-black tracking-[0.2em] text-primary-container uppercase font-headline">
                  CLASS_INFO_VIEW
                </span>
                <h2 className="text-4xl font-headline font-extrabold tracking-tighter text-white uppercase">
                  {selectedEvent?.class_templates?.name || "CLASE"}
                </h2>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high">
                      <div className="w-full h-full bg-surface-container-high" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Lead Coach</p>
                      <p className="text-sm font-bold text-white">{selectedEvent?.profiles?.full_name || "No asignado"}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-neutral-800" />
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Session Time</p>
                    <p className="text-sm font-bold text-white">
                      {selectedEvent?.start_time?.slice(0, 5)} - {selectedEvent?.end_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-neutral-800" />
                  <div>
                    <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Date</p>
                    <p className="text-sm font-bold text-white uppercase">
                      {selectedEvent ? format(parseISO(selectedEvent.date), "dd MMM yyyy") : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
            {/* Class Details Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary-container">list_alt</span>
                <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-headline">CLASS DETAILS</h3>
              </div>
              <div className="bg-surface-container-low p-5 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Warm-up */}
                  <div>
                    <h4 className="text-[10px] font-bold text-primary-container tracking-widest uppercase mb-3 border-b border-primary-container/20 pb-1">01_WARM_UP</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white uppercase">
                        {selectedEvent?.class_templates?.warmup || "Ver detalles"}
                      </p>
                      <p className="text-xs text-neutral-400 font-medium leading-relaxed italic">
                        Dynamic Joint Mobility & Core Activation
                      </p>
                    </div>
                  </div>
                  {/* Strength/Skill */}
                  <div>
                    <h4 className="text-[10px] font-bold text-primary-container tracking-widest uppercase mb-3 border-b border-primary-container/20 pb-1">02_STRENGTH_SKILL</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white uppercase">
                        {selectedEvent?.class_templates?.strength_skill || "Ver detalles"}
                      </p>
                      {selectedEvent?.class_templates?.prescription && (
                        <p className="text-xs font-mono text-white bg-surface-container-high px-2 py-1 inline-block">
                          {selectedEvent.class_templates.prescription}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Metcon */}
                  <div>
                    <h4 className="text-[10px] font-bold text-primary-container tracking-widest uppercase mb-3 border-b border-primary-container/20 pb-1">03_METCON</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white uppercase italic">
                        {selectedEvent?.class_templates?.metcon_name || '"METCON"'}
                      </p>
                      {selectedEvent?.class_templates?.metcon && (
                        <p className="text-xs font-bold text-white">
                          {selectedEvent.class_templates.metcon}
                        </p>
                      )}
                      {selectedEvent?.class_templates?.metcon_movements && selectedEvent.class_templates.metcon_movements.length > 0 && (
                        <ul className="text-[11px] text-neutral-400 space-y-1 font-medium">
                          {selectedEvent.class_templates.metcon_movements.map((movement, idx) => (
                            <li key={idx}>{movement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">Duration</p>
                  <p className="text-lg font-bold text-white">{selectedEvent?.class_templates?.duration_minutes || 60} min</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">Capacity</p>
                  <p className="text-lg font-bold text-white">{selectedEvent?.spots_remaining} / {selectedEvent?.capacity}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">Level</p>
                  <p className="text-lg font-bold text-white uppercase text-xs">
                    {selectedEvent?.class_templates?.level === "all_levels"
                      ? "ALL LEVELS"
                      : selectedEvent?.class_templates?.level?.toUpperCase() || "N/A"}
                  </p>
                </div>
                {selectedEvent?.class_templates?.focus_area && selectedEvent.class_templates.focus_area.length > 0 && (
                  <div className="bg-surface-container-low rounded-lg p-4">
                    <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">Focus</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEvent.class_templates.focus_area.map((area) => (
                        <span key={area} className="text-xs font-medium text-white bg-surface-container-high px-1.5 py-0.5 rounded uppercase">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Attendance Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container">groups</span>
                  <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-headline">
                    ATHLETE_ROSTER ({selectedEvent?.attendees?.length || 0}/{selectedEvent?.capacity || 0})
                  </h3>
                </div>
                <button className="text-[10px] font-bold text-primary-container hover:underline tracking-widest uppercase">
                  Add Athlete
                </button>
              </div>
              {selectedEvent?.attendees && selectedEvent.attendees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-lowest">
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-[0.1em] uppercase">ATHLETE_ID</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-[0.1em] uppercase">NAME</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-[0.1em] uppercase">MEMBERSHIP</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-[0.1em] uppercase">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/50">
                      {selectedEvent.attendees.map((athlete) => (
                        <tr key={athlete.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-4 text-xs font-mono text-neutral-400">#{athlete.athlete_id?.slice(0, 6) || "N/A"}</td>
                          <td className="px-4 py-4 text-sm font-bold text-white">{athlete.athletes?.full_name || "Athlete"}</td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-0.5 text-[9px] font-black rounded-sm bg-tertiary-container text-on-tertiary-container uppercase">
                              {athlete.athletes?.membership_plans?.name || "STANDARD"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-sm uppercase ${
                              athlete.status === "checked_in"
                                ? "bg-secondary-container text-on-secondary-container"
                                : athlete.status === "waiting"
                                ? "bg-tertiary-container text-on-tertiary-container"
                                : "bg-surface-container-high text-neutral-300"
                            }`}>
                              {athlete.status?.replace("_", " ") || "PENDING"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-lg p-8 text-center">
                  <p className="text-neutral-500 text-sm">No athletes enrolled in this class</p>
                </div>
              )}
            </section>

            {/* Description & Notes */}
            {(selectedEvent?.class_templates?.description || selectedEvent?.notes) && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary-container">description</span>
                  <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-headline">ADDITIONAL INFO</h3>
                </div>
                <div className="space-y-4">
                  {selectedEvent?.class_templates?.description && (
                    <div className="bg-surface-container-low p-5 rounded-lg">
                      <p className="text-[10px] text-primary-container font-bold tracking-widest uppercase mb-2">Description</p>
                      <p className="text-sm text-white">{selectedEvent.class_templates.description}</p>
                    </div>
                  )}
                  {selectedEvent?.notes && (
                    <div className="bg-surface-container-low p-5 rounded-lg">
                      <p className="text-[10px] text-primary-container font-bold tracking-widest uppercase mb-2">Notes</p>
                      <p className="text-sm text-white">{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Footer Section */}
          <div className="p-6 bg-surface-container-lowest flex justify-end items-center gap-4 border-t-0">
            <button
              onClick={() => setIsEventDialogOpen(false)}
              className="px-6 py-2.5 text-xs font-bold text-neutral-400 border border-neutral-800 rounded hover:text-white hover:border-neutral-600 transition-all uppercase tracking-widest font-headline active:scale-95"
            >
              EDIT_CLASS
            </button>
            <button
              onClick={() => setIsEventDialogOpen(false)}
              className="px-8 py-2.5 text-xs font-bold bg-primary-container text-on-primary-container rounded hover:brightness-110 transition-all uppercase tracking-widest font-headline shadow-lg shadow-primary-container/20 active:scale-95"
            >
              CLOSE_ATTENDANCE
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-lg bg-surface-container-low rounded-lg p-0 overflow-hidden border border-outline-variant/20">
          <DialogTitle className="sr-only">Crear Nueva Clase</DialogTitle>

          {/* Close Button */}
          <button
            onClick={() => setIsDialogOpen(false)}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          {/* Header */}
          <div className="bg-surface-container-lowest p-6 border-b border-neutral-800/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">fitness_center</span>
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] text-neutral-500 uppercase">INDUSTRIAL PERFORMANCE LEDGER</p>
                <h2 className="text-2xl font-headline font-extrabold tracking-tighter text-white uppercase">NEW_CLASS_ENTRY</h2>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Class Type */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Class Type</Label>
              <Select
                value={formData.class_template_id}
                onValueChange={(value) => setFormData({ ...formData, class_template_id: value })}
              >
                <SelectTrigger className="bg-surface-container-high border-0 h-12 rounded-lg px-4">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {classTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: template.color }}
                        />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned Coach */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Assigned Coach</Label>
              <Select
                value={formData.coach_id}
                onValueChange={(value) => setFormData({ ...formData, coach_id: value })}
              >
                <SelectTrigger className="bg-surface-container-high border-0 h-12 rounded-lg px-4">
                  <SelectValue placeholder="Seleccionar coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.full_name || "Coach"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Date */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Session Date</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-500">calendar_today</span>
                <Input
                  type="date"
                  value={formData.date}
                  className="h-12 pl-12 bg-surface-container-high border-0 rounded-lg"
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Start Time</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-500">schedule</span>
                  <Input
                    type="time"
                    value={formData.start_time}
                    className="h-12 pl-12 bg-surface-container-high border-0 rounded-lg"
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">End Time</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-500">timer</span>
                  <Input
                    type="time"
                    value={formData.end_time}
                    className="h-12 pl-12 bg-surface-container-high border-0 rounded-lg"
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Administrative Notes */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Administrative Notes / Equipment Requirements</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-lg bg-surface-container-high px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 border-0 resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalla equipamiento o requerimientos especiales..."
                rows={4}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 uppercase tracking-widest font-headline text-xs"
              onClick={() => setIsDialogOpen(false)}
            >
              CANCEL
            </Button>
            <Button
              className="flex-1 h-12 bg-primary-container text-on-primary-container hover:brightness-110 uppercase tracking-widest font-headline text-xs shadow-lg shadow-primary-container/20"
              onClick={handleSubmit}
              disabled={!formData.class_template_id || !formData.coach_id}
            >
              CREATE CLASS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
