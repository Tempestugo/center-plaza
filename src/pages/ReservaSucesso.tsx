import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { gtmEvent } from "@/lib/gtm";

const fmt = (dateStr: string) => {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function ReservaSucesso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reservationId = searchParams.get("reservation_id");
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reservationId) return;
    
    const sessionId = searchParams.get("session_id");
    const url = sessionId 
      ? `/api/reservations/${reservationId}?session_id=${sessionId}`
      : `/api/reservations/${reservationId}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setReservation(data);
        
        // Evita disparo duplicado de conversão caso o usuário recarregue a página
        const trackedKey = `tracked_reserva_${reservationId}`;
        if (!sessionStorage.getItem(trackedKey)) {
          const totalVal = Number(data?.total_amount || 0);
          gtmEvent('purchase', {
            transaction_id: String(reservationId),
            value: totalVal,
            currency: 'BRL',
            reserva_id: String(reservationId),
            valor: totalVal
          });
          gtmEvent('reserva_confirmada', {
            transaction_id: String(reservationId),
            value: totalVal,
            currency: 'BRL',
            reserva_id: String(reservationId),
            valor: totalVal
          });
          sessionStorage.setItem(trackedKey, 'true');
        }
      })
      .finally(() => setLoading(false));
  }, [reservationId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">Reserva Confirmada!</h1>
            <p className="text-muted-foreground mt-2">Seu pagamento foi processado com sucesso.</p>
          </div>
          {reservation && (
            <div className="text-left space-y-2 text-sm border rounded-lg p-4 bg-card">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserva nº</span>
                <span className="font-mono font-semibold">#{reservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hóspede</span>
                <span>{reservation.guest_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span>{fmt(reservation.check_in_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span>{fmt(reservation.check_out_date)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Total pago</span>
                <span>R$ {reservation.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium text-sm">
              <Mail className="h-4 w-4 shrink-0" />
              <span>Confirmação enviada por e-mail</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enviamos os detalhes da sua reserva para{" "}
              {reservation?.guest_email ? (
                <strong className="text-foreground font-semibold">{reservation.guest_email}</strong>
              ) : (
                "o seu e-mail"
              )}.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 p-2.5 rounded mt-1">
              📌 <strong>Importante:</strong> Caso não encontre o e-mail na sua caixa de entrada, verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
            </p>
          </div>

          <Button className="w-full" onClick={() => navigate('/')}>
            Voltar para o início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}