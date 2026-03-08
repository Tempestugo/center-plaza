import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, TrendingUp, DollarSign, Calendar,
  Home, Star, Loader2, RefreshCw, Download
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { reservationService } from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Reservation {
  id: number;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled";
  check_in_date: string;
  hotel_name: string;
  room_type_name: string;
  created_at: string;
}

type Period = "7" | "30" | "90" | "180" | "365";

const PERIOD_LABELS: Record<Period, string> = {
  "7":   "Últimos 7 dias",
  "30":  "Últimos 30 dias",
  "90":  "Últimos 3 meses",
  "180": "Últimos 6 meses",
  "365": "Último ano",
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── Componente ───────────────────────────────────────────────────────────────

const AdminRelatorios = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [period,       setPeriod]       = useState<Period>("180");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationService.getAll();
      setReservations(data as any);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtra pelo período selecionado ─────────────────────────────────────────
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(period));

  const filtered = reservations.filter(r => new Date(r.created_at) >= cutoff);
  const active   = filtered.filter(r => r.status !== "cancelled");

  // ── Receita por mês ─────────────────────────────────────────────────────────
  const revenueByMonth: Record<string, number> = {};
  const bookingsByMonth: Record<string, number> = {};

  active.forEach(r => {
    const d   = new Date(r.created_at);
    const key = `${MONTH_NAMES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    revenueByMonth[key]  = (revenueByMonth[key]  ?? 0) + (r.total_amount ?? 0);
    bookingsByMonth[key] = (bookingsByMonth[key] ?? 0) + 1;
  });

  const monthlyData = Object.entries(revenueByMonth)
    .map(([month, revenue]) => ({ month, revenue, bookings: bookingsByMonth[month] ?? 0 }))
    .slice(-6);

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  // ── Top hospedagens ─────────────────────────────────────────────────────────
  const hotelMap: Record<string, { bookings: number; revenue: number }> = {};
  active.forEach(r => {
    const k = r.hotel_name ?? "Desconhecido";
    if (!hotelMap[k]) hotelMap[k] = { bookings: 0, revenue: 0 };
    hotelMap[k].bookings++;
    hotelMap[k].revenue += r.total_amount ?? 0;
  });

  const topHotels = Object.entries(hotelMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  // ── Cards de resumo ─────────────────────────────────────────────────────────
  const totalRevenue   = active.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const totalBookings  = filtered.length;
  const confirmedCount = filtered.filter(r => r.status === "confirmed").length;
  const occupancyRate  = totalBookings > 0
    ? Math.round((confirmedCount / totalBookings) * 100)
    : 0;

  const summaryCards = [
    { title: "Receita Total",     value: fmtCurrency(totalRevenue), icon: DollarSign, color: "text-emerald-600" },
    { title: "Reservas no Período", value: String(totalBookings),   icon: Calendar,   color: "text-blue-600"   },
    { title: "Taxa de Confirmação", value: `${occupancyRate}%`,     icon: Home,       color: "text-green-600"  },
    { title: "Confirmadas",         value: String(confirmedCount),  icon: BarChart3,  color: "text-purple-600" },
  ];

  return (
    <AdminLayout
      headerRight={
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={v => setPeriod(v as Period)}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground text-sm">{PERIOD_LABELS[period]}</p>
        </div>

        {/* Cards resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          {summaryCards.map(s => (
            <Card key={s.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.title}</p>
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                    ) : (
                      <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                    )}
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Receita por mês */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>Evolução da receita no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado disponível para o período.
                </p>
              ) : (
                <div className="space-y-3">
                  {monthlyData.map(d => (
                    <div key={d.month} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-muted-foreground">{d.month}</div>
                      <div className="flex-1 bg-secondary rounded-full h-2 relative">
                        <div
                          className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all"
                          style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium w-24 text-right">
                        {fmtCurrency(d.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top hospedagens */}
          <Card>
            <CardHeader>
              <CardTitle>Hospedagens com Melhor Performance</CardTitle>
              <CardDescription>Ranking por número de reservas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : topHotels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado disponível.
                </p>
              ) : (
                <div className="space-y-3">
                  {topHotels.map((h, i) => (
                    <div key={h.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{h.name}</p>
                          <p className="text-xs text-muted-foreground">{h.bookings} reserva{h.bookings !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-emerald-700 ml-2 shrink-0">
                        {fmtCurrency(h.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reservas por mês (contagem) */}
          <Card>
            <CardHeader>
              <CardTitle>Volume de Reservas</CardTitle>
              <CardDescription>Quantidade de reservas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível.</p>
              ) : (
                <div className="space-y-3">
                  {monthlyData.map(d => {
                    const maxB = Math.max(...monthlyData.map(x => x.bookings), 1);
                    return (
                      <div key={d.month} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-muted-foreground">{d.month}</div>
                        <div className="flex-1 bg-secondary rounded-full h-2 relative">
                          <div
                            className="absolute top-0 left-0 h-2 bg-green-600 rounded-full transition-all"
                            style={{ width: `${(d.bookings / maxB) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium w-16 text-right">
                          {d.bookings} reserva{d.bookings !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações de exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatórios</CardTitle>
              <CardDescription>Baixe os dados para análise externa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Relatório de Receitas (PDF)",
                "Lista de Reservas (Excel)",
                "Relatório de Ocupação (PDF)",
                "Análise de Performance (Excel)",
              ].map(label => (
                <Button key={label} variant="outline" className="w-full justify-start text-sm h-9">
                  <Download className="mr-2 h-4 w-4 shrink-0" />
                  {label}
                </Button>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Exportação de dados reais em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRelatorios;