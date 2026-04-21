"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  DialogFooter,
  DialogHeader,
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
import type { AthleteWithProfile, MembershipWithPlan } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { athleteSchema, type AthleteInput } from "@/lib/validations";

export default function AthletesPage() {
  const supabase = createClient();
  const [athletes, setAthletes] = useState<AthleteWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<AthleteWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AthleteInput>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      current_level: "beginner",
    },
  });

  const fetchAthletes = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

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

  const handleEdit = (athlete: AthleteWithProfile) => {
    setEditingAthlete(athlete);
    const profile = athlete.profile as { full_name?: string; email?: string; phone?: string } | undefined;
    reset({
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      emergency_contact: athlete.emergency_contact || "",
      emergency_phone: athlete.emergency_phone || "",
      health_notes: athlete.health_notes || "",
      current_level: athlete.current_level,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (athlete: AthleteWithProfile) => {
    if (confirm("¿Estás seguro de eliminar este atleta?")) {
      await fetch(`/api/athletes/${athlete.id}`, { method: "DELETE" });
      fetchAthletes();
    }
  };

  const getStatusBadge = (athlete: AthleteWithProfile) => {
    if (!athlete.is_active) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (athlete.membership?.status === "active") {
      return <Badge variant="success">Activo</Badge>;
    }
    return <Badge variant="warning">Vencido</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atletas"
        description="Gestiona los atletas de tu gimnasio"
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Atleta
          </Button>
        }
      />

      {/* Filters */}
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

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredAthletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No se encontraron atletas
                </TableCell>
              </TableRow>
            ) : (
              filteredAthletes.map((athlete) => {
                const profile = athlete.profile as { full_name?: string; email?: string; phone?: string } | undefined;
                return (
                <TableRow key={athlete.id}>
                  <TableCell className="font-medium">
                    {profile?.full_name || "Sin nombre"}
                  </TableCell>
                  <TableCell>{profile?.email}</TableCell>
                  <TableCell>{profile?.phone || "-"}</TableCell>
                  <TableCell>
                    {athlete.membership?.plan?.name || "Sin plan"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {athlete.current_level?.replace("_", " ") || "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(athlete)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(athlete)}>
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
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAthlete ? "Editar Atleta" : "Nuevo Atleta"}
            </DialogTitle>
            <DialogDescription>
              {editingAthlete
                ? "Actualiza la información del atleta"
                : "Ingresa los datos del nuevo atleta"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="Juan Pérez"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="juan@email.com"
                  disabled={!!editingAthlete}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
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
                <Label htmlFor="current_level">Nivel</Label>
                <Select
                  value={editingAthlete?.current_level || "beginner"}
                  onValueChange={(value) =>
                    setEditingAthlete((prev: AthleteWithProfile | null) => prev ? {
                      ...prev,
                      current_level: value as "beginner" | "intermediate" | "advanced" | "all_levels"
                    } : null)
                  }
                >
                  <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Contacto de emergencia</Label>
                <Input
                  id="emergency_contact"
                  {...register("emergency_contact")}
                  placeholder="María Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Teléfono de emergencia</Label>
                <Input
                  id="emergency_phone"
                  {...register("emergency_phone")}
                  placeholder="+54 11 8765 4321"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_notes">Notas de salud</Label>
              <Input
                id="health_notes"
                {...register("health_notes")}
                placeholder="Alergias, lesiones, etc."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingAthlete(null);
                  reset();
                }}
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
