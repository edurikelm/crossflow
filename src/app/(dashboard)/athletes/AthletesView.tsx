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
import { MoreHorizontal, Plus, Search, Pencil, Trash2, Info } from "lucide-react";
import type { AthleteWithProfile, MembershipPlan, AthleteStatusOverride } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { athleteSchema, type AthleteInput } from "@/lib/validations";
import { computeAthleteStatus, getBadgeVariantForStatus } from "@/lib/athletes";

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
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    athlete: AthleteWithProfile;
    newOverride: AthleteStatusOverride | null;
    step: 'confirm' | 'trial_date';
  } | null>(null);
  const [trialDateValue, setTrialDateValue] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    athleteId: string;
    oldOverride: AthleteStatusOverride | null;
    oldTrialEndsAt: string | null;
  } | null>(null);

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
      if (statusFilter !== "all") params.set("status", statusFilter);

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
        const body: Record<string, unknown> = { ...data };
        if (data.plan_id) {
          if (editingAthlete.status_override === "trial" || editingAthlete.status_override === "paused") {
            body.status_override = null;
          }
        }
        if (editingAthlete.status_override === "trial" && trialEndsAt) {
          body.trial_ends_at = trialEndsAt;
        }
        const res = await fetch(`/api/athletes/${editingAthlete.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
      setTrialEndsAt("");
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
      setTrialEndsAt(athlete.trial_ends_at || "");
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
      const future = new Date();
      future.setDate(future.getDate() + 7);
      setTrialEndsAt(future.toISOString().split("T")[0]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (athlete: AthleteWithProfile) => {
    if (confirm("¿Estás seguro de eliminar este atleta?")) {
      await fetch(`/api/athletes/${athlete.id}`, { method: "DELETE" });
      fetchAthletes();
    }
  };

  const getStatusLabel = (override: AthleteStatusOverride | null) => {
    switch (override) {
      case null: return "Activo";
      case "trial": return "Prueba";
      case "paused": return "Pausado";
      case "suspended": return "Suspendido";
      case "inactive": return "Inactivo";
      default: return "-";
    }
  };

  const handleStatusChange = async (
    athlete: AthleteWithProfile,
    newOverride: AthleteStatusOverride | null,
    trialEndsAt: string | null,
  ) => {
    const oldOverride = athlete.status_override;
    const oldTrialEndsAt = athlete.trial_ends_at;

    setAthletes(prev => prev.map(a => a.id === athlete.id ? {
      ...a,
      status_override: newOverride,
      trial_ends_at: trialEndsAt,
      computed_status: computeAthleteStatus({
        ...a,
        status_override: newOverride,
        trial_ends_at: trialEndsAt,
      }, a.membership?.[0]),
    } : a));

    try {
      const res = await fetch(`/api/athletes/${athlete.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_override: newOverride, trial_ends_at: trialEndsAt }),
      });

      if (!res.ok) {
        setAthletes(prev => prev.map(a => a.id === athlete.id ? {
          ...a,
          status_override: oldOverride,
          trial_ends_at: oldTrialEndsAt,
          computed_status: computeAthleteStatus({
            ...a,
            status_override: oldOverride,
            trial_ends_at: oldTrialEndsAt,
          }, a.membership?.[0]),
        } : a));
        return;
      }

      setToast({
        message: `Estado cambiado a ${getStatusLabel(newOverride)}`,
        athleteId: athlete.id,
        oldOverride,
        oldTrialEndsAt,
      });
    } catch {
      setAthletes(prev => prev.map(a => a.id === athlete.id ? {
        ...a,
        status_override: oldOverride,
        trial_ends_at: oldTrialEndsAt,
        computed_status: computeAthleteStatus({
          ...a,
          status_override: oldOverride,
          trial_ends_at: oldTrialEndsAt,
        }, a.membership?.[0]),
      } : a));
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { athlete, newOverride, step } = pendingStatusChange;
    setPendingStatusChange(null);
    if (step === 'trial_date') {
      await handleStatusChange(athlete, newOverride, trialDateValue);
    } else {
      await handleStatusChange(athlete, newOverride, athlete.trial_ends_at);
    }
  };

  const handleUndo = async () => {
    if (!toast) return;
    const athlete = athletes.find(a => a.id === toast.athleteId);
    if (!athlete) return;
    await handleStatusChange(athlete, toast.oldOverride, toast.oldTrialEndsAt);
    setToast(null);
  };

  const getStatusBadge = (athlete: AthleteWithProfile) => {
    const status = athlete.computed_status || computeAthleteStatus(athlete);
    const labels: Record<string, string> = {
      active: "Activo",
      trial: "Prueba",
      expired: "Vencido",
      paused: "Pausado",
      suspended: "Suspendido",
      inactive: "Inactivo",
    };
    return <Badge variant={getBadgeVariantForStatus(status) as "success" | "warning" | "secondary" | "destructive"}>{labels[status] || "-"}</Badge>;
  };

  const getRemainingDays = (membership?: { end_date?: string }) => {
    if (!membership?.end_date) return "-";
    const now = new Date();
    const end = new Date(membership.end_date);
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = endDate.getTime() - nowDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Vencido";
    if (diffDays === 0) return "Hoy";
    return `${diffDays} días`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const profile = athlete.profile as { full_name?: string; email?: string } | undefined;
    const matchesSearch =
      !searchQuery ||
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const status = athlete.computed_status || computeAthleteStatus(athlete);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (status === "active" || status === "trial")) ||
      status === statusFilter;

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
            <SelectItem value="trial">En prueba</SelectItem>
            <SelectItem value="paused">Pausados</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
            <SelectItem value="expired">Vencidos</SelectItem>
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
              <TableHead>Tiempo restante</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAthletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
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
                    <TableCell>{getRemainingDays(membership)}</TableCell>
                    <TableCell>{formatDate(membership?.start_date)}</TableCell>
                    <TableCell>{formatDate(membership?.end_date)}</TableCell>
                    <TableCell className="capitalize">
                      {athlete.current_level?.replace("_", " ") || "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <span className="cursor-pointer">{getStatusBadge(athlete)}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleStatusChange(athlete, null, null)}>
                            Activo (automático)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTrialDateValue(athlete.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                            setPendingStatusChange({ athlete, newOverride: "trial", step: 'trial_date' });
                          }}>
                            En prueba
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(athlete, "paused", athlete.trial_ends_at)}>
                            Pausado
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(athlete, "suspended", athlete.trial_ends_at)}>
                            Suspendido
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPendingStatusChange({ athlete, newOverride: "inactive", step: 'confirm' })}>
                            Inactivo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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

            {editingAthlete && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-surface_container_low">
                <span className="text-xs text-on_surface_variant uppercase tracking-wider">Estado:</span>
                {getStatusBadge(editingAthlete)}
              </div>
            )}

            {!editingAthlete && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-surface_container_low">
                <Info className="h-4 w-4 text-on_surface_variant mt-0.5 shrink-0" />
                <p className="text-xs text-on_surface_variant">
                  Los nuevos atletas comienzan con estado de <strong>prueba</strong> por 7 días.
                  Al asignar un plan de membresía, pasarán automáticamente a activos.
                </p>
              </div>
            )}

            {editingAthlete && editingAthlete.status_override === "trial" && (
              <div className="space-y-1.5">
                <Label htmlFor="trial_ends_at" className="text-xs text-on_surface_variant uppercase tracking-wider">Fin del periodo de prueba</Label>
                <Input
                  id="trial_ends_at"
                  type="date"
                  value={trialEndsAt}
                  onChange={(e) => setTrialEndsAt(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

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

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md bg-surface_container_high px-4 py-3 shadow-lg">
          <span className="text-sm">{toast.message}</span>
          <button
            onClick={handleUndo}
            className="text-sm font-semibold text-primary underline"
          >
            Deshacer
          </button>
        </div>
      )}

      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPendingStatusChange(null)}>
          <div className="mx-4 w-full max-w-sm rounded-md bg-surface_container_low p-6" onClick={(e) => e.stopPropagation()}>
            {pendingStatusChange.step === 'confirm' ? (
              <>
                <h3 className="mb-2 text-lg font-bold">Confirmar cambio</h3>
                <p className="text-sm">
                  ¿Estás seguro de marcar a {pendingStatusChange.athlete.profile?.full_name || "este atleta"} como inactivo?
                </p>
                <p className="mt-1 text-xs text-on_surface_variant">
                  Este atleta no podrá reservar clases.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPendingStatusChange(null)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleConfirmStatusChange}>
                    Confirmar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-2 text-lg font-bold">Fecha de fin de prueba</h3>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider">Fecha de término</Label>
                  <Input
                    type="date"
                    value={trialDateValue}
                    onChange={(e) => setTrialDateValue(e.target.value)}
                    className="mt-1 h-11"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPendingStatusChange(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleConfirmStatusChange}>
                    Confirmar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}