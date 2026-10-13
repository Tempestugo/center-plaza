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
    const delay = document.hidden ? 60000 : 15000;
    const interval = setInterval(() => fetchMessages(selectedReservation.id, true), delay);
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
    const interval = setInterval(checkUnread, document.hidden ? 120000 : 30000);
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
      window.open("https://wa.me/551132893757", "_blank");
      return;
    }
    setOpen(true);
    setView("list");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (location.pathname.startsWith("/admin")) return null;

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
                    href="https://wa.me/551132893757"
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

      {isAuthenticated ? (
        <button
          onClick={handleButtonClick}
          className="relative w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title="Chat de suporte"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      ) : (
        <a
          href="https://wa.me/551132893757?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20reservas%20no%20Center%20Plaza%20Hotel."
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Fale conosco no WhatsApp"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none" />
          <svg
            className="w-6 h-6 fill-current relative z-10"
            viewBox="0 0 24 24"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span className="text-xs sm:text-sm font-semibold tracking-wide pr-1 whitespace-nowrap">
            Fale Conosco
          </span>
        </a>
      )}
    </div>
  );
}