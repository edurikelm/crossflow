"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LayoutList, Users, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ScheduledClassWithDetails } from "@/types";
import type { AttendeeRow } from "../_utils";
import { getSectionLabel, getStatusStyle, getMembershipStyle, getInitials } from "../_utils";

interface ClassEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: ScheduledClassWithDetails | null;
  attendees: AttendeeRow[];
  isLoadingAttendees: boolean;
  onOpenAddAthlete: () => void;
  onRemoveAthlete: (bookingId: string) => void;
  onEditClass: () => void;
}

export function ClassEventDialog({
  open,
  onOpenChange,
  selectedEvent,
  attendees,
  isLoadingAttendees,
  onOpenAddAthlete,
  onRemoveAthlete,
  onEditClass,
}: ClassEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] bg-surface_container_lowest overflow-hidden rounded-lg shadow-2xl shadow-black/80 p-0 flex flex-col">
        <DialogTitle className="sr-only">
          {selectedEvent?.class_templates?.name || "Clase"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detalles de la clase programada
        </DialogDescription>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90"
        />

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

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <LayoutList className="w-4 h-4 text-primary_container" />
              <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-display">DETALLES DE LA CLASE</h3>
            </div>
            <div className="bg-surface_container_low p-5 rounded-lg">
              {selectedEvent?.class_templates?.sections &&
              selectedEvent.class_templates.sections.length > 0 ? (
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

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary_container" />
                <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase font-display">
                  LISTA DE ATLETAS ({attendees.length}/{selectedEvent?.capacity || 0})
                </h3>
              </div>
              <button
                onClick={onOpenAddAthlete}
                className="text-[10px] font-bold text-primary_container hover:underline tracking-widest uppercase"
              >
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
                      <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 tracking-widest uppercase text-center">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/50">
                    {attendees.map((booking) => {
                      const athlete = booking.athletes;
                      const profile = athlete?.profile;
                      const membership = athlete?.memberships?.[0];
                      const planName = membership?.plan?.name;
                      return (
                        <tr key={booking.id} className="hover:bg-surface_container_low transition-colors">
                          <td className="px-4 py-4 text-xs font-mono text-neutral-400">#{booking.athlete_id?.slice(0, 6) || "N/A"}</td>
                          <td className="px-4 py-4 text-sm font-bold text-white">{profile?.full_name || "Atleta"}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-sm uppercase ${getMembershipStyle(planName)}`}>
                              {planName || "ESTÁNDAR"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-sm uppercase ${getStatusStyle(booking.status)}`}>
                              {booking.status?.replace(/_/g, " ") || "PENDIENTE"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => onRemoveAthlete(booking.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Eliminar atleta"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
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

        <div className="p-6 bg-surface_container_lowest shrink-0 flex justify-end items-center gap-4">
          <button
            onClick={onEditClass}
            className="px-6 py-2.5 text-xs font-bold text-neutral-400 border border-neutral-800 rounded hover:text-white hover:border-neutral-600 transition-all uppercase tracking-widest font-display active:scale-95"
          >
            EDITAR CLASE
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="px-8 py-2.5 text-xs font-bold bg-primary_container text-on_primary_container rounded hover:brightness-110 transition-all uppercase tracking-widest font-display shadow-lg shadow-primary_container/20 active:scale-95"
          >
            CERRAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
