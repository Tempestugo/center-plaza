import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Home, Calendar, DollarSign, TrendingUp, MapPin, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { reservationService, roomService, Reservation } from "@/services/api";



interface Stats {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  totalRevenue: number;
}



const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusConfig = {
  pending:   { label: "Pendente",   className: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  confirmed: { label: "Confirmada", className: "bg-green-100  text-green-800  border border-green-200"  },
  cancelled: { label: "Cancelada",  className: "bg-red-100    text-red-800    border border-red-200"    },
};



const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomCount,    setRoomCount]    = useState(0);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, roomData] = await Promise.all([
        reservationService.getAll(),
        roomService.getAll()
      ]);
      setReservations(resData);
      setRoomCount(roomData.length);
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  
  const stats: Stats = {
    totalReservations:    reservations.length,
    pendingReservations:  reservations.filter(r => r.status === "pending").length,
    confirmedReservations:reservations.filter(r => r.status === "confirmed").length,
    totalRevenue:         reservations
                            .filter(r => r.status === "confirmed")
                            .reduce((sum, r) => sum + (r.total_amount ?? 0), 0),
  };

  
  const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const monthlyData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const month = MONTH_NAMES[d.getMonth()];
      const year = d.getFullYear();
      const monthReservations = reservations.filter(r => {
        const created = new Date(r.created_at || "");
        return created.getMonth() === d.getMonth() && created.getFullYear() === year;
      });
      return {
        month: `${month}/${String(year).slice(2)}`,
        confirmadas: monthReservations.filter(r => r.status === "confirmed").length,
        pendentes: monthReservations.filter(r => r.status === "pending").length,
        canceladas: monthReservations.filter(r => r.status === "cancelled").length,
        receita: monthReservations
          .filter(r => r.status === "confirmed")
          .reduce((sum, r) => sum + (r.total_amount ?? 0), 0),
      };
    });
  })();

  const recentReservations = [...reservations]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  const statCards = [
    {
      title: "Reservas Ativas",
      value: loading ? "—" : stats.confirmedReservations,
      sub:   `${stats.pendingReservations} pendente${stats.pendingReservations !== 1 ? "s" : ""}`,
      icon:  Calendar,
      color: "text-blue-600",
    },
    {
      title: "Total de Reservas",
      value: loading ? "—" : roomCount,
      sub:   "quartos cadastrados",
      icon:  Home,
      color: "text-green-600",
    },
    {
      title: "Receita Total",
      value: loading ? "—" : fmtCurrency(stats.totalRevenue),
      sub:   "reservas não canceladas",
      icon:  DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Pendentes",
      value: loading ? "—" : stats.pendingReservations,
      sub:   "aguardando confirmação",
      icon:  Users,
      color: stats.pendingReservations > 0 ? "text-yellow-600" : "text-purple-600",
    },
  ];

  return (
    <AdminLayout
      headerRight={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      }
    >
      <div className="space-y-6">
        {}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Bem-vindo ao painel de controle do Center Plaza
          </p>
        </div>

        {}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {}
        <div className="grid gap-6 md:grid-cols-2">
          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reservas por Mês</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "confirmadas" ? "Confirmadas" :
                        name === "pendentes" ? "Pendentes" : "Canceladas"
                      ]}
                    />
                    <Legend formatter={(value) =>
                      value === "confirmadas" ? "Confirmadas" :
                      value === "pendentes" ? "Pendentes" : "Canceladas"
                    } />
                    <Bar dataKey="confirmadas" fill="#16a34a" radius={[3,3,0,0]} />
                    <Bar dataKey="pendentes"   fill="#ca8a04" radius={[3,3,0,0]} />
                    <Bar dataKey="canceladas"  fill="#dc2626" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receita por Mês</CardTitle>
              <CardDescription>Apenas reservas confirmadas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyData.map(d => {
                    const maxReceita = Math.max(...monthlyData.map(x => x.receita), 1);
                    return (
                      <div key={d.month} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-muted-foreground shrink-0">{d.month}</div>
                        <div className="flex-1 bg-secondary rounded-full h-2 relative">
                          <div
                            className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all"
                            style={{ width: `${(d.receita / maxReceita) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium w-24 text-right shrink-0">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(d.receita)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reservas Recentes</CardTitle>
                <CardDescription>Últimas reservas no sistema</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/reservas")}>
                Ver todas →
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma reserva ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentReservations.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-sm truncate">{r.guest_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {r.hotel_name || "Center Plaza"}
                        </p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-sm font-medium">{fmtCurrency(r.total_amount)}</p>
                        <Badge className={`text-[10px] mt-0.5 ${statusConfig[r.status].className}`}>
                          {statusConfig[r.status].label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
              <CardDescription>Navegue pelo painel administrativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "Gerenciar Hospedagens",
                  sub:   "Hotéis, quartos e imagens",
                  href:  "/admin/hospedagens",
                  icon:  Home,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  label: "Controle de Reservas",
                  sub:   `${stats.pendingReservations} pendente${stats.pendingReservations !== 1 ? "s" : ""} para confirmar`,
                  href:  "/admin/reservas",
                  icon:  Calendar,
                  color: stats.pendingReservations > 0
                    ? "text-yellow-600 bg-yellow-50"
                    : "text-green-600 bg-green-50",
                },
                {
                  label: "Relatórios",
                  sub:   "Métricas e estatísticas",
                  href:  "/admin/relatorios",
                  icon:  TrendingUp,
                  color: "text-purple-600 bg-purple-50",
                },
              ].map(({ label, sub, href, icon: Icon, color }) => (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;