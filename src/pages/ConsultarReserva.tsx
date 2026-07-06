import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Calendar, Users, MapPin, CheckCircle,
  Clock, XCircle, Phone, Mail, DollarSign, Bed
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";



interface ReservationResult {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  special_requests: string | null;
  status: "pending" | "confirmed" | "cancelled";
  hotel_name: string;
  room_type_name: string;
}



const fmt = (d: string) => {
  if (!d) return "";
  const clean = d.split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return d;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const STATUS_CONFIG = {
  pending: {
    label: "Pendente",
    badge: (
      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Clock className="w-3 h-3 mr-1" /> Pendente
      </Badge>
    ),
  },
  confirmed: {
    label: "Confirmada",
    badge: (
      <Badge className="bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" /> Confirmada
      </Badge>
    ),
  },
  cancelled: {
    label: "Cancelada",
    badge: (
      <Badge className="bg-red-100 text-red-800 border border-red-200">
        <XCircle className="w-3 h-3 mr-1" /> Cancelada
      </Badge>
    ),
  },
};



const ConsultarReserva = () => {
  const [reservationCode, setReservationCode] = useState("");
  const [lastName,        setLastName]        = useState("");
  const [reservation,     setReservation]     = useState<ReservationResult | null>(null);
  const [isLoading,       setIsLoading]       = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservationCode.trim() || !lastName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o código da reserva e o sobrenome.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setReservation(null);

    try {
      
      const { data } = await api.get<ReservationResult[]>("/reservations", {
        params: { code: reservationCode.trim(), guest_name: lastName.trim() },
      });

      const found = Array.isArray(data) ? data[0] : data;

      if (found) {
        setReservation(found);
        toast({ title: "Reserva encontrada!" });
      } else {
        toast({
          title: "Reserva não encontrada",
          description: "Verifique o código e o sobrenome informados.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro na consulta",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nights = reservation
    ? Math.max(
        1,
        Math.ceil(
          (new Date(reservation.check_out_date).getTime() -
            new Date(reservation.check_in_date).getTime()) /
            86400000
        )
      )
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {}
        <section className="bg-gradient-to-r from-primary to-primary-light py-16">
          <div className="container mx-auto px-4 text-center text-primary-foreground">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Consultar Reserva</h1>
            <p className="text-lg max-w-xl mx-auto opacity-90">
              Informe o código da reserva e seu sobrenome para visualizar os detalhes
            </p>
          </div>
        </section>

        {}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-lg">
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Localizar Reserva</CardTitle>
                <CardDescription>Os dados são os mesmos fornecidos no momento da reserva</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="code" className="text-sm font-medium">Código da Reserva</label>
                    <Input
                      id="code"
                      placeholder="Ex: 42"
                      value={reservationCode}
                      onChange={e => setReservationCode(e.target.value)}
                      className="text-center font-mono tracking-wider"
                    />
                    <p className="text-xs text-muted-foreground">
                      O código é o número da reserva enviado por e-mail
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-sm font-medium">Sobrenome do Responsável</label>
                    <Input
                      id="lastName"
                      placeholder="Ex: Silva"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-2" /> Buscando...</>
                    ) : (
                      <><Search className="w-4 h-4 mr-2" /> Consultar Reserva</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {}
        {reservation && (
          <section className="pb-16">
            <div className="container mx-auto px-4 max-w-2xl">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{reservation.hotel_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{reservation.room_type_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Reserva #{reservation.id}</p>
                    </div>
                    {STATUS_CONFIG[reservation.status]?.badge}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Informações do Hóspede
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Nome</p>
                        <p className="text-sm font-medium">{reservation.guest_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</p>
                        <p className="text-sm font-medium break-all">{reservation.guest_email}</p>
                      </div>
                      {reservation.guest_phone && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</p>
                          <p className="text-sm font-medium">{reservation.guest_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Detalhes da Estadia
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Check-in
                        </p>
                        <p className="text-sm font-medium mt-0.5">{fmt(reservation.check_in_date)}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Check-out
                        </p>
                        <p className="text-sm font-medium mt-0.5">{fmt(reservation.check_out_date)}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" /> Hóspedes
                        </p>
                        <p className="text-sm font-medium mt-0.5">{reservation.number_of_guests} pessoa{reservation.number_of_guests !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Total
                        </p>
                        <p className="text-sm font-medium mt-0.5 text-green-700">{fmtCurrency(reservation.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">{nights} noite{nights !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </div>

                  {}
                  {reservation.special_requests && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Pedidos especiais</p>
                      <p className="text-sm">{reservation.special_requests}</p>
                    </div>
                  )}

                  {}
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">Precisa de ajuda com sua reserva?</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" size="sm">
                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Falar no WhatsApp
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-3.5 h-3.5 mr-1.5" /> Enviar E-mail
                      </Button>
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