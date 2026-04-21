"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Ticket, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TicketWithDetails, TicketPriority } from "@/types";
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
    },
  });

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredTickets.length === 0 ? (
              <TableCell colSpan={6} className="text-center py-8">
                No se encontraron tickets
              </TableCell>
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
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Ticket</DialogTitle>
            <DialogDescription>
              Crea un nuevo ticket de soporte
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="No puedo reservar clase"
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe tu consulta..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <select {...register("priority")} className="w-full p-2 border rounded">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              Respuesta al ticket de{" "}
              {selectedTicket?.athlete?.profile?.full_name || "Sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">{selectedTicket?.description}</p>
            </div>
            <div className="space-y-2">
              <Label>Tu respuesta</Label>
              <Textarea
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
                  onClick={() => handleStatusChange(selectedTicket, "resolved")}
                >
                  Marcar como resuelto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(selectedTicket, "closed")}
                >
                  Cerrar ticket
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReply} disabled={!replyMessage}>
              Enviar respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
