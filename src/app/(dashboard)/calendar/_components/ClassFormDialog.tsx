"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { ClassTemplate } from "@/types";
import type { CoachSelect } from "@/lib/queries/calendar";
import type { ClassFormData } from "@/hooks/useClassForm";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ClassFormData;
  onFormDataChange: (data: ClassFormData) => void;
  classTemplates: ClassTemplate[];
  coaches: CoachSelect[];
  isEditingClass: boolean;
  isSubmittingClass: boolean;
  isDeletingClass: boolean;
  onSubmit: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  classTemplates,
  coaches,
  isEditingClass,
  isSubmittingClass,
  isDeletingClass,
  onSubmit,
  onDelete,
  onCancel,
}: ClassFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogTitle className="text-left uppercase tracking-wide">
            {isEditingClass ? "Editar Clase" : "Nueva Clase"}
          </DialogTitle>
          <DialogDescription className="text-left mt-1">
            Ingresa los datos de la nueva clase
          </DialogDescription>
        </div>
        <div className="px-6 pb-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
              Tipo de Clase
            </Label>
            <Select
              value={formData.class_template_id}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, class_template_id: value })
              }
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

          <div className="space-y-1.5">
            <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
              Coach
            </Label>
            <Select
              value={formData.coach_id}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, coach_id: value })
              }
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
                Fecha
              </Label>
              <Input
                type="date"
                value={formData.date}
                className="h-11"
                onChange={(e) =>
                  onFormDataChange({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
                Cupos
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.capacity}
                className="h-11"
                min={1}
                max={100}
                onChange={(e) =>
                  onFormDataChange({ ...formData, capacity: e.target.value })
                }
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1" />
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
                Inicio
              </Label>
              <Input
                type="time"
                value={formData.start_time}
                className="h-11"
                onChange={(e) =>
                  onFormDataChange({ ...formData, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
                Fin
              </Label>
              <Input
                type="time"
                value={formData.end_time}
                className="h-11"
                onChange={(e) =>
                  onFormDataChange({ ...formData, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-on_surface_variant uppercase tracking-wider">
              Notas
            </Label>
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              value={formData.notes}
              onChange={(e) =>
                onFormDataChange({ ...formData, notes: e.target.value })
              }
              placeholder="Equipamiento, indicaciones, etc."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            {isEditingClass && (
              <Button
                type="button"
                variant="destructive"
                className="h-11"
                onClick={onDelete}
                disabled={isDeletingClass}
              >
                {isDeletingClass ? "Eliminando..." : "Eliminar"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={onSubmit}
              disabled={
                !formData.class_template_id ||
                !formData.coach_id ||
                isSubmittingClass
              }
            >
              {isSubmittingClass ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
