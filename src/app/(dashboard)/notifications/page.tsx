"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Bell, Send, Users, Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Notification } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  promotion: "bg-purple-100 text-purple-800",
  reminder: "bg-yellow-100 text-yellow-800",
  alert: "bg-red-100 text-red-800",
  announcement: "bg-green-100 text-green-800",
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    body: string;
    type: "info" | "promotion" | "reminder" | "alert" | "announcement";
    target_type: "all" | "active_members" | "expired_members";
    scheduled_for: string;
  }>({
    title: "",
    body: "",
    type: "info",
    target_type: "all",
    scheduled_for: "",
  });

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("gym_id", profile.gym_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase.from("notifications").insert({
          gym_id: profile.gym_id,
          title: formData.title,
          body: formData.body,
          type: formData.type,
          target_type: formData.target_type,
          scheduled_for: formData.scheduled_for || null,
          sent_at: formData.scheduled_for ? null : new Date().toISOString(),
        });

        setFormData({
          title: "",
          body: "",
          type: "info",
          target_type: "all",
          scheduled_for: "",
        });
        setIsDialogOpen(false);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        description="Envía mensajes a tu comunidad"
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Nueva Notificación
          </Button>
        }
      />

      {/* Quick Send Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            setFormData({
              ...formData,
              title: "Recordatorio de clase",
              body: "No olvides tu clase de mañana",
              type: "reminder",
              target_type: "all",
            });
            setIsDialogOpen(true);
          }}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Recordatorio</p>
              <p className="text-sm text-muted-foreground">Para todos</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            setFormData({
              ...formData,
              title: "Aviso importante",
              body: "",
              type: "alert",
              target_type: "all",
            });
            setIsDialogOpen(true);
          }}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-red-100 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Alerta</p>
              <p className="text-sm text-muted-foreground">Para emergencias</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            setFormData({
              ...formData,
              title: "Promoción especial",
              body: "",
              type: "promotion",
              target_type: "active_members",
            });
            setIsDialogOpen(true);
          }}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Promoción</p>
              <p className="text-sm text-muted-foreground">Solo activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de notificaciones</CardTitle>
          <CardDescription>
            Notificaciones enviadas anteriormente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay notificaciones enviadas
            </p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start gap-3">
                    <Bell
                      className={cn(
                        "mt-0.5 h-5 w-5",
                        notification.type === "info" && "text-blue-500",
                        notification.type === "promotion" && "text-purple-500",
                        notification.type === "reminder" && "text-yellow-500",
                        notification.type === "alert" && "text-red-500",
                        notification.type === "announcement" && "text-green-500"
                      )}
                    />
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={TYPE_COLORS[notification.type]}
                        >
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true, locale: es }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {notification.sent_at ? (
                    <Badge variant="success">Enviado</Badge>
                  ) : notification.scheduled_for ? (
                    <Badge variant="outline">
                      Programado{" "}
                      {formatDistanceToNow(
                        new Date(notification.scheduled_for),
                        { addSuffix: true, locale: es }
                      )}
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogTitle className="text-left uppercase tracking-wide">Nueva Notificacion</DialogTitle>
            <DialogDescription className="text-left mt-1">
              Envía un mensaje a tu comunidad
            </DialogDescription>
          </div>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Titulo</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Recordatorio de clase"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Mensaje</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md bg-surface_container_high px-3 py-3 text-sm text-surface-foreground placeholder:text-on_surface_variant focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary resize-none"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                placeholder="Escribe tu mensaje..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as typeof formData.type })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informacion</SelectItem>
                    <SelectItem value="promotion">Promocion</SelectItem>
                    <SelectItem value="reminder">Recordatorio</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="announcement">Anuncio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Destinatarios</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, target_type: value as typeof formData.target_type })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active_members">Solo activos</SelectItem>
                    <SelectItem value="expired_members">Solo vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Programar (opcional)</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_for}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_for: e.target.value })
                }
                className="h-11"
              />
            </div>

            <div className="flex gap-3 p-6 pt-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title || !formData.body}
                className="flex-1 h-11"
              >
                {isSubmitting
                  ? "Enviando..."
                  : formData.scheduled_for
                  ? "Programar"
                  : "Enviar ahora"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
