import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Home,
  Calendar,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Download,
  DollarSign,
  Users,
  Star,
  TrendingDown,
  Bed
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminRelatorios = () => {
  const navigate = useNavigate();

  const monthlyData = [
    { month: "Jan", revenue: 25000, bookings: 15, occupancy: 65 },
    { month: "Fev", revenue: 28000, bookings: 18, occupancy: 72 },
    { month: "Mar", revenue: 32000, bookings: 22, occupancy: 78 },
    { month: "Abr", revenue: 35000, bookings: 25, occupancy: 82 },
    { month: "Mai", revenue: 38000, bookings: 28, occupancy: 85 },
    { month: "Jun", revenue: 42000, bookings: 32, occupancy: 88 },
  ];

  const topAccommodations = [
    { name: "Chalé das Montanhas", bookings: 45, revenue: "R$ 14.400", rating: 4.9 },
    { name: "Casa de Vidro", bookings: 38, revenue: "R$ 17.100", rating: 4.8 },
    { name: "Refúgio de Pedra", bookings: 42, revenue: "R$ 15.960", rating: 4.9 },
    { name: "Vila dos Pássaros", bookings: 28, revenue: "R$ 7.840", rating: 4.7 },
  ];

  const stats = [
    { 
      title: "Receita Total", 
      value: "R$ 245.320", 
      change: "+18%", 
      trend: "up",
      icon: DollarSign 
    },
    { 
      title: "Reservas Totais", 
      value: "186", 
      change: "+25%", 
      trend: "up",
      icon: Calendar 
    },
    { 
      title: "Taxa de Ocupação", 
      value: "78%", 
      change: "+5%", 
      trend: "up",
      icon: Home 
    },
    { 
      title: "Avaliação Média", 
      value: "4.8", 
      change: "+0.2", 
      trend: "up",
      icon: Star 
    }
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
            <h1 className="text-2xl font-bold text-primary">Relatórios e Estatísticas</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Select defaultValue="6meses">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                <SelectItem value="1ano">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
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
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/admin/reservas")}>
              <Calendar className="mr-2 h-4 w-4" />
              Reservas
            </Button>

            <Button variant="default" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {stat.trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <stat.icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita Mensal</CardTitle>
                  <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 text-sm text-muted-foreground">{data.month}</div>
                          <div className="flex-1 bg-secondary rounded-full h-2 relative">
                            <div 
                              className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all"
                              style={{ width: `${(data.revenue / 45000) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium">R$ {data.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Accommodations */}
              <Card>
                <CardHeader>
                  <CardTitle>Hospedagens com Melhor Performance</CardTitle>
                  <CardDescription>Ranking por número de reservas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAccommodations.map((accommodation, index) => (
                      <div key={accommodation.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{accommodation.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {accommodation.bookings} reservas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{accommodation.revenue}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{accommodation.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Occupancy Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Ocupação</CardTitle>
                  <CardDescription>Percentual de ocupação por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyData.map((data) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 text-sm text-muted-foreground">{data.month}</div>
                          <div className="flex-1 bg-secondary rounded-full h-2 relative">
                            <div 
                              className="absolute top-0 left-0 h-2 bg-green-600 rounded-full transition-all"
                              style={{ width: `${data.occupancy}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium">{data.occupancy}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Exportar relatórios detalhados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Relatório de Receitas (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Lista de Reservas (Excel)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Relatório de Ocupação (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Análise de Performance (Excel)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminRelatorios;