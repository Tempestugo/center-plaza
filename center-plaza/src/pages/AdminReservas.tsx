import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter,
  Home,
  Calendar,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Eye,
  Edit,
  X,
  Check,
  MapPin,
  Users,
  CalendarDays,
  DollarSign,
  Clock,
  Bed,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "@/contexts/ReservationContext";
import { toast } from "sonner";

const AdminReservas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const { reservations, loading, error, refreshReservations, updateReservationStatus } = useReservations();

  useEffect(() => {
    refreshReservations();
  }, []);

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    try {
      await updateReservationStatus(reservationId, newStatus);
      toast.success(`Status da reserva atualizado para ${newStatus}`);
      await refreshReservations();
    } catch (error) {
      toast.error("Erro ao atualizar status da reserva");
      console.error("Error updating reservation status:", error);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.reservationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.accommodationName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todas" || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "pending": return "secondary";
      case "refunded": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "confirmada";
      case "pending": return "pendente";
      case "cancelled": return "cancelada";
      case "completed": return "finalizada";
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "pago";
      case "pending": return "pendente";
      case "refunded": return "estornado";
      default: return status;
    }
  };

  const stats = [
    { title: "Total de Reservas", value: reservations.length, icon: Calendar },
    { title: "Confirmadas", value: reservations.filter(r => r.status === "confirmed").length, icon: Check },
    { title: "Pendentes", value: reservations.filter(r => r.status === "pending").length, icon: Clock },
    { title: "Receita Total", value: `R$ ${reservations.filter(r => r.paymentStatus === "paid").reduce((sum, r) => sum + r.totalPrice, 0).toLocaleString()}`, icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Gerenciar Reservas</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background/95 h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/admin/dashboard")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/admin/hospedagens")}>
              <Home className="mr-2 h-4 w-4" />
              Hospedagens
            </Button>
            <Button variant="default" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Reservas
            </Button>

            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/admin/relatorios")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por hóspede, código ou hospedagem..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="completed">Finalizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reservations List */}
            <Card>
              <CardHeader>
                <CardTitle>Reservas ({filteredReservations.length})</CardTitle>
                <CardDescription>Gerencie todas as reservas do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Carregando reservas...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Erro ao carregar reservas</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => refreshReservations()}>Tentar novamente</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReservations.map((reservation) => (
                      <div key={reservation.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{reservation.guestName}</h3>
                              <Badge variant={getStatusColor(reservation.status)}>
                                {getStatusLabel(reservation.status)}
                              </Badge>
                              <Badge variant={getPaymentStatusColor(reservation.paymentStatus)}>
                                {getPaymentStatusLabel(reservation.paymentStatus)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Código: {reservation.reservationCode}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reservation.guestEmail} • {reservation.guestPhone}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {reservation.status === "pending" && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-green-600"
                                  onClick={() => handleStatusUpdate(reservation.id.toString(), "confirmed")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive"
                                  onClick={() => handleStatusUpdate(reservation.id.toString(), "cancelled")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{reservation.accommodationName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(reservation.checkInDate).toLocaleDateString('pt-BR')} - {new Date(reservation.checkOutDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{reservation.numberOfGuests} hóspedes • {Math.ceil((new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} noites</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">R$ {reservation.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredReservations.length === 0 && !loading && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Nenhuma reserva encontrada</h3>
                        <p className="text-muted-foreground">
                          Tente ajustar seus filtros de busca para encontrar mais resultados.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReservas;