import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Users, MapPin, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReservations, type Reservation } from "@/contexts/ReservationContext";

// Interface movida para ReservationContext

const ConsultarReserva = () => {
  const { getReservationByCodeAndName } = useReservations();
  const [reservationCode, setReservationCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservationCode || !lastName) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o código da reserva e sobrenome.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const foundReservation = await getReservationByCodeAndName(reservationCode, lastName);
      
      if (foundReservation) {
        setReservation(foundReservation);
        toast({
          title: "Reserva encontrada!",
          description: "Aqui estão os detalhes da sua reserva.",
        });
      } else {
        setReservation(null);
        toast({
          title: "Reserva não encontrada",
          description: "Verifique o código da reserva e sobrenome informados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar reserva:', error);
      setReservation(null);
      toast({
        title: "Erro na consulta",
        description: "Ocorreu um erro ao buscar a reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Concluída";
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{getStatusLabel(status)}</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{getStatusLabel(status)}</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{getStatusLabel(status)}</Badge>;
      case "completed":
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />{getStatusLabel(status)}</Badge>;
      default:
        return <Badge variant="outline">{getStatusLabel(status)}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary-light py-20">
          <div className="container mx-auto px-4 text-center text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Consultar Reserva
            </h1>
            <p className="text-xl max-w-2xl mx-auto">
              Digite o código da sua reserva e sobrenome para visualizar todos os detalhes
            </p>
          </div>
        </section>

        {/* Search Form */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="card-elegant">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Localizar Reserva</CardTitle>
                <CardDescription>
                  Informe os dados da sua reserva para consultar os detalhes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="code" className="text-sm font-medium">
                      Código da Reserva
                    </label>
                    <Input
                      id="code"
                      placeholder="Ex: RS001234"
                      value={reservationCode}
                      onChange={(e) => setReservationCode(e.target.value)}
                      className="text-center font-mono tracking-wider"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Sobrenome do Responsável
                    </label>
                    <Input
                      id="lastName"
                      placeholder="Ex: Silva"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Consultar Reserva
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Reservation Details */}
        {reservation && (
          <section className="pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
              <Card className="card-elegant">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {reservation.accommodationName}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{reservation.location}</span>
                      </div>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {/* Guest Information */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Informações do Hóspede</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Nome</span>
                        <p className="font-medium">{reservation.guestName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">E-mail</span>
                        <p className="font-medium">{reservation.guestEmail}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Telefone</span>
                        <p className="font-medium">{reservation.guestPhone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Detalhes da Reserva</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <span className="text-sm text-muted-foreground">Check-in</span>
                          <p className="font-medium">{new Date(reservation.checkInDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <span className="text-sm text-muted-foreground">Check-out</span>
                          <p className="font-medium">{new Date(reservation.checkOutDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <div>
                          <span className="text-sm text-muted-foreground">Hóspedes</span>
                          <p className="font-medium">{reservation.numberOfGuests} pessoas</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Valor Total</span>
                        <p className="font-medium text-lg text-primary">
                          R$ {reservation.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Status do Pagamento:</span>
                      <Badge className={reservation.paymentStatus === 'paid' ? 'bg-green-500 text-green-50' : 'bg-yellow-500 text-yellow-50'}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {reservation.paymentStatus === 'paid' ? 'Pagamento Confirmado' : 
                         reservation.paymentStatus === 'pending' ? 'Pagamento Pendente' :
                         reservation.paymentStatus === 'refunded' ? 'Reembolsado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Precisa de ajuda? Entre em contato conosco
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="outline">
                          Falar no WhatsApp
                        </Button>
                        <Button variant="outline">
                          Enviar E-mail
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ConsultarReserva;