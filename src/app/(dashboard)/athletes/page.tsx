"use client";

import { useState, useEffect } from "react";
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
import { MoreHorizontal, Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
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

  const fetchAthletes = async () => {
    setIsLoading(true);
    const query = supabase
      .from("athletes")
      .select(`
        *,
        profile:profile_id (*),
        memberships (
          *,
          plan:membership_plan_id (*)
        )
      `)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (data) {
      const athletesWithActiveMembership = data.map((athlete) => ({
        ...athlete,
        membership: athlete.memberships?.find((m: MembershipWithPlan) => m.status === "active"),
      }));
      setAthletes(athletesWithActiveMembership);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAthletes();
  }, []);

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch =
      !searchQuery ||
      athlete.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());

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
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            phone: data.phone,
          })
          .eq("id", editingAthlete.profile_id);

        if (!error) {
          await supabase
            .from("athletes")
            .update({
              emergency_contact: data.emergency_contact,
              emergency_phone: data.emergency_phone,
              health_notes: data.health_notes,
              current_level: data.current_level,
            })
            .eq("id", editingAthlete.id);
        }
      } else {
        const { data: authData } = await supabase.auth.admin.createUser({
          email: data.email,
          password: Math.random().toString(36).slice(-8), // eslint-disable-line react-hooks/purity
          user_metadata: { full_name: data.full_name },
        });

        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("gym_id")
            .eq("id", authData.user.id)
            .single();

          if (profile) {
            await supabase.from("athletes").insert({
              profile_id: authData.user.id,
              gym_id: profile.gym_id,
              emergency_contact: data.emergency_contact,
              emergency_phone: data.emergency_phone,
              health_notes: data.health_notes,
              current_level: data.current_level || "beginner",
            });
          }
        }
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
    reset({
      full_name: athlete.profile?.full_name || "",
      email: athlete.profile?.email || "",
      phone: athlete.profile?.phone || "",
      emergency_contact: athlete.emergency_contact || "",
      emergency_phone: athlete.emergency_phone || "",
      health_notes: athlete.health_notes || "",
      current_level: athlete.current_level,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (athlete: AthleteWithProfile) => {
    if (confirm("¿Estás seguro de eliminar este atleta?")) {
      await supabase.from("athletes").delete().eq("id", athlete.id);
      if (athlete.profile_id) {
        await supabase.auth.admin.deleteUser(athlete.profile_id);
      }
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
              filteredAthletes.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell className="font-medium">
                    {athlete.profile?.full_name || "Sin nombre"}
                  </TableCell>
                  <TableCell>{athlete.profile?.email}</TableCell>
                  <TableCell>{athlete.profile?.phone || "-"}</TableCell>
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
              ))
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
                    reset({
                      full_name: editingAthlete?.profile?.full_name || "",
                      email: editingAthlete?.profile?.email || "",
                      phone: editingAthlete?.profile?.phone || "",
                      emergency_contact: editingAthlete?.emergency_contact || "",
                      emergency_phone: editingAthlete?.emergency_phone || "",
                      health_notes: editingAthlete?.health_notes || "",
                      current_level: value as "beginner" | "intermediate" | "advanced" | "all_levels"
                    })
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
