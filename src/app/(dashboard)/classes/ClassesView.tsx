"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Clock, Users } from "lucide-react";
import type { ClassTemplate } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classTemplateSchema, type ClassTemplateInput } from "@/lib/validations";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
  all_levels: "bg-blue-100 text-blue-800",
};

type Level = "beginner" | "intermediate" | "advanced" | "all_levels";

interface ClassesViewProps {
  initialClasses: ClassTemplate[];
  gymId: string;
}

export function ClassesView({ initialClasses, gymId }: ClassesViewProps) {
  const [classes, setClasses] = useState<ClassTemplate[]>(initialClasses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm<ClassTemplateInput>({
    resolver: zodResolver(classTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 60,
      capacity: 20,
      level: "all_levels" as Level,
      focus_area: ["crossfit"],
      color: "#3B82F6",
    },
  });

  const focusArea = watch("focus_area");

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/class_templates");
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  }, []);

  const onSubmit = async (data: ClassTemplateInput) => {
    setIsSubmitting(true);
    try {
      if (editingClass) {
        const res = await fetch(`/api/class_templates/${editingClass.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update class");
      } else {
        const res = await fetch("/api/class_templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, gym_id: gymId }),
        });
        const errorData = await res.json();
        if (!res.ok) {
          throw new Error(errorData.error || "Failed to create class");
        }
      }

      setIsDialogOpen(false);
      setEditingClass(null);
      reset();
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = (cls?: ClassTemplate) => {
    if (cls) {
      setEditingClass(cls);
      reset({
        name: cls.name,
        description: cls.description || "",
        duration_minutes: cls.duration_minutes,
        capacity: cls.capacity,
        level: cls.level as Level,
        focus_area: cls.focus_area || ["crossfit"],
        color: cls.color,
      });
    } else {
      setEditingClass(null);
      reset({
        name: "",
        description: "",
        duration_minutes: 60,
        capacity: 20,
        level: "all_levels" as Level,
        focus_area: ["crossfit"],
        color: "#3B82F6",
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (cls: ClassTemplate) => {
    if (confirm("¿Estás seguro de eliminar esta clase?")) {
      await fetch(`/api/class_templates/${cls.id}`, { method: "DELETE" });
      fetchClasses();
    }
  };

  const toggleFocusArea = (area: string) => {
    const current = focusArea || [];
    const updated = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    setValue("focus_area", updated);
  };

  const handleSave = async () => {
    const data = getValues();
    setIsSubmitting(true);
    try {
      if (editingClass) {
        const res = await fetch(`/api/class_templates/${editingClass.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update class");
        }
      } else {
        const res = await fetch("/api/class_templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, gym_id: gymId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || err.details || "Failed to create class");
        }
      }
      setIsDialogOpen(false);
      setEditingClass(null);
      reset();
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Error al guardar: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clases"
        description="Gestiona las plantillas de clases de tu gimnasio"
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Clase
          </Button>
        }
      />

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
          <p className="text-muted-foreground">No hay clases creadas</p>
          <Button className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Crear primera clase
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: cls.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    {cls.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {cls.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(cls)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={LEVEL_COLORS[cls.level] || ""}
                  >
                    {cls.level === "all_levels"
                      ? "Todos los niveles"
                      : cls.level === "beginner"
                      ? "Principiante"
                      : cls.level === "intermediate"
                      ? "Intermedio"
                      : "Avanzado"}
                  </Badge>
                  {cls.focus_area?.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{cls.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{cls.capacity} cupos</span>
                  </div>
                </div>

                {(cls as unknown as { profiles?: { full_name?: string } })?.profiles && (
                  <div className="text-xs text-muted-foreground">
                    Creado por: {(cls as unknown as { profiles?: { full_name?: string } }).profiles?.full_name}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(cls)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(cls)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogTitle className="text-left uppercase tracking-wide">
              {editingClass ? "Editar Clase" : "Nueva Clase"}
            </DialogTitle>
            <DialogDescription className="text-left mt-1">
              {editingClass
                ? "Actualiza la informacion de la clase"
                : "Crea una nueva plantilla de clase"}
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-on_surface_variant uppercase tracking-wider">Nombre</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="WOD General"
                className="h-11"
              />
              {errors.name && (
                <p className="text-xs text-error">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs text-on_surface_variant uppercase tracking-wider">Descripcion</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Descripcion opcional de la clase"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duration_minutes" className="text-xs text-on_surface_variant uppercase tracking-wider">Duracion (min)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  {...register("duration_minutes", { valueAsNumber: true })}
                  min={15}
                  max={180}
                  className="h-11"
                />
                {errors.duration_minutes && (
                  <p className="text-xs text-error">{errors.duration_minutes.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs text-on_surface_variant uppercase tracking-wider">Cupos</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  min={1}
                  max={100}
                  className="h-11"
                />
                {errors.capacity && (
                  <p className="text-xs text-error">{errors.capacity.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Nivel</Label>
                <Select
                  value={watch("level")}
                  onValueChange={(value) => setValue("level", value as Level)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_levels">Todos los niveles</SelectItem>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-error">{errors.level.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-xs text-on_surface_variant uppercase tracking-wider">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    {...register("color")}
                    className="w-12 p-1 h-11"
                  />
                  <Input
                    value={watch("color")}
                    {...register("color")}
                    placeholder="#3B82F6"
                    className="h-11"
                  />
                </div>
                {errors.color && (
                  <p className="text-xs text-error">{errors.color.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Enfoque</Label>
              <input type="hidden" {...register("focus_area")} />
              <div className="flex flex-wrap gap-2">
                {["crossfit", "strength", "cardio", "olympic", "gymnastics", "endurance"].map(
                  (area) => (
                    <Badge
                      key={area}
                      variant={focusArea?.includes(area) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFocusArea(area)}
                    >
                      {area}
                    </Badge>
                  )
                )}
              </div>
              {errors.focus_area && (
                <p className="text-xs text-error">{errors.focus_area.message}</p>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="flex-1 h-11"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}