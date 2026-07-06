import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Phone, 
  Mail,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Wifi,
  Car,
  Coffee
} from "lucide-react";
import { toast } from "sonner";

const fmt = (dateStr: string) => {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getReservationById } = useReservations();

  const reservation = id ? getReservationById(id) : null;
  
  const [cancelPolicy, setCancelPolicy] = useState<{
    can_cancel: boolean;
    free_cancellation: boolean;
    deadline_formatted: string;
    policy: string;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/reservations/${id}/cancellation-policy`)
        .then(r => r.json())
        .then(setCancelPolicy)
        .catch(() => {});
    }
  }, [id]);

  const handleRequestCancellation = async () => {
    if (!reservation) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/request-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
          guest_email: reservation.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao solicitar cancelamento');
        return;
      }
      toast.success(data.message || 'Solicitação enviada! Nossa equipe entrará em contato.');
      setCancelDialogOpen(false);
      setCancelReason('');
    } catch (err) {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-4">Reserva não encontrada</h1>
              <p className="text-muted-foreground mb-6">A reserva solicitada não foi encontrada ou você não tem permissão para visualizá-la.</p>
              <Button onClick={() => navigate("/user/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmada":
        return <CheckCircle className="h-4 w-4" />;
      case "pendente":
        return <Clock className="h-4 w-4" />;
      case "cancelada":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleDownloadVoucher = () => {
    
    const voucherContent = `
=== VOUCHER DE RESERVA - CENTER PLAZA ===

Número da Reserva: ${reservation.id}
Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}

--- INFORMAÇÕES DA HOSPEDAGEM ---
Nome: ${reservation.accommodationName}
Localização: ${reservation.location}

--- INFORMAÇÕES DA RESERVA ---
Hóspede Principal: ${reservation.guestName}
E-mail: ${reservation.email}
Telefone: ${reservation.phone}
Check-in: ${fmt(reservation.checkIn)}
Check-out: ${fmt(reservation.checkOut)}
Número de Hóspedes: ${reservation.guests}
Noites: ${reservation.nights}

--- INFORMAÇÕES DE PAGAMENTO ---
Método de Pagamento: ${reservation.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
Status do Pagamento: ${reservation.paymentStatus}
Valor Total: R$ ${reservation.total.toFixed(2)}

--- COMODIDADES INCLUÍDAS ---
${reservation.amenities?.join(', ') || 'Wi-Fi, Estacionamento, Café da manhã'}

--- CONTATO ---
E-mail: contato@centerplazahotel.com.br
Telefone: (11) 3289-3757

--- OBSERVAÇÕES ---
${reservation.specialRequests || 'Nenhuma solicitação especial'}

=== CENTER PLAZA - HOSPEDAGEM DE QUALIDADE ===
    `;

    
    const blob = new Blob([voucherContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voucher-${reservation.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success("Voucher baixado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate("/user/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Detalhes da Reserva</h1>
                <p className="text-muted-foreground">Código: {reservation.id}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(reservation.status)} variant="secondary">
                  {getStatusIcon(reservation.status)}
                  {reservation.status}
                </Badge>
                <Button onClick={handleDownloadVoucher}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Voucher
                </Button>
                {reservation && ['confirmed', 'confirmada'].includes(reservation.status) && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Solicitar Cancelamento
                    </Button>
                    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Solicitar Cancelamento</DialogTitle>
                          <DialogDescription>
                            Sua solicitação será analisada pela nossa equipe.
                          </DialogDescription>
                        </DialogHeader>
                        {cancelPolicy && (
                          <div className={`rounded-lg p-3 text-sm ${cancelPolicy.free_cancellation ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-orange-50 border border-orange-200 text-orange-800'}`}>
                            {cancelPolicy.free_cancellation ? `✓ Você está dentro do prazo de cancelamento gratuito (até ${cancelPolicy.deadline_formatted})` : `⚠ Você está fora do prazo de cancelamento gratuito. O reembolso fica a critério do hotel.`}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Motivo (opcional)</Label>
                          <Textarea placeholder="Descreva o motivo do cancelamento..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Voltar
                          </Button>
                          <Button variant="destructive" onClick={handleRequestCancellation} disabled={cancelLoading}>
                            {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Confirmar Solicitação
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Hospedagem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <img 
                      src={reservation.accommodationImage} 
                      alt={reservation.accommodationName}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{reservation.accommodationName}</h3>
                      <p className="text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4" />
                        {reservation.location}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <Wifi className="mr-1 h-3 w-3" />
                          Wi-Fi
                        </Badge>
                        <Badge variant="outline">
                          <Car className="mr-1 h-3 w-3" />
                          Estacionamento
                        </Badge>
                        <Badge variant="outline">
                          <Coffee className="mr-1 h-3 w-3" />
                          Café da manhã
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Reserva</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Check-in</p>
                          <p className="font-medium">{fmt(reservation.checkIn)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p className="font-medium">{fmt(reservation.checkOut)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Hóspedes</p>
                          <p className="font-medium">{reservation.guests} pessoas</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Noites</p>
                          <p className="font-medium">{reservation.nights} noites</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {reservation.specialRequests && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Solicitações Especiais</p>
                        <p className="text-sm bg-muted p-3 rounded-lg">{reservation.specialRequests}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {}
              {cancelPolicy && reservation?.status !== 'cancelled' && (
                <Card className={cancelPolicy.free_cancellation ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${cancelPolicy.free_cancellation ? "text-green-600" : "text-orange-600"}`}>
                        {cancelPolicy.free_cancellation ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${cancelPolicy.free_cancellation ? "text-green-800" : "text-orange-800"}`}>
                          {cancelPolicy.free_cancellation
                            ? "Cancelamento gratuito disponível"
                            : "Fora do prazo de cancelamento gratuito"}
                        </p>
                        <p className={`text-xs mt-1 ${cancelPolicy.free_cancellation ? "text-green-700" : "text-orange-700"}`}>
                          {cancelPolicy.free_cancellation
                            ? `Cancele gratuitamente até ${cancelPolicy.deadline_formatted}`
                            : `O prazo de cancelamento gratuito (${cancelPolicy.deadline_formatted}) já passou.`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Hóspede</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome Completo</p>
                        <p className="font-medium">{reservation.guestName}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">E-mail</p>
                          <p className="font-medium">{reservation.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{reservation.phone}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium">{reservation.document}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Diárias ({reservation.nights} noites)</span>
                    <span>R$ {(reservation.total * 0.9).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Taxa de serviço</span>
                    <span>R$ {(reservation.total * 0.1).toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {reservation.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Método de Pagamento</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reservation.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                    </p>
                    <Badge className={getStatusColor(reservation.paymentStatus)} variant="outline" size="sm">
                      {reservation.paymentStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle>Precisa de Ajuda?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Entre em contato conosco para qualquer dúvida sobre sua reserva.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-sm">(11) 3289-3757</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm">contato@centerplazahotel.com.br</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Phone className="mr-2 h-4 w-4" />
                    Entrar em Contato
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReservationDetails;