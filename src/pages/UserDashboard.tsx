import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  Heart,
  Download,
  Eye,
  Settings,
  LogOut,
  MessageCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import accommodation1 from "@/assets/accommodation-1.jpg";
import accommodation2 from "@/assets/accommodation-2.jpg";
import accommodation3 from "@/assets/accommodation-3.jpg";
import ChatModal from "@/components/ChatModal";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { getUserFavorites, removeFromFavorites } = useFavorites();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reservas");
  const [reservasAPI, setReservasAPI] = useState<any[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [chatReservationId, setChatReservationId] = useState<number | null>(null);

  useEffect(() => {
    const email = (user as any)?.email;
    if (!email) { setLoadingReservas(false); return; }
    fetch("/api/reservations?guest_email=" + encodeURIComponent(email))
      .then(r => r.json())
      .then(d => {
        const data = Array.isArray(d) ? d : [];
        const mapped = data.map((r: any) => ({
          ...r,
          accommodationName: r.room_type_name || r.hotel_name || "Acomodação",
          location: r.hotel_name || "Center Plaza",
          accommodationImage: [accommodation1, accommodation2, accommodation3][r.id % 3] || accommodation1,
          checkIn: r.check_in_date,
          checkOut: r.check_out_date,
          guests: r.number_of_guests,
          total: r.total_amount,
          createdAt: r.created_at,
          paymentStatus: r.payment_status
        }));
        setReservasAPI(mapped);
      })
      .catch(() => setReservasAPI([]))
      .finally(() => setLoadingReservas(false));
  }, [(user as any)?.email]);

  const userReservations = reservasAPI;
  
  // Separar reservas ativas das concluídas
  const reservas = userReservations.filter(r => r.status === 'confirmed' || r.status === 'pending' || r.status === 'confirmada');
  const historico = userReservations.filter(r => r.status === 'cancelled' || r.status === 'cancelada');
  
  // Gerar dados de pagamento baseados nas reservas
  const pagamentos = userReservations.map(reserva => ({
    id: `PAG${String(reserva.id).slice(-3)}`,
    reservaId: reserva.id,
    accommodation: reserva.accommodationName,
    date: reserva.createdAt,
    amount: reserva.total,
    method: reserva.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito',
    status: reserva.paymentStatus === 'pago' ? 'aprovado' : reserva.paymentStatus
  }));

  // Favoritos reais do usuário
  const favoritos = user ? getUserFavorites(user.id) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
      case "aprovado":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
      case "rejeitado":
        return "bg-red-100 text-red-800";
      case "concluida":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmada":
      case "aprovado":
        return <CheckCircle className="h-4 w-4" />;
      case "pendente":
        return <Clock className="h-4 w-4" />;
      case "cancelada":
      case "rejeitado":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDownloadVoucher = (reserva: {
    id: string;
    accommodationName: string;
    location: string;
    guestName: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    amenities?: string[];
    specialRequests?: string;
  }) => {
    // Criar conteúdo do voucher
    const voucherContent = `
=== VOUCHER DE RESERVA - CENTER PLAZA ===

Número da Reserva: ${reserva.id}
Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}

--- INFORMAÇÕES DA HOSPEDAGEM ---
Nome: ${reserva.accommodationName}
Localização: ${reserva.location}

--- INFORMAÇÕES DA RESERVA ---
Hóspede Principal: ${reserva.guestName}
E-mail: ${reserva.email}
Telefone: ${reserva.phone}
Check-in: ${new Date(reserva.checkIn).toLocaleDateString('pt-BR')}
Check-out: ${new Date(reserva.checkOut).toLocaleDateString('pt-BR')}
Número de Hóspedes: ${reserva.guests}
Noites: ${reserva.nights}

--- INFORMAÇÕES DE PAGAMENTO ---
Método de Pagamento: ${reserva.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
Status do Pagamento: ${reserva.paymentStatus}
Valor Total: R$ ${reserva.total.toFixed(2)}

--- COMODIDADES INCLUÍDAS ---
${reserva.amenities?.join(', ') || 'Wi-Fi, Estacionamento, Café da manhã'}

--- CONTATO ---
E-mail: contato@centerplazahotel.com.br
Telefone: (11) 3289-3757

--- OBSERVAÇÕES ---
${reserva.specialRequests || 'Nenhuma solicitação especial'}

=== CENTER PLAZA - HOSPEDAGEM DE QUALIDADE ===
    `;

    // Criar e baixar arquivo
    const blob = new Blob([voucherContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voucher-${reserva.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success("Voucher baixado com sucesso!");
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header do Dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Olá, {user.name}!</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate("/perfil")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs do Dashboard */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reservas">Minhas Reservas</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
            </TabsList>

            {/* Reservas Ativas */}
            <TabsContent value="reservas" className="space-y-4 mt-6">
              {loadingReservas ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reservas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Você não tem reservas ativas.</p>
                  <Button className="mt-4" onClick={() => navigate("/hospedagens")}>
                    Ver Hospedagens
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                {reservas.map((reserva) => (
                  <Card key={reserva.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img 
                          src={reserva.accommodationImage} 
                          alt={reserva.accommodationName}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{reserva.accommodationName}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {reserva.location}
                              </p>
                            </div>
                            <Badge className={getStatusColor(reserva.status)}>
                              {getStatusIcon(reserva.status)}
                              {reserva.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Check-in</p>
                              <p className="font-medium">{new Date(reserva.checkIn).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Check-out</p>
                              <p className="font-medium">{new Date(reserva.checkOut).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Hóspedes</p>
                              <p className="font-medium">{reserva.guests} pessoas</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium text-lg">R$ {reserva.total.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => navigate("/reserva/" + reserva.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </Button>

                            <a
                              href={"https://wa.me/551132893757?text=" + encodeURIComponent("Olá! Tenho uma dúvida sobre minha reserva #" + reserva.id + " - " + (reserva.accommodationName || "Hospedagem"))}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L0 24l6.347-1.496A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.001-1.37l-.36-.214-3.713.876.938-3.591-.235-.371A9.795 9.795 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                                </svg>
                                WhatsApp
                              </Button>
                            </a>

                            <Button size="sm" variant="outline" onClick={() => setChatReservationId(reserva.id)}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>)}
            </TabsContent>

            {/* Histórico */}
            <TabsContent value="historico" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {historico.map((reserva) => (
                  <Card key={reserva.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img 
                          src={reserva.accommodationImage} 
                          alt={reserva.accommodationName}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{reserva.accommodationName}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {reserva.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(reserva.status)}>Concluída</Badge>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(reserva.rating)].map((_, i) => (
                                  <span key={i} className="text-yellow-400">★</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Check-in</p>
                              <p className="font-medium">{new Date(reserva.checkIn).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Check-out</p>
                              <p className="font-medium">{new Date(reserva.checkOut).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Hóspedes</p>
                              <p className="font-medium">{reserva.guests} pessoas</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium text-lg">R$ {reserva.total.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline">
                              Reservar Novamente
                            </Button>
                            <Button size="sm" variant="outline">
                              Avaliar Estadia
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Pagamentos */}
            <TabsContent value="pagamentos" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {pagamentos.map((pagamento) => (
                  <Card key={pagamento.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <CreditCard className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{pagamento.accommodation}</h3>
                            <p className="text-muted-foreground text-sm">
                              {pagamento.method} • {new Date(pagamento.date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground">ID: {pagamento.reservaId}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold text-lg">R$ {pagamento.amount}</p>
                          <Badge className={getStatusColor(pagamento.status)}>
                            {getStatusIcon(pagamento.status)}
                            {pagamento.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Favoritos */}
            <TabsContent value="favoritos" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritos.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Você ainda não tem favoritos salvos.</p>
                    <p className="text-sm text-gray-400 mt-2">Explore nossas hospedagens e adicione suas favoritas!</p>
                  </div>
                ) : (
                  favoritos.map((favorito) => (
                    <Card key={favorito.id} className="overflow-hidden">
                      <div className="relative">
                        <img 
                          src={favorito.image} 
                          alt={favorito.name}
                          className="w-full h-48 object-cover"
                        />
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                          onClick={() => {
                            removeFromFavorites(favorito.id);
                            toast.success("Removido dos favoritos!");
                          }}
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{favorito.name}</h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" />
                          {favorito.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm font-medium">{favorito.rating}</span>
                          </div>
                          <p className="font-semibold">R$ {favorito.price}/noite</p>
                        </div>
                        <Button className="w-full mt-3" onClick={() => navigate(`/hospedagem/${favorito.id}`)}>
                          Ver Detalhes
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {chatReservationId !== null && (
        <ChatModal
          open={true}
          onClose={() => setChatReservationId(null)}
          reservationId={chatReservationId}
          guestName={(user as any)?.name || "Hóspede"}
        />
      )}

      <Footer />
    </div>
  );
};

export default UserDashboard;