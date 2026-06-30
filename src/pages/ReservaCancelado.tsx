import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function ReservaCancelado() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reservationId = searchParams.get("reservation_id");

  
  useEffect(() => {
    
    const reservationId = new URLSearchParams(window.location.search).get('reservation_id');
    if (reservationId) {
      fetch('/api/reservations/' + reservationId + '/cancel-pending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-600">Pagamento Cancelado</h1>
            <p className="text-muted-foreground mt-2">
              Seu pagamento foi cancelado. A reserva não foi confirmada.
            </p>
            {reservationId && (
              <p className="text-xs text-muted-foreground mt-1">Ref: #{reservationId}</p>
            )}
          </div>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate(-1)}>
              Tentar novamente
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Voltar para o início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}