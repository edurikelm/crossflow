"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { MoreHorizontal, Plus, Search, Pencil, Trash2, UserCog } from "lucide-react";
import type { CoachWithProfile } from "@/types";

export default function CoachesPage() {
  const supabase = createClient();
  const [coaches, setCoaches] = useState<CoachWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialty: [] as string[],
    bio: "",
    hourly_rate: "",
  });

  const fetchCoaches = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("coaches")
      .select(`
        *,
        profile:profile_id (*)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setCoaches(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCoaches();
  }, []);

  const filteredCoaches = coaches.filter((coach) => {
    return (
      !searchQuery ||
      coach.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenDialog = (coach?: CoachWithProfile) => {
    if (coach) {
      setEditingCoach(coach);
      setFormData({
        full_name: coach.profile?.full_name || "",
        email: coach.profile?.email || "",
        phone: coach.profile?.phone || "",
        specialty: coach.specialty || [],
        bio: coach.bio || "",
        hourly_rate: coach.hourly_rate?.toString() || "",
      });
    } else {
      setEditingCoach(null);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        specialty: [],
        bio: "",
        hourly_rate: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingCoach) {
        await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
          })
          .eq("id", editingCoach.profile_id);

        await supabase
          .from("coaches")
          .update({
            specialty: formData.specialty,
            bio: formData.bio,
            hourly_rate: formData.hourly_rate
              ? parseFloat(formData.hourly_rate)
              : null,
          })
          .eq("id", editingCoach.id);
      } else {
        const { data: authData } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: Math.random().toString(36).slice(-8),
          user_metadata: { full_name: formData.full_name, role: "coach" },
        });

        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("gym_id")
            .eq("id", authData.user.id)
            .single();

          if (profile) {
            await supabase.from("coaches").insert({
              profile_id: authData.user.id,
              gym_id: profile.gym_id,
              specialty: formData.specialty,
              bio: formData.bio,
              hourly_rate: formData.hourly_rate
                ? parseFloat(formData.hourly_rate)
                : null,
            });
          }
        }
      }

      setIsDialogOpen(false);
      fetchCoaches();
    } catch (error) {
      console.error("Error saving coach:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (coach: CoachWithProfile) => {
    if (confirm("¿Estás seguro de eliminar este coach?")) {
      await supabase.from("coaches").delete().eq("id", coach.id);
      if (coach.profile_id) {
        await supabase.auth.admin.deleteUser(coach.profile_id);
      }
      fetchCoaches();
    }
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
              <TableHead className="w-[70px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredCoaches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron coaches
                </TableCell>
              </TableRow>
            ) : (
              filteredCoaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell className="font-medium">
                    {coach.profile?.full_name || "Sin nombre"}
                  </TableCell>
                  <TableCell>{coach.profile?.email}</TableCell>
                  <TableCell>{coach.profile?.phone || "-"}</TableCell>
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
              ))
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Carlos García"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="carlos@email.com"
                  disabled={!!editingCoach}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+54 11 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Tarifa por hora</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="25.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="flex flex-wrap gap-2">
                {["crossfit", "weightlifting", "gymnastics", "cardio", "nutrition", "mobility"].map(
                  (spec) => (
                    <Badge
                      key={spec}
                      variant={
                        formData.specialty.includes(spec)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.specialty.includes(spec)) {
                          setFormData({
                            ...formData,
                            specialty: formData.specialty.filter(
                              (s) => s !== spec
                            ),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            specialty: [...formData.specialty, spec],
                          });
                        }
                      }}
                    >
                      {spec}
                    </Badge>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Breve descripción del coach..."
              />
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
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.full_name || !formData.email}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
