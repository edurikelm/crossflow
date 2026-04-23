"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { AthleteWithProfile, MembershipPlan } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { athleteSchema, type AthleteInput } from "@/lib/validations";

interface AthletesViewProps {
  initialAthletes: AthleteWithProfile[];
  initialPlans: MembershipPlan[];
}

export function AthletesView({ initialAthletes, initialPlans }: AthletesViewProps) {
  const [athletes, setAthletes] = useState<AthleteWithProfile[]>(initialAthletes);
  const [membershipPlans] = useState<MembershipPlan[]>(initialPlans);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<AthleteWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AthleteInput>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      current_level: "beginner",
      plan_id: undefined,
    },
  });

  const currentLevelValue = watch("current_level");
  const planIdValue = watch("plan_id");

  const fetchAthletes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter === "active") params.set("status", "active");
      else if (statusFilter === "inactive") params.set("status", "expired");

      const res = await fetch(`/api/athletes${params.toString() ? `?${params}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setAthletes(data);
      }
    } catch (error) {
      console.error("Error fetching athletes:", error);
    }
  }, [searchQuery, statusFilter]);

  const onSubmit = async (data: AthleteInput) => {
    setIsSubmitting(true);
    try {
      if (editingAthlete) {
        const res = await fetch(`/api/athletes/${editingAthlete.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update athlete");
      } else {
        const res = await fetch("/api/athletes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create athlete");
      }

      reset();
      setIsDialogOpen(false);
      setEditingAthlete(null);
      fetchAthletes();
    } catch (error) {
      console.error("Error saving athlete:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = (athlete?: AthleteWithProfile) => {
    if (athlete) {
      setEditingAthlete(athlete);
      const profile = athlete.profile as { full_name?: string; email?: string; phone?: string } | undefined;
      const membership = athlete.membership?.[0];
      reset({
        full_name: profile?.full_name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        emergency_contact: athlete.emergency_contact || "",
        emergency_phone: athlete.emergency_phone || "",
        health_notes: athlete.health_notes || "",
        current_level: athlete.current_level,
        plan_id: membership?.plan?.id || undefined,
      });
    } else {
      setEditingAthlete(null);
      reset({
        full_name: "",
        email: "",
        phone: "",
        emergency_contact: "",
        emergency_phone: "",
        health_notes: "",
        current_level: "beginner",
        plan_id: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (athlete: AthleteWithProfile) => {
    if (confirm("¿Estás seguro de eliminar este atleta?")) {
      await fetch(`/api/athletes/${athlete.id}`, { method: "DELETE" });
      fetchAthletes();
    }
  };

  const getStatusBadge = (athlete: AthleteWithProfile, membership?: { status?: string }) => {
    if (!athlete.is_active) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (membership?.status === "active") {
      return <Badge variant="success">Activo</Badge>;
    }
    return <Badge variant="warning">Vencido</Badge>;
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const profile = athlete.profile as { full_name?: string; email?: string } | undefined;
    const matchesSearch =
      !searchQuery ||
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && athlete.is_active) ||
      (statusFilter === "inactive" && !athlete.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atletas"
        description="Gestiona los atletas de tu gimnasio"
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Atleta
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAthletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron atletas
                </TableCell>
              </TableRow>
            ) : (
              filteredAthletes.map((athlete) => {
                const profile = athlete.profile as { full_name?: string; email?: string; phone?: string } | undefined;
                const membership = athlete.membership?.[0];
                const plan = membership?.plan;
                return (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">
                      {profile?.full_name || "Sin nombre"}
                    </TableCell>
                    <TableCell>{profile?.email}</TableCell>
                    <TableCell>{profile?.phone || "-"}</TableCell>
                    <TableCell>
                      {plan?.name || "Sin plan"}
                    </TableCell>
                    <TableCell>
                      {plan ? `$${plan.price.toLocaleString('es-AR')}` : "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {athlete.current_level?.replace("_", " ") || "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(athlete, membership)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(athlete)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(athlete)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogTitle className="text-left uppercase tracking-wide">
              {editingAthlete ? "Editar Atleta" : "Nuevo Atleta"}
            </DialogTitle>
            <DialogDescription className="text-left mt-1">
              {editingAthlete
                ? "Actualiza la informacion del atleta"
                : "Ingresa los datos del nuevo atleta"}
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs text-on_surface_variant uppercase tracking-wider">Nombre</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="Juan Perez"
                  className="h-11"
                />
                {errors.full_name && (
                  <p className="text-xs text-error">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-on_surface_variant uppercase tracking-wider">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="juan@email.com"
                  disabled={!!editingAthlete}
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-xs text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-on_surface_variant uppercase tracking-wider">Telefono</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+54 11 1234 5678"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="current_level" className="text-xs text-on_surface_variant uppercase tracking-wider">Nivel</Label>
                <Select
                  value={currentLevelValue || "beginner"}
                  onValueChange={(value) => setValue("current_level", value as "beginner" | "intermediate" | "advanced" | "all_levels")}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                    <SelectItem value="all_levels">Todos los niveles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact" className="text-xs text-on_surface_variant uppercase tracking-wider">Contacto emergencia</Label>
                <Input
                  id="emergency_contact"
                  {...register("emergency_contact")}
                  placeholder="Maria Perez"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergency_phone" className="text-xs text-on_surface_variant uppercase tracking-wider">Tel. emergencia</Label>
                <Input
                  id="emergency_phone"
                  {...register("emergency_phone")}
                  placeholder="+54 11 8765 4321"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="health_notes" className="text-xs text-on_surface_variant uppercase tracking-wider">Notas de salud</Label>
              <Input
                id="health_notes"
                {...register("health_notes")}
                placeholder="Alergias, lesiones, etc."
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan_id" className="text-xs text-on_surface_variant uppercase tracking-wider">Plan de membresia</Label>
              <Select
                value={planIdValue || ""}
                onValueChange={(value) => setValue("plan_id", value || undefined)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar plan..." />
                </SelectTrigger>
                <SelectContent>
                  {membershipPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price.toLocaleString('es-AR')} ({plan.duration_days} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 p-6 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingAthlete(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}