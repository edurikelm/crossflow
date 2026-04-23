"use client";

import { useState, useCallback } from "react";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Ticket, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TicketWithDetails } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketSchema, type TicketInput } from "@/lib/validations";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

interface TicketsViewProps {
  initialTickets: TicketWithDetails[];
}

export function TicketsView({ initialTickets }: TicketsViewProps) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
    },
  });

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/tickets${params.toString() ? `?${params}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  }, [statusFilter]);

  const filteredTickets = tickets.filter((ticket) => {
    const athlete = ticket.athlete as { profile?: { full_name?: string } } | undefined;
    return (
      !searchQuery ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete?.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const onSubmit = async (data: TicketInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
        setIsDialogOpen(false);
        fetchTickets();
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticket: TicketWithDetails, newStatus: string) => {
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTickets();
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage) return;

    await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyMessage }),
    });

    await fetch(`/api/tickets/${selectedTicket.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });

    setReplyMessage("");
    setIsReplyDialogOpen(false);
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Gestiona las consultas y soporte de atletas"
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por asunto o atleta..."
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
            <SelectItem value="open">Abiertos</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="resolved">Resueltos</SelectItem>
            <SelectItem value="closed">Cerrados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asunto</TableHead>
              <TableHead>Atleta</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron tickets
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => {
                const athlete = ticket.athlete as { profile?: { full_name?: string } } | undefined;
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{ticket.subject}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {athlete?.profile?.full_name || "Sistema"}
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[ticket.status]}>
                        {ticket.status === "open"
                          ? "Abierto"
                          : ticket.status === "in_progress"
                          ? "En progreso"
                          : ticket.status === "resolved"
                          ? "Resuelto"
                          : "Cerrado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsReplyDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
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
            <DialogTitle className="text-left uppercase tracking-wide">Crear Ticket</DialogTitle>
            <DialogDescription className="text-left mt-1">
              Crea un nuevo ticket de soporte
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs text-on_surface_variant uppercase tracking-wider">Asunto</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="No puedo reservar clase"
                className="h-11"
              />
              {errors.subject && (
                <p className="text-xs text-error">{errors.subject.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs text-on_surface_variant uppercase tracking-wider">Descripcion</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md bg-surface_container_high px-3 py-3 text-sm text-surface-foreground placeholder:text-on_surface_variant focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary resize-none"
                id="description"
                {...register("description")}
                placeholder="Describe tu consulta..."
                rows={4}
              />
              {errors.description && (
                <p className="text-xs text-error">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs text-on_surface_variant uppercase tracking-wider">Prioridad</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as "low" | "medium" | "high" | "urgent")}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-xs text-error">{errors.priority.message}</p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-2">
              <Button variant="outline" type="button" className="flex-1 h-11" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
                {isSubmitting ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="w-full max-w-md bg-surface_container_low rounded-md p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogTitle className="text-left uppercase tracking-wide">{selectedTicket?.subject}</DialogTitle>
            <DialogDescription className="text-left mt-1">
              Respuesta al ticket de{" "}
              {selectedTicket?.athlete?.profile?.full_name || "Sistema"}
            </DialogDescription>
          </div>
          <div className="px-6 pb-4 space-y-4">
            <div className="rounded-md bg-surface_container_high p-4">
              <p className="text-sm text-on_surface_variant">{selectedTicket?.description}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-on_surface_variant uppercase tracking-wider">Tu respuesta</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md bg-surface_container_high px-3 py-3 text-sm text-surface-foreground placeholder:text-on_surface_variant focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary resize-none"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={4}
              />
            </div>
            {selectedTicket && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => handleStatusChange(selectedTicket, "resolved")}
                >
                  Marcar resuelto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => handleStatusChange(selectedTicket, "closed")}
                >
                  Cerrar ticket
                </Button>
              </div>
            )}
            <div className="flex gap-3 p-6 pt-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setIsReplyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReply} disabled={!replyMessage} className="flex-1 h-11">
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}