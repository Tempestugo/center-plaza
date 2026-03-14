import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search, Filter, Eye, CheckCircle, XCircle, MessageSquare, RotateCcw,
  ChevronDown, RefreshCw, Loader2, Send, X, Phone, Mail,
  Calendar, Users, DollarSign, Hotel
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { reservationService, chatService, Reservation, Message } from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig = {
  pending:   { label: "Pendente",   color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmada", color: "bg-green-100  text-green-800  border-green-200"  },
  cancelled: { label: "Cancelada",  color: "bg-red-100    text-red-800    border-red-200"    },
};

const fmt = (dateStr: string) =>
  format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

// ─── Sub-componente: Modal de Chat ────────────────────────────────────────────

function ChatModal({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatus = async (id: number, status: 'confirmed' | 'cancelled' | 'pending') => {
    try {
      await fetch('/api/reservations/' + id + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const messages = { confirmed: 'Reserva confirmada!', cancelled: 'Reserva cancelada!', pending: 'Revertida para pendente!' };
      toast({ title: messages[status] });
      // loadReservations(); // Se necessário
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      const data = await chatService.getMessages(reservation.id);
      setMessages(data);
    } catch {
      toast({ title: "Erro ao carregar mensagens", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [reservation.id, toast]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // polling a cada 5s
    return () => clearInterval(interval);
  }, [loadMessages]);

  const sendMessage = async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      await chatService.sendMessage(reservation.id, content);
      setText("");
      await loadMessages();
    } catch {
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-base">
            Chat — {reservation.guest_name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Reserva #{reservation.id} · {reservation.hotel_name}
          </p>
        </DialogHeader>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground pt-8">
              Nenhuma mensagem ainda.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    msg.sender_role === "admin"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.sender_role === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}>
                    {format(new Date(msg.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3 flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button size="icon" onClick={sendMessage} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-componente: Modal de Detalhes ────────────────────────────────────────

function DetailModal({
  reservation,
  onClose,
  onStatusChange,
}: {
  reservation: Reservation;
  onClose: () => void;
  onStatusChange: (id: number, status: "confirmed" | "cancelled" | "pending") => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatus = async (status: "confirmed" | "cancelled" | "pending") => {
    setLoading(true);
    try {
      await onStatusChange(reservation.id, status);
      onClose();
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(reservation.check_out_date).getTime() -
        new Date(reservation.check_in_date).getTime()) /
        86400000
    )
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reserva #{reservation.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status badge */}
          <Badge className={`${statusConfig[reservation.status].color} border`}>
            {statusConfig[reservation.status].label}
          </Badge>

          {/* Hóspede */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hóspede</p>
            <p className="font-medium">{reservation.guest_name}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5" /> {reservation.guest_email}
            </div>
            {reservation.guest_phone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" /> {reservation.guest_phone}
              </div>
            )}
          </div>

          {/* Acomodação */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acomodação</p>
            <div className="flex items-center gap-1.5 text-sm">
              <Hotel className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{reservation.hotel_name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{reservation.room_type_name}</p>
          </div>

          {/* Datas e valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Check-in</p>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {fmt(reservation.check_in_date)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Check-out</p>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {fmt(reservation.check_out_date)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Hóspedes</p>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {reservation.number_of_guests}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Total ({nights}n)</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <DollarSign className="w-3.5 h-3.5" />
                {fmtCurrency(reservation.total_amount)}
              </div>
            </div>
          </div>

          {reservation.special_requests && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Pedidos especiais</p>
              <p className="text-sm">{reservation.special_requests}</p>
            </div>
          )}

          {/* Ações */}
          {reservation.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatus("confirmed")}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                Confirmar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleStatus("cancelled")}
                disabled={loading}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Cancelar
              </Button>
            </div>
          )}
          {reservation.status === "cancelled" && (
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => handleStatus("pending")}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1.5" />}
                Reverter para Pendente
              </Button>
            </div>
          )}
          {reservation.status === "confirmed" && (
            <div className="flex gap-2 pt-1">
              <Button variant="destructive" className="flex-1" onClick={() => handleStatus("cancelled")} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                Cancelar Reserva
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AdminReservas() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const navigate = useNavigate();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [chatReservation, setChatReservation] = useState<Reservation | null>(null);
  const { toast } = useToast();
  const [lastGuestMessageId, setLastGuestMessageId] = useState(0);
  const [soundPlayCount, setSoundPlayCount] = useState<Record<number, number>>({});

  // ── Carrega reservas ────────────────────────────────────────────────────────
  const loadReservations = useCallback(async () => {
    try {
      const data = await reservationService.getAll();
      setReservations(data);
    } catch {
      toast({ title: "Erro ao carregar reservas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // ── Polling de mensagens para notificação sonora ────────────────────────────
  useEffect(() => {
    const checkNewMessages = async () => {
      try {
        const res = await fetch("/api/reservations");
        if (!res.ok) return;
        const reservations = await res.json();
        const active = reservations.filter((r: any) =>
          r.status === "confirmed" || r.status === "pending"
        ).slice(0, 5);

        for (const r of active) {
          const msgRes = await fetch(`/api/chat/${r.id}`);
          if (!msgRes.ok) continue;
          const msgs = await msgRes.json();
          const guestMsgs = msgs.filter((m: any) => m.sender_role === "guest");
          if (guestMsgs.length === 0) continue;
          const maxId = Math.max(...guestMsgs.map((m: any) => m.id));
          if (lastGuestMessageId > 0 && maxId > lastGuestMessageId) {
            setSoundPlayCount((prev) => {
              const count = prev[r.id] || 0;
              if (count < 3) {
                playNotificationSound();
              }
              return { ...prev, [r.id]: count + 1 };
            });
          }
          setLastGuestMessageId((prev) => Math.max(prev, maxId));
        }
      } catch (e) {}
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 15000);
    return () => clearInterval(interval);
  }, [lastGuestMessageId]);

  // ── Atualiza status ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id: number, status: "confirmed" | "cancelled" | "pending") => {
    await reservationService.updateStatus(id, status);
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    const messages = {
      confirmed: "Reserva confirmada!",
      cancelled: "Reserva cancelada",
      pending: "Reserva revertida para pendente",
    };
    toast({
      title: messages[status],
      variant: status === "cancelled" ? "destructive" : "default",
    });
  };

  // ── Abre modal de chat e marca lidas ────────────────────────────────────────
  const openChatModal = (reservation: Reservation) => {
    setChatReservation(reservation);
    setSoundPlayCount((prev) => ({ ...prev, [reservation.id]: 0 }));
    fetch(`/api/chat/${reservation.id}/read`, { method: 'PATCH' }).catch(() => {});
    setReservations((prev) =>
      prev.map((r) => r.id === reservation.id ? { ...r, unread_count: 0 } : r)
    );
  };

  // ── Filtragem ───────────────────────────────────────────────────────────────
  const filtered = reservations.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      r.guest_name.toLowerCase().includes(term) ||
      r.guest_email.toLowerCase().includes(term) ||
      String(r.id).includes(term) ||
      (r.hotel_name ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // ── Contadores por status ───────────────────────────────────────────────────
  const counts = {
    all:       reservations.length,
    pending:   reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  // ── Mensagens não lidas ─────────────────────────────────────────────────────
  const totalUnreadMessages = reservations.reduce((sum, r) => sum + (r.unread_count ?? 0), 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold">Reservas</h1>
        </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {counts.pending > 0 && (
              <span className="text-yellow-600 font-medium">{counts.pending} pendente{counts.pending > 1 ? "s" : ""} · </span>
            )}
            {counts.all} reserva{counts.all !== 1 ? "s" : ""} no total
          {totalUnreadMessages > 0 && (
            <span className="text-blue-600 font-medium">
              {' · '}{totalUnreadMessages} mensagem{totalUnreadMessages !== 1 ? "ns" : ""} não lida{totalUnreadMessages !== 1 ? "s" : ""}
            </span>
          )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadReservations}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por hóspede, e-mail, hotel ou ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({counts.all})</SelectItem>
            <SelectItem value="pending">Pendentes ({counts.pending})</SelectItem>
            <SelectItem value="confirmed">Confirmadas ({counts.confirmed})</SelectItem>
            <SelectItem value="cancelled">Canceladas ({counts.cancelled})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela / Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma reserva encontrada</p>
          <p className="text-sm mt-1">Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hóspede</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hotel / Quarto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check-in</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check-out</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">WhatsApp</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">#{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.guest_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.guest_phone ? (
                          <a href={"https://wa.me/55" + r.guest_phone.replace(/D/g,"")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L0 24l6.347-1.496A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.001-1.37l-.36-.214-3.713.876.938-3.591-.235-.371A9.795 9.795 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                            {r.guest_phone}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{r.guest_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.hotel_name}</p>
                      <p className="text-xs text-muted-foreground">{r.room_type_name}</p>
                    </td>
                    <td className="px-4 py-3">{fmt(r.check_in_date)}</td>
                    <td className="px-4 py-3">{fmt(r.check_out_date)}</td>
                    <td className="px-4 py-3 font-medium">{fmtCurrency(r.total_amount)}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusConfig[r.status].color} border text-xs`}>
                        {statusConfig[r.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "pending" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Confirmar"
                              onClick={() => handleStatusChange(r.id, "confirmed")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Cancelar"
                              onClick={() => handleStatusChange(r.id, "cancelled")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {r.status === "cancelled" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            title="Reverter para Pendente"
                            onClick={() => handleStatusChange(r.id, "pending")}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        {r.status === "confirmed" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Cancelar"
                            onClick={() => handleStatusChange(r.id, "cancelled")}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Ver detalhes"
                          onClick={() => setSelectedReservation(r)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 relative"
                          title="Chat"
                            onClick={() => openChatModal(r)}
                        >
                          <MessageSquare className="w-4 h-4" />
                            {(r.unread_count ?? 0) > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
                                {(r.unread_count ?? 0) > 9 ? "9+" : r.unread_count}
                              </span>
                            )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.guest_name}</p>
                    <p className="text-xs text-muted-foreground">#{r.id} · {r.hotel_name}</p>
                  </div>
                  <Badge className={`${statusConfig[r.status].color} border text-xs`}>
                    {statusConfig[r.status].label}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p>{fmt(r.check_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p>{fmt(r.check_out_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hóspedes</p>
                    <p>{r.number_of_guests}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium text-green-700">{fmtCurrency(r.total_amount)}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {r.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 h-8"
                        onClick={() => handleStatusChange(r.id, "confirmed")}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8"
                        onClick={() => handleStatusChange(r.id, "cancelled")}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                  {r.status === "cancelled" && (
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={() => handleStatusChange(r.id, "pending")}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reverter
                    </Button>
                  )}
                  {r.status === "confirmed" && (
                    <Button size="sm" variant="destructive" className="flex-1 h-8" onClick={() => handleStatusChange(r.id, "cancelled")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setSelectedReservation(r)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-blue-500 relative" onClick={() => openChatModal(r)}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    {(r.unread_count ?? 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
                        {(r.unread_count ?? 0) > 9 ? "9+" : r.unread_count}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modais */}
      {selectedReservation && (
        <DetailModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {chatReservation && (
        <ChatModal
          reservation={chatReservation}
          onClose={() => setChatReservation(null)}
        />
      )}
    </div>
  );
}