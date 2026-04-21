"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { CoachWithProfile } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { coachSchema, type CoachInput } from "@/lib/validations";

const SPECIALTIES = ["crossfit", "weightlifting", "gymnastics", "cardio", "nutrition", "mobility"];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<CoachWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CoachInput>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      specialty: [],
      bio: "",
      hourly_rate: undefined,
    },
  });

  const specialtyValue = watch("specialty") || [];

  const fetchCoaches = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/coaches${params}`);
      if (res.ok) {
        const data = await res.json();
        setCoaches(data);
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const filteredCoaches = coaches.filter((coach) => {
    const profile = coach.profile as { full_name?: string; email?: string } | undefined;
    return (
      !searchQuery ||
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const onSubmit = async (data: CoachInput) => {
    setIsSubmitting(true);
    try {
      if (editingCoach) {
        const res = await fetch(`/api/coaches/${editingCoach.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          console.error("API Error:", errorData);
          throw new Error("Failed to update coach");
        }
      } else {
        const res = await fetch("/api/coaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          console.error("API Error:", errorData);
          throw new Error("Failed to create coach: " + (errorData.error || "Unknown error"));
        }
      }

      reset();
      setIsDialogOpen(false);
      setEditingCoach(null);
      fetchCoaches();
    } catch (error) {
      console.error("Error saving coach:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = (coach?: CoachWithProfile) => {
    if (coach) {
      setEditingCoach(coach);
      const profile = coach.profile as { full_name?: string; email?: string; phone?: string } | undefined;
      reset({
        full_name: profile?.full_name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        specialty: coach.specialty || [],
        bio: coach.bio || "",
        hourly_rate: coach.hourly_rate ?? undefined,
      });
    } else {
      setEditingCoach(null);
      reset({
        full_name: "",
        email: "",
        phone: "",
        specialty: [],
        bio: "",
        hourly_rate: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (coach: CoachWithProfile) => {
    if (confirm("¿Estás seguro de eliminar este coach?")) {
      await fetch(`/api/coaches/${coach.id}`, { method: "DELETE" });
      fetchCoaches();
    }
  };

  const toggleSpecialty = (spec: string) => {
    const current = specialtyValue;
    const updated = current.includes(spec)
      ? current.filter((s) => s !== spec)
      : [...current, spec];
    setValue("specialty", updated);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coaches"
        description="Gestiona los entrenadores de tu gimnasio"
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Coach
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado por</TableHead>
              <TableHead>Fecha creación</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredCoaches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron coaches
                </TableCell>
              </TableRow>
            ) : (
              filteredCoaches.map((coach) => {
                return (
                <TableRow key={coach.id}>
                  <TableCell className="font-medium">
                    {coach.full_name || "Sin nombre"}
                  </TableCell>
                  <TableCell>{coach.email || "-"}</TableCell>
                  <TableCell>{coach.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {coach.specialty?.slice(0, 2).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {coach.specialty?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{coach.specialty.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coach.is_active ? "success" : "secondary"}>
                      {coach.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(coach as unknown as { profiles?: { full_name?: string } })?.profiles?.full_name || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(coach.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(coach)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(coach)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCoach ? "Editar Coach" : "Nuevo Coach"}
            </DialogTitle>
            <DialogDescription>
              {editingCoach
                ? "Actualiza la información del coach"
                : "Ingresa los datos del nuevo coach"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="Carlos García"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="carlos@email.com"
                  disabled={!!editingCoach}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+54 11 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Tarifa por hora</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  {...register("hourly_rate", { valueAsNumber: true })}
                  placeholder="25.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((spec) => (
                  <Badge
                    key={spec}
                    variant={specialtyValue.includes(spec) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialty(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
              {errors.specialty && (
                <p className="text-sm text-destructive">{errors.specialty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Input
                id="bio"
                {...register("bio")}
                placeholder="Breve descripción del coach..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}