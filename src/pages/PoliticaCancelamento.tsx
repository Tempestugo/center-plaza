import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PoliticaCancelamento() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold mb-2">Política de Cancelamento</h1>
        <p className="text-muted-foreground mb-8">Válida para reservas realizadas em centerplazahotel.com.br</p>

        <div className="grid gap-4 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 flex gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Cancelamento com Reembolso Total</h3>
                <p className="text-green-700 text-sm">
                  Cancele a qualquer momento <strong>antes do horário de check-in (14h00)</strong> do
                  dia da sua chegada e receba reembolso integral. O valor será devolvido no mesmo
                  método de pagamento em até 10 dias úteis.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex gap-4">
              <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Sem Reembolso</h3>
                <p className="text-red-700 text-sm">
                  Cancelamentos realizados <strong>após o horário de check-in (14h00)</strong> do dia
                  da chegada não darão direito a reembolso.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 flex gap-4">
              <Clock className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Horários Importantes</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Check-in: das 14h00 às 17h00</li>
                  <li>• Check-out: até 12h00</li>
                  <li>• Prazo de reembolso: até 10 dias úteis</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">Como Cancelar</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Acesse sua conta em <strong>centerplazahotel.com.br</strong></li>
            <li>Vá em "Minha Conta" → "Minhas Reservas"</li>
            <li>Selecione a reserva e clique em "Cancelar Reserva"</li>
            <li>Confirme o cancelamento</li>
          </ol>
          <p>
            Também é possível solicitar o cancelamento pelo WhatsApp
            <a href="https://wa.me/551132893757" className="text-primary underline ml-1" target="_blank" rel="noopener noreferrer">
              (11) 3289-3757
            </a> ou pelo e-mail
            <a href="mailto:contato@centerplazahotel.com.br" className="text-primary underline ml-1">
              contato@centerplazahotel.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}