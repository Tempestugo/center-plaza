import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { reservationService } from "@/services/api";

interface Message {
  id: number;
  reservation_id: number;
  sender_role: string;
  content: string;
  created_at: string;
}

interface Reservation {
  id: number;
  room_type_name?: string;
  status: string;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen]               = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRes, setSelectedRes] = useState<number | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [text, setText]               = useState("");
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [unread, setUnread]           = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Só mostrar se logado e não for admin
  if (!user || (user as any).role === "admin") return null;

  const email = (user as any).email;

  // Carregar reservas do usuário
  useEffect(() => {
    if (!email) return;
    fetch(`/api/reservations?guest_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then((data: Reservation[]) => {
        const active = data.filter(r => r.status !== "cancelled");
        setReservations(active);
        if (active.length > 0 && !selectedRes) setSelectedRes(active[0].id);
      })
      .catch(() => {});
  }, [email]);

  // Carregar mensagens quando abrir ou trocar reserva
  useEffect(() => {
    if (!selectedRes) return;
    loadMessages();
    if (open) {
      pollRef.current = setInterval(loadMessages, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedRes, open]);

  // Scroll para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedRes) return;
    try {
      const res = await fetch(`/api/chat/${selectedRes}`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setMessages(data);
      if (!open) {
        const adminMsgs = data.filter(m => m.sender_role === "admin");
        setUnread(adminMsgs.length);
      } else {
        setUnread(0);
      }
    } catch {}
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  const handleSend = async () => {
    if (!text.trim() || !selectedRes || sending) return;
    setSending(true);
    try {
      await fetch(`/api/chat/${selectedRes}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), sender_role: "guest" }),
      });
      setText("");
      await loadMessages();
    } catch {} finally {
      setSending(false);
    }
  };

  const fmtTime = (str: string) => {
    try { return new Date(str).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Janela de chat */}
      {open && (
        <div className="w-80 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "420px" }}>

          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Suporte Center Plaza</p>
              <p className="text-xs opacity-80">Responderemos em breve</p>
            </div>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/20 h-7 w-7"
              onClick={() => setOpen(false)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Seletor de reserva */}
          {reservations.length > 1 && (
            <div className="px-3 pt-2">
              <select
                className="w-full text-xs border rounded p-1 bg-background"
                value={selectedRes ?? ""}
                onChange={e => setSelectedRes(Number(e.target.value))}
              >
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>
                    Reserva #{r.id} — {r.room_type_name || "Quarto"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {reservations.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs pt-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Faça uma reserva para iniciar o chat com nossa equipe.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs pt-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Nenhuma mensagem ainda. Diga olá!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id}
                  className={`flex ${msg.sender_role === "guest" ? "justify-end" : "justify-start"}`}>
                  <div className={[
                    "max-w-[75%] rounded-2xl px-3 py-2 text-xs",
                    msg.sender_role === "guest"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  ].join(" ")}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 ${msg.sender_role === "guest" ? "opacity-70 text-right" : "opacity-50"}`}>
                      {fmtTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {reservations.length > 0 && (
            <div className="p-3 border-t flex gap-2">
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Digite sua mensagem..."
                className="text-xs h-8"
                disabled={sending}
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={sending || !text.trim()}>
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform relative"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500">
            {unread}
          </Badge>
        )}
      </button>

    </div>
  );
}