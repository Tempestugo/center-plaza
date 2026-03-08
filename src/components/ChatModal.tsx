import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: number;
  reservation_id: number;
  sender_role: "admin" | "guest";
  content: string;
  read: number;
  created_at: string;
}

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  reservationId: number;
  guestName: string;
}

export default function ChatModal({ open, onClose, reservationId, guestName }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat/" + reservationId);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [open, reservationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/" + reservationId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim(), sender_role: "guest" }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
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

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-sm font-semibold">
            Chat — Reserva #{reservationId}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Tire dúvidas com nossa equipe</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-xs mt-1">Envie uma mensagem para falar com nossa equipe!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={"flex " + (msg.sender_role === "guest" ? "justify-end" : "justify-start")}>
                <div className={"max-w-[75%] rounded-2xl px-3 py-2 text-sm " + (msg.sender_role === "guest" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                  {msg.sender_role === "admin" && (
                    <p className="text-xs font-semibold mb-0.5 opacity-70">Equipe Center Plaza</p>
                  )}
                  <p>{msg.content}</p>
                  <p className="text-xs mt-1 opacity-60 text-right">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}