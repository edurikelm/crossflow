"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Clock, Users } from "lucide-react";
import type { ClassTemplate } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
  all_levels: "bg-blue-100 text-blue-800",
};

const DEFAULT_SECTIONS = [
  { name: "warmup", minutes: 10, description: "Calentamiento general" },
  { name: "strength", minutes: 15, description: "Fuerza/Power" },
  { name: "wod", minutes: 20, description: "WOD" },
  { name: "cooldown", minutes: 10, description: "Volver a la calma" },
];

export default function ClassesPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    duration_minutes: number;
    capacity: number;
    level: "beginner" | "intermediate" | "advanced" | "all_levels";
    focus_area: string[];
    color: string;
  }>({
    name: "",
    description: "",
    duration_minutes: 60,
    capacity: 20,
    level: "all_levels",
    focus_area: ["crossfit"],
    color: "#3B82F6",
  });

  const fetchClasses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("class_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setClasses(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClasses();
  }, []);

  const handleOpenDialog = (cls?: ClassTemplate) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name,
        description: cls.description || "",
        duration_minutes: cls.duration_minutes,
        capacity: cls.capacity,
        level: cls.level as "beginner" | "intermediate" | "advanced" | "all_levels",
        focus_area: cls.focus_area || ["crossfit"],
        color: cls.color,
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        capacity: 20,
        level: "all_levels",
        focus_area: ["crossfit"],
        color: "#3B82F6",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const sections =
        editingClass?.sections && editingClass.sections.length > 0
          ? editingClass.sections
          : DEFAULT_SECTIONS;

      if (editingClass) {
        await supabase
          .from("class_templates")
          .update({
            name: formData.name,
            description: formData.description,
            duration_minutes: formData.duration_minutes,
            capacity: formData.capacity,
            level: formData.level,
            focus_area: formData.focus_area,
            color: formData.color,
          })
          .eq("id", editingClass.id);
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gym_id")
          .eq("id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (profile) {
          await supabase.from("class_templates").insert({
            gym_id: profile.gym_id,
            name: formData.name,
            description: formData.description,
            duration_minutes: formData.duration_minutes,
            capacity: formData.capacity,
            level: formData.level,
            focus_area: formData.focus_area,
            color: formData.color,
            sections,
          });
        }
      }

      setIsDialogOpen(false);
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cls: ClassTemplate) => {
    if (confirm("¿Estás seguro de eliminar esta clase?")) {
      await supabase
        .from("class_templates")
        .update({ is_active: false })
        .eq("id", cls.id);
      fetchClasses();
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : classes.length === 0 ? (
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Editar Clase" : "Nueva Clase"}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? "Actualiza la información de la clase"
                : "Crea una nueva plantilla de clase"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la clase</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="WOD General"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción opcional de la clase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: parseInt(e.target.value) || 60,
                    })
                  }
                  min={15}
                  max={180}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Cupos</Label>
                <Input
                  id="capacity"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      level: value as typeof formData.level,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_levels">Todos los niveles</SelectItem>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Enfoque</Label>
              <div className="flex flex-wrap gap-2">
                {["crossfit", "strength", "cardio", "olympic", "gymnastics", "endurance"].map(
                  (area) => (
                    <Badge
                      key={area}
                      variant={
                        formData.focus_area.includes(area)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.focus_area.includes(area)) {
                          setFormData({
                            ...formData,
                            focus_area: formData.focus_area.filter(
                              (a) => a !== area
                            ),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            focus_area: [...formData.focus_area, area],
                          });
                        }
                      }}
                    >
                      {area}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
