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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Plus, Trash2 } from "lucide-react";
import type { Gym, MembershipPlan } from "@/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [gym, setGym] = useState<Gym | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [gymData, setGymData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    primary_color: "#3B82F6",
    accent_color: "#10B981",
  });

  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    duration_days: "30",
    classes_per_week: "",
    unlimited_classes: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        const { data: gymData } = await supabase
          .from("gyms")
          .select("*")
          .eq("id", profile.gym_id)
          .single();

        const { data: plansData } = await supabase
          .from("membership_plans")
          .select("*")
          .eq("gym_id", profile.gym_id)
          .eq("is_active", true)
          .order("price");

        if (gymData) {
          setGym(gymData);
          setGymData({
            name: gymData.name || "",
            email: gymData.email || "",
            phone: gymData.phone || "",
            address: gymData.address || "",
            primary_color: gymData.primary_color || "#3B82F6",
            accent_color: gymData.accent_color || "#10B981",
          });
        }

        if (plansData) setPlans(plansData);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleSaveGym = async () => {
    if (!gym) return;
    setIsSaving(true);

    await supabase
      .from("gyms")
      .update(gymData)
      .eq("id", gym.id);

    setIsSaving(false);
  };

  const handleCreatePlan = async () => {
    if (!gym || !newPlan.name || !newPlan.price) return;

    await supabase.from("membership_plans").insert({
      gym_id: gym.id,
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      duration_days: parseInt(newPlan.duration_days) || 30,
      classes_per_week: newPlan.classes_per_week
        ? parseInt(newPlan.classes_per_week)
        : null,
      unlimited_classes: newPlan.unlimited_classes,
    });

    const { data: plansData } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("gym_id", gym.id)
      .eq("is_active", true)
      .order("price");

    if (plansData) setPlans(plansData);
    setNewPlan({
      name: "",
      price: "",
      duration_days: "30",
      classes_per_week: "",
      unlimited_classes: false,
    });
  };

  const handleDeletePlan = async (plan: MembershipPlan) => {
    if (!confirm("¿Eliminar este plan?")) return;

    await supabase
      .from("membership_plans")
      .update({ is_active: false })
      .eq("id", plan.id);

    setPlans(plans.filter((p) => p.id !== plan.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Administra la configuración de tu gimnasio"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gym Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Datos del Gimnasio
            </CardTitle>
            <CardDescription>
              Actualiza la información de tu gimnasio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={gymData.name}
                onChange={(e) =>
                  setGymData({ ...gymData, name: e.target.value })
                }
                placeholder="CrossFit Box"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={gymData.email}
                  onChange={(e) =>
                    setGymData({ ...gymData, email: e.target.value })
                  }
                  placeholder="info@crossfit.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={gymData.phone}
                  onChange={(e) =>
                    setGymData({ ...gymData, phone: e.target.value })
                  }
                  placeholder="+54 11 1234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={gymData.address}
                onChange={(e) =>
                  setGymData({ ...gymData, address: e.target.value })
                }
                placeholder="Av. Principal 123, Ciudad"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color principal</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={gymData.primary_color}
                    onChange={(e) =>
                      setGymData({ ...gymData, primary_color: e.target.value })
                    }
                    className="w-12 p-1"
                  />
                  <Input
                    value={gymData.primary_color}
                    onChange={(e) =>
                      setGymData({ ...gymData, primary_color: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color de acento</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={gymData.accent_color}
                    onChange={(e) =>
                      setGymData({ ...gymData, accent_color: e.target.value })
                    }
                    className="w-12 p-1"
                  />
                  <Input
                    value={gymData.accent_color}
                    onChange={(e) =>
                      setGymData({ ...gymData, accent_color: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveGym} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* Membership Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                $
              </Badge>
              Planes de Membresía
            </CardTitle>
            <CardDescription>
              Configura los planes disponibles para tus atletas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Plans */}
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${plan.price} / {plan.duration_days} días
                      {plan.classes_per_week && ` • ${plan.classes_per_week} clases/semana`}
                      {plan.unlimited_classes && " • Clases ilimitadas"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePlan(plan)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* New Plan Form */}
            <div className="space-y-2">
              <Label>Nuevo Plan</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  placeholder="Nombre del plan"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, price: e.target.value })
                    }
                    placeholder="Precio"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={newPlan.duration_days}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, duration_days: e.target.value })
                  }
                  placeholder="Días"
                />
                <Input
                  type="number"
                  value={newPlan.classes_per_week}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, classes_per_week: e.target.value })
                  }
                  placeholder="Clases/semana"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    setNewPlan({
                      ...newPlan,
                      unlimited_classes: !newPlan.unlimited_classes,
                    })
                  }
                >
                  {newPlan.unlimited_classes ? "Ilimitado" : "Limitado"}
                </Button>
              </div>
              <Button onClick={handleCreatePlan} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
