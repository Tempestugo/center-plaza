import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { gtmEvent } from "@/lib/gtm";

export default function ReservaSucesso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reservationId = searchParams.get("reservation_id");
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reservationId) return;
    // Buscar reserva pelo session_id do Stripe (mais seguro)
    const sessionId = searchParams.get("session_id");
    const url = sessionId 
      ? `/api/reservations/${reservationId}?session_id=${sessionId}`
      : `/api/reservations/${reservationId}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setReservation(data);
        gtmEvent('reserva_confirmada', { reserva_id: reservationId, valor: data?.total_amount });
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-600">Reserva Confirmada!</h1>
            <p className="text-muted-foreground mt-2">Seu pagamento foi processado com sucesso.</p>
          </div>
          {reservation && (
            <div className="text-left space-y-2 text-sm border rounded-lg p-4">
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
                <span>{new Date(reservation.check_in_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span>{new Date(reservation.check_out_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total pago</span>
                <span>R$ {reservation.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Um email de confirmação foi enviado para {reservation?.guest_email}
          </p>
          <Button className="w-full" onClick={() => navigate('/')}>
            Voltar para o início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}