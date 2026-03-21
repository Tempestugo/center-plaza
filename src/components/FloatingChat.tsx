import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2, ChevronLeft, MessageCircle } from "lucide-react";

interface Message {
  id: number;
  reservation_id: number;
  sender_role: "admin" | "guest";
  content: string;
  read: number;
  created_at: string;
}

interface Reservation {
  id: number;
  room_type_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export default function FloatingChat() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [lastMessageIds, setLastMessageIds] = useState<Record<number, number>>({});
  const [soundPlayCount, setSoundPlayCount] = useState<Record<number, number>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const email = (user as any)?.email;



  const fetchReservations = useCallback(async () => {
    if (!email) return;
    setLoadingReservations(true);
    try {
      const res = await fetch(`/api/reservations?guest_email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        const active = (Array.isArray(data) ? data : []).filter(
          (r: Reservation) => r.status === "confirmed" || r.status === "pending"
        );
        setReservations(active);
      }
    } catch (e) {
      console.error("Erro ao buscar reservas:", e);
    } finally {
      setLoadingReservations(false);
    }
  }, [email]);

  const fetchMessages = useCallback(async (reservationId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${reservationId}`);
      if (res.ok) {
        const data: Message[] = await res.json();
        const lastId = lastMessageIds[reservationId] || 0;
        const newAdminMessages = data.filter((m) => m.id > lastId && m.sender_role === "admin");
        if (lastId > 0 && newAdminMessages.length > 0) {
          setSoundPlayCount(prev => {
            const count = prev[reservationId] || 0;
            if (count < 3) playNotificationSound();
            return { ...prev, [reservationId]: count + 1 };
          });
        }
        if (data.length > 0) {
          setLastMessageIds((prev) => ({
            ...prev,
            [reservationId]: Math.max(...data.map((m) => m.id)),
          }));
        }
        setMessages(data);
        const unread = data.filter((m) => m.sender_role === "admin" && m.read === 0).length;
        setTotalUnread(unread);
      }
    } catch (e) {
      console.error("Erro ao buscar mensagens:", e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [lastMessageIds]);

  useEffect(() => {
    if (!open || view !== "chat" || !selectedReservation) return;
    fetchMessages(selectedReservation.id);
    const interval = setInterval(() => fetchMessages(selectedReservation.id, true), 5000);
    return () => clearInterval(interval);
  }, [open, view, selectedReservation?.id]);

  useEffect(() => {
    if (open && isAuthenticated) fetchReservations();
  }, [open, isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated || !email || open) return;
    const checkUnread = async () => {
      try {
        const res = await fetch(`/api/reservations?guest_email=${encodeURIComponent(email)}`);
        if (!res.ok) return;
        const data = await res.json();
        const active = (Array.isArray(data) ? data : []).filter(
          (r: Reservation) => r.status === "confirmed" || r.status === "pending"
        );
        let unread = 0;
        for (const r of active.slice(0, 3)) {
          const msgRes = await fetch(`/api/chat/${r.id}`);
          if (msgRes.ok) {
            const msgs: Message[] = await msgRes.json();
            const lastId = lastMessageIds[r.id] || 0;
            const newMsgs = msgs.filter((m) => m.id > lastId && m.sender_role === "admin");
            if (lastId > 0 && newMsgs.length > 0) {
              setSoundPlayCount(prev => {
                const count = prev[r.id] || 0;
                if (count < 3) playNotificationSound();
                return { ...prev, [r.id]: count + 1 };
              });
            }
            unread += msgs.filter((m) => m.sender_role === "admin" && m.read === 0).length;
          }
        }
        setTotalUnread(unread);
      } catch (e) {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, email, open]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedReservation) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${selectedReservation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim(), sender_role: "guest" }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchMessages(selectedReservation.id);
      }
    } catch (e) {
      console.error("Erro ao enviar:", e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openChat = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setView("chat");
    fetchMessages(reservation.id);
    setSoundPlayCount(prev => ({ ...prev, [reservation.id]: 0 }));
  };

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      window.open("https://wa.me/5511328937570", "_blank");
      return;
    }
    setOpen(true);
    setView("list");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (location.pathname.startsWith("/admin") || !user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "420px" }}
        >
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view === "chat" && (
                <button
                  onClick={() => { setView("list"); setSelectedReservation(null); }}
                  className="hover:opacity-70 transition-opacity mr-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {view === "list" ? "Suas Reservas" : `Reserva #${selectedReservation?.id}`}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>

          {view === "list" && (
            <div className="flex-1 overflow-y-auto">
              {loadingReservations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted-foreground text-sm space-y-3">
                  <p>Nenhuma reserva ativa encontrada.</p>
                  <a
                    href="https://wa.me/5511328937570"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Falar via WhatsApp
                  </a>
                </div>
              ) : (
                <div className="divide-y">
                  {reservations.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openChat(r)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium">{r.room_type_name || "Reserva"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        #{r.id} · {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                        r.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.status === "confirmed" ? "Confirmada" : "Pendente"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="mt-1">Envie uma mensagem para nossa equipe!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_role === "guest" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                        msg.sender_role === "guest"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        {msg.sender_role === "admin" && (
                          <p className="font-semibold opacity-70 mb-0.5">Equipe Center Plaza</p>
                        )}
                        <p>{msg.content}</p>
                        <p className="opacity-50 text-right mt-0.5">{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-3 py-2 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  disabled={sending}
                  className="flex-1 h-8 text-xs"
                />
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                >
                  {sending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Send className="h-3 w-3" />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleButtonClick}
        className="relative w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        title={isAuthenticated ? "Chat de suporte" : "Fale conosco no WhatsApp"}
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}