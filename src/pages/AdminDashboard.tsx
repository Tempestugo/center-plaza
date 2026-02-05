import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Home, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  MapPin,
  Bed
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState([
    { id: 1, text: "Nova reserva para Chalé das Montanhas", time: "5 min atrás", unread: true },
    { id: 2, text: "Check-out realizado na Casa de Vidro", time: "1h atrás", unread: false },
    { id: 3, text: "Avaliação 5 estrelas recebida", time: "2h atrás", unread: false },
  ]);

  const stats = [
    { title: "Reservas Ativas", value: "23", change: "+12%", icon: Calendar, color: "text-blue-600" },
    { title: "Taxa de Ocupação", value: "78%", change: "+5%", icon: Home, color: "text-green-600" },
    { title: "Receita Mensal", value: "R$ 45.320", change: "+18%", icon: DollarSign, color: "text-emerald-600" },
    { title: "Novos Clientes", value: "34", change: "+25%", icon: Users, color: "text-purple-600" },
  ];

  const recentBookings = [
    { id: "RS001234", guest: "Maria Silva", accommodation: "Chalé das Montanhas", dates: "15-18 Dez", status: "confirmada", value: "R$ 960" },
    { id: "RS001235", guest: "João Santos", accommodation: "Casa de Vidro", dates: "20-22 Dez", status: "pendente", value: "R$ 900" },
    { id: "RS001236", guest: "Ana Costa", accommodation: "Refúgio de Pedra", dates: "25-28 Dez", status: "confirmada", value: "R$ 1.140" },
  ];

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">Center Plaza Admin</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                3
              </Badge>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background/95 h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            <Button variant="default" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/admin/hospedagens")}>
              <Home className="mr-2 h-4 w-4" />
              Hospedagens
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/admin/reservas")}>
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
            {/* Welcome */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">Bem-vindo ao painel de controle do Center Plaza</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span> em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Reservas Recentes</CardTitle>
                  <CardDescription>Últimas reservas realizadas no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="space-y-1">
                          <p className="font-medium">{booking.guest}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.accommodation}
                          </p>
                          <p className="text-xs text-muted-foreground">{booking.dates}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{booking.value}</p>
                          <Badge variant={booking.status === "confirmada" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>Atualizações importantes do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-primary' : 'bg-muted'}`} />
                        <div className="flex-1">
                          <p className="text-sm">{notification.text}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;