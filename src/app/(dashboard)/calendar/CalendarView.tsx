"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import type { ScheduledClassWithDetails, ClassTemplate } from "@/types";
import type { CoachSelect } from "@/lib/queries/calendar";
import { useCalendarWeek, useBookings, useAthleteSearch, useClassForm } from "@/hooks";
import {
  WeekHeader, CalendarGrid, TemplateSidebar, ClassEventDialog, AthleteSelector, ClassFormDialog,
} from "./_components";

interface CalendarViewProps {
  initialClasses: ScheduledClassWithDetails[];
  initialTemplates: ClassTemplate[];
  initialCoaches: CoachSelect[];
  gymId: string;
}

export function CalendarView({ initialClasses, initialTemplates, initialCoaches, gymId }: CalendarViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const { currentWeek, weekDays, currentTime, monthYear, handlePrevWeek, handleNextWeek, handleToday } = useCalendarWeek();
  const { attendees, isLoadingAttendees, fetchBookings, setAttendees } = useBookings(supabase);
  const { availableAthletes, athleteSearchQuery, setAthleteSearchQuery, isLoadingAthletes, search: searchAthletes } = useAthleteSearch();
  const { formData, setFormData, isEditingClass, setIsEditingClass, editingClassId, setEditingClassId, isSubmittingClass, setIsSubmittingClass, isDeletingClass, setIsDeletingClass, resetForm } = useClassForm();
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClassWithDetails[]>(initialClasses);
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>(initialTemplates);
  const [coaches, setCoaches] = useState<CoachSelect[]>(initialCoaches);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isAddAthleteDialogOpen, setIsAddAthleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledClassWithDetails | null>(null);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [isAddingAthletes, setIsAddingAthletes] = useState(false);
  const [addAthleteError, setAddAthleteError] = useState<string | null>(null);

  const fetchData = useCallback(async (week: Date) => {
    const ws = startOfWeek(week, { weekStartsOn: 1 });
    const startDate = format(addDays(ws, 0), "yyyy-MM-dd");
    const endDate = format(addDays(ws, 6), "yyyy-MM-dd");
    let classesQuery = supabase.from("scheduled_classes").select(`*, class_templates (*), coaches (*, profile:profiles(full_name))`).gte("date", startDate).lte("date", endDate);
    if (gymId) classesQuery = classesQuery.eq("gym_id", gymId);
    const [classesRes, templatesRes] = await Promise.all([
      classesQuery,
      supabase.from("class_templates").select("*").eq("is_active", true),
    ]);
    let coachesRes: { data: CoachSelect[]; error: null } = { data: [], error: null };
    if (gymId) {
      const res = await supabase.from("coaches").select("id, profiles(full_name)").eq("is_active", true).eq("gym_id", gymId);
      if (!res.error && Array.isArray(res.data)) {
        type CoachRaw = { id: string; profiles?: { full_name?: string } };
        coachesRes = { data: (res.data as CoachRaw[]).map((coach) => ({ id: coach.id, profile: { full_name: coach.profiles?.full_name ?? "" } })), error: null };
      }
    }
    if (classesRes.data) setScheduledClasses(classesRes.data.map(c => ({ ...c, spots_remaining: c.capacity - (c.current_bookings || 0) })));
    if (templatesRes.data) setClassTemplates(templatesRes.data);
    if (coachesRes.data) setCoaches(coachesRes.data);
  }, [supabase, gymId]);

  const handleEventClick = async (cls: ScheduledClassWithDetails) => {
    setSelectedEvent(cls); setAttendees([]);
    setIsEventDialogOpen(true); await fetchBookings(cls.id);
  };

  const handleOpenAddAthleteDialog = () => {
    setSelectedAthleteIds([]); setAthleteSearchQuery(""); setAddAthleteError(null);
    if (selectedEvent) searchAthletes(selectedEvent.id);
    setIsAddAthleteDialogOpen(true);
  };

  const handleToggleAthlete = (athleteId: string) => {
    setSelectedAthleteIds((prev) => prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId]);
  };

  const handleAddAthletes = async () => {
    if (!selectedEvent || selectedAthleteIds.length === 0) return;
    setIsAddingAthletes(true); setAddAthleteError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_class_id: selectedEvent.id, athlete_ids: selectedAthleteIds }),
      });
      if (res.ok) {
        setSelectedAthleteIds([]); setIsAddAthleteDialogOpen(false);
        await fetchBookings(selectedEvent.id);
        setScheduledClasses((prev) => prev.map((cls) =>
          cls.id === selectedEvent.id ? { ...cls, current_bookings: (cls.current_bookings || 0) + selectedAthleteIds.length, spots_remaining: Math.max(0, (cls.spots_remaining || 0) - selectedAthleteIds.length) } : cls
        ));
      } else {
        setAddAthleteError((await res.json()).error || "Error al agregar atletas");
      }
    } catch { setAddAthleteError("Error al agregar atletas"); }
    finally { setIsAddingAthletes(false); }
  };

  const handleRemoveAthlete = async (bookingId: string) => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`/api/attendance?booking_id=${bookingId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBookings(selectedEvent.id);
        setScheduledClasses((prev) => prev.map((cls) =>
          cls.id === selectedEvent.id ? { ...cls, current_bookings: Math.max(0, (cls.current_bookings || 0) - 1), spots_remaining: (cls.spots_remaining || 0) + 1 } : cls
        ));
      } else { console.error("Error removing athlete:", await res.json()); }
    } catch (error) { console.error("Error removing athlete:", error); }
  };

  const handleSubmit = async () => {
    if (!formData.class_template_id || !formData.coach_id) return;
    setIsSubmittingClass(true);
    const template = classTemplates.find(t => t.id === formData.class_template_id);
    const endHour = parseInt(formData.start_time.split(":")[0]) + (template?.duration_minutes || 60) / 60;
    const body: Record<string, unknown> = {
      class_template_id: formData.class_template_id, coach_id: formData.coach_id, date: formData.date,
      start_time: formData.start_time,
      end_time: `${Math.floor(endHour).toString().padStart(2, "0")}:${((endHour % 1) * 60).toString().padStart(2, "0")}`,
      notes: formData.notes,
    };
    if (formData.capacity) body.capacity = parseInt(formData.capacity);
    const url = isEditingClass && editingClassId ? `/api/scheduled_classes/${editingClassId}` : "/api/scheduled_classes";
    const method = isEditingClass && editingClassId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { console.error("Error saving class:", await res.json()); setIsSubmittingClass(false); return; }
    setIsDialogOpen(false); setIsEditingClass(false); setEditingClassId(null); resetForm();
    fetchData(currentWeek); setIsSubmittingClass(false);
  };

  const handleEditClass = () => {
    if (!selectedEvent) return;
    setIsEditingClass(true); setEditingClassId(selectedEvent.id);
    setFormData({
      class_template_id: selectedEvent.class_template_id || "", coach_id: selectedEvent.coach_id || "",
      date: selectedEvent.date, start_time: selectedEvent.start_time || "", end_time: selectedEvent.end_time || "",
      notes: selectedEvent.notes || "", capacity: selectedEvent.capacity ? String(selectedEvent.capacity) : "",
    });
    setIsEventDialogOpen(false); setIsDialogOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!selectedEvent || !confirm("¿Estás seguro de eliminar esta clase?")) return;
    setIsDeletingClass(true);
    const res = await fetch(`/api/scheduled_classes/${selectedEvent.id}`, { method: "DELETE" });
    if (res.ok) { setIsEventDialogOpen(false); fetchData(currentWeek); }
    else { console.error("Error deleting class"); }
    setIsDeletingClass(false);
  };

  const openNewClass = (templateId?: string) => {
    setFormData({ class_template_id: templateId ?? "", coach_id: "", date: format(new Date(), "yyyy-MM-dd"), start_time: "09:00", end_time: "10:00", notes: "", capacity: "" });
    setIsDialogOpen(true);
  };

  const handleCancelForm = () => { setIsDialogOpen(false); setIsEditingClass(false); setEditingClassId(null); resetForm(); };

  return (
    <div className="space-y-6">
      <WeekHeader monthYear={monthYear} currentWeek={currentWeek} onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} onToday={handleToday} onNewClass={() => openNewClass()} />
      <CalendarGrid weekDays={weekDays} scheduledClasses={scheduledClasses} currentTime={currentTime} onEventClick={handleEventClick} />
      <div className="grid gap-4 lg:grid-cols-4">
        <TemplateSidebar classTemplates={classTemplates} onSelectTemplate={openNewClass} />
      </div>
      <ClassEventDialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen} selectedEvent={selectedEvent} attendees={attendees} isLoadingAttendees={isLoadingAttendees} onOpenAddAthlete={handleOpenAddAthleteDialog} onRemoveAthlete={handleRemoveAthlete} onEditClass={handleEditClass} />
      <AthleteSelector open={isAddAthleteDialogOpen} onOpenChange={setIsAddAthleteDialogOpen} availableAthletes={availableAthletes} selectedAthleteIds={selectedAthleteIds} onToggleAthlete={handleToggleAthlete} athleteSearchQuery={athleteSearchQuery} onSearchQueryChange={setAthleteSearchQuery} isLoadingAthletes={isLoadingAthletes} isAddingAthletes={isAddingAthletes} addAthleteError={addAthleteError} spotsRemaining={selectedEvent?.spots_remaining ?? 0} onAdd={handleAddAthletes} onSearch={() => selectedEvent && searchAthletes(selectedEvent.id)} />
      <ClassFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} formData={formData} onFormDataChange={setFormData} classTemplates={classTemplates} coaches={coaches} isEditingClass={isEditingClass} isSubmittingClass={isSubmittingClass} isDeletingClass={isDeletingClass} onSubmit={handleSubmit} onDelete={handleDeleteClass} onCancel={handleCancelForm} />
    </div>
  );
}
