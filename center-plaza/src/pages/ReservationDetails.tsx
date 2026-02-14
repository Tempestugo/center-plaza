import { useParams, useNavigate } from "react-router-dom";
import { useReservations } from "@/contexts/ReservationContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  Clock,
  XCircle,
  Wifi,
  Car,
  Coffee
} from "lucide-react";
import { toast } from "sonner";

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getReservationById } = useReservations();

  const reservation = id ? getReservationById(id) : null;

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
    // Criar conteúdo do voucher
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
Check-in: ${new Date(reservation.checkIn).toLocaleDateString('pt-BR')}
Check-out: ${new Date(reservation.checkOut).toLocaleDateString('pt-BR')}
Número de Hóspedes: ${reservation.guests}
Noites: ${reservation.nights}

--- INFORMAÇÕES DE PAGAMENTO ---
Método de Pagamento: ${reservation.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
Status do Pagamento: ${reservation.paymentStatus}
Valor Total: R$ ${reservation.total.toFixed(2)}

--- COMODIDADES INCLUÍDAS ---
${reservation.amenities?.join(', ') || 'Wi-Fi, Estacionamento, Café da manhã'}

--- CONTATO ---
E-mail: contato@centerplaza.com.br
Telefone: (11) 99999-9999

--- OBSERVAÇÕES ---
${reservation.specialRequests || 'Nenhuma solicitação especial'}

=== CENTER PLAZA - HOSPEDAGEM DE QUALIDADE ===
    `;

    // Criar e baixar arquivo
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
          {/* Header */}
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
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informações da Hospedagem */}
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

              {/* Informações da Reserva */}
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
                          <p className="font-medium">{new Date(reservation.checkIn).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p className="font-medium">{new Date(reservation.checkOut).toLocaleDateString('pt-BR')}</p>
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

              {/* Informações do Hóspede */}
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

            {/* Resumo Financeiro */}
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

              {/* Informações de Contato */}
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
                      <span className="text-sm">(11) 99999-9999</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm">contato@centerplaza.com.br</span>
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