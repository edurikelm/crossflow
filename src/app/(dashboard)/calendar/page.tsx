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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
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

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClassWithDetails[]>([]);
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [coaches, setCoaches] = useState<CoachWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);

  const [formData, setFormData] = useState({
    class_template_id: "",
    coach_id: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: 20,
  });

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const fetchData = useCallback(async (week: Date) => {
    setIsLoading(true);
    const ws = startOfWeek(week, { weekStartsOn: 1 });
    const startDate = format(addDays(ws, 0), "yyyy-MM-dd");
    const endDate = format(addDays(ws, 6), "yyyy-MM-dd");

    const [classesRes, templatesRes, coachesRes] = await Promise.all([
      supabase
        .from("scheduled_classes")
        .select(`
          *,
          class_templates (*),
          profiles:coach_id (id, full_name)
        `)
        .gte("date", startDate)
        .lte("date", endDate),
      supabase.from("class_templates").select("*").eq("is_active", true),
      supabase.from("coaches").select("*, profile:profile_id (id, full_name)").eq("is_active", true),
    ]);

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
      capacity: 20,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.class_template_id || !formData.coach_id) return;

    const template = classTemplates.find(t => t.id === formData.class_template_id);
    const endHour = parseInt(formData.start_time.split(":")[0]) + (template?.duration_minutes || 60) / 60;

    await supabase.from("scheduled_classes").insert({
      class_template_id: formData.class_template_id,
      coach_id: formData.coach_id,
      date: formData.date,
      start_time: formData.start_time,
      end_time: `${Math.floor(endHour).toString().padStart(2, "0")}:${((endHour % 1) * 60).toString().padStart(2, "0")}`,
      capacity: formData.capacity,
    });

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
              capacity: 20,
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
                    capacity: template.capacity,
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

      {/* Create Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Clase</DialogTitle>
            <DialogDescription>
              {selectedSlot
                ? `Programar clase para el ${format(parseISO(selectedSlot.date), "dd/MM/yyyy")} a las ${selectedSlot.hour}:00`
                : "Configura la clase"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plantilla de clase</Label>
              <Select
                value={formData.class_template_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, class_template_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clase" />
                </SelectTrigger>
                <SelectContent>
                  {classTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: template.color }}
                        />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Coach</Label>
              <Select
                value={formData.coach_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, coach_id: value })
                }
              >
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Hora inicio</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cupos</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 20,
                  })
                }
                min={1}
                max={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.class_template_id || !formData.coach_id}
            >
              Crear Clase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
