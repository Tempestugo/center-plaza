import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { roomService, customRatesService, roomBlocksService, reservationService } from "@/services/api";
import type { RoomType, CustomRate, RoomBlock, Reservation } from "@/services/api";
import { 
  Calendar, 
  DollarSign, 
  Lock, 
  Unlock,
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Building2, 
  ChevronDown, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Percent,
  Plus,
  Users
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, parseISO, isWeekend, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (dStr: string) => {
  if (!dStr) return "";
  const parts = dStr.split("T")[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dStr;
};

export default function AdminDisponibilidade() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [rates, setRates] = useState<CustomRate[]>([]);
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);

  // Grid Controls
  const [gridStartDate, setGridStartDate] = useState<Date>(new Date());
  const [gridDaysCount, setGridDaysCount] = useState<number>(14);

  // Cell Modal Selection
  const [selectedCell, setSelectedCell] = useState<{ room: RoomType; date: Date } | null>(null);
  
  // Quick Edit Form States
  const [quickPrice, setQuickPrice] = useState<string>("");
  const [quickPriceLabel, setQuickPriceLabel] = useState<string>("");
  const [quickPriceStart, setQuickPriceStart] = useState<string>("");
  const [quickPriceEnd, setQuickPriceEnd] = useState<string>("");
  const [quickBlockReason, setQuickBlockReason] = useState<string>("");
  const [quickBlockStart, setQuickBlockStart] = useState<string>("");
  const [quickBlockEnd, setQuickBlockEnd] = useState<string>("");

  // Bulk Edit Form States (Tabs below the grid)
  const [rateRoomIds, setRateRoomIds] = useState<string[]>(["global"]);
  const [rateStartDate, setRateStartDate] = useState<string>("");
  const [rateEndDate, setRateEndDate] = useState<string>("");
  const [ratePrice, setRatePrice] = useState<string>("");
  const [rateLabel, setRateLabel] = useState<string>("");

  const [blockRoomIds, setBlockRoomIds] = useState<string[]>(["global"]);
  const [blockStartDate, setBlockStartDate] = useState<string>("");
  const [blockEndDate, setBlockEndDate] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsData, ratesData, blocksData, reservationsData] = await Promise.all([
        roomService.getAll(),
        customRatesService.getAll(),
        roomBlocksService.getAll(),
        reservationService.getAll(),
      ]);
      setRooms(roomsData);
      setRates(ratesData);
      setBlocks(blocksData);
      setReservations(reservationsData);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar dados de disponibilidade");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate dates
  const handleShiftDays = (days: number) => {
    setGridStartDate(prev => addDays(prev, days));
  };

  // Helper functions for cell calculations
  const getPriceForDate = (room: RoomType, dateStr: string) => {
    const sortedRates = [...rates].sort((a, b) => {
      const aRoom = a.room_type_id !== null ? 1 : 0;
      const bRoom = b.room_type_id !== null ? 1 : 0;
      if (aRoom !== bRoom) return bRoom - aRoom;
      return (b.id || 0) - (a.id || 0);
    });

    const match = sortedRates.find(r => {
      const isTarget = r.room_type_id === room.id || r.room_type_id === null;
      const start = r.start_date.split("T")[0];
      const end = r.end_date.split("T")[0];
      return isTarget && dateStr >= start && dateStr <= end;
    });

    return match 
      ? { price: Number(match.price_per_night), isCustom: true, rate: match } 
      : { price: Number(room.price_per_night), isCustom: false, rate: null };
  };

  const getBlockForDate = (room: RoomType, dateStr: string) => {
    if (room.is_active === 0) {
      return { blocked: true, reason: "Acomodação inativa no painel principal", block: null };
    }
    const match = blocks.find(b => {
      const isTarget = b.room_type_id === room.id || b.room_type_id === null;
      const start = b.start_date.split("T")[0];
      const end = b.end_date.split("T")[0];
      return isTarget && dateStr >= start && dateStr <= end;
    });

    return match 
      ? { blocked: true, reason: match.reason || (match.room_type_id ? "Quarto bloqueado" : "Bloqueio geral"), block: match } 
      : { blocked: false, reason: "", block: null };
  };

  const getBookedCountForDate = (roomId: number, dateStr: string) => {
    return reservations.filter(r => {
      if (r.room_type_id !== roomId) return false;
      if (r.status === 'cancelled') return false;
      const start = r.check_in_date.split("T")[0];
      const end = r.check_out_date.split("T")[0];
      return dateStr >= start && dateStr < end;
    }).length;
  };

  // Open cell quick-edit modal
  const handleCellClick = (room: RoomType, date: Date) => {
    setSelectedCell({ room, date });
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Get current cell price
    const { price, rate } = getPriceForDate(room, dateStr);
    setQuickPrice(price.toString());
    setQuickPriceLabel(rate?.label || "");
    setQuickPriceStart(dateStr);
    setQuickPriceEnd(dateStr);

    // Get current cell block
    const { block } = getBlockForDate(room, dateStr);
    setQuickBlockReason(block?.reason || "");
    setQuickBlockStart(dateStr);
    setQuickBlockEnd(dateStr);
  };

  // Quick edit price submit
  const handleQuickPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !quickPrice || !quickPriceStart || !quickPriceEnd) return;
    if (quickPriceStart > quickPriceEnd) {
      toast.error("Data inicial não pode ser maior que a data final");
      return;
    }
    const price = parseFloat(quickPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Preço inválido");
      return;
    }

    setSavingRate(true);
    try {
      await customRatesService.create({
        room_type_ids: [selectedCell.room.id],
        start_date: quickPriceStart,
        end_date: quickPriceEnd,
        price_per_night: price,
        label: quickPriceLabel || undefined
      });
      toast.success("Tarifa aplicada com sucesso!");
      loadData();
      setSelectedCell(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar tarifa");
    } finally {
      setSavingRate(false);
    }
  };

  // Quick edit block submit
  const handleQuickBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !quickBlockStart || !quickBlockEnd) return;
    if (quickBlockStart > quickBlockEnd) {
      toast.error("Data inicial não pode ser maior que a data final");
      return;
    }

    setSavingBlock(true);
    try {
      await roomBlocksService.create({
        room_type_ids: [selectedCell.room.id],
        start_date: quickBlockStart,
        end_date: quickBlockEnd,
        reason: quickBlockReason || undefined
      });
      toast.success("Bloqueio aplicado com sucesso!");
      loadData();
      setSelectedCell(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar bloqueio");
    } finally {
      setSavingBlock(false);
    }
  };

  // Delete a specific rate or block rule from inside the Quick Edit modal
  const handleDeleteRateRule = async (id: number) => {
    try {
      await customRatesService.delete(id);
      toast.success("Tarifa especial removida");
      loadData();
      if (selectedCell) {
        // Refresh values inside modal
        const dateStr = format(selectedCell.date, "yyyy-MM-dd");
        // We delay slightly to let state update
        setTimeout(() => {
          const { price, rate } = getPriceForDate(selectedCell.room, dateStr);
          setQuickPrice(price.toString());
          setQuickPriceLabel(rate?.label || "");
        }, 100);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover tarifa");
    }
  };

  const handleDeleteBlockRule = async (id: number) => {
    try {
      await roomBlocksService.delete(id);
      toast.success("Bloqueio removido");
      loadData();
      if (selectedCell) {
        const dateStr = format(selectedCell.date, "yyyy-MM-dd");
        setTimeout(() => {
          const { block } = getBlockForDate(selectedCell.room, dateStr);
          setQuickBlockReason(block?.reason || "");
        }, 100);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover bloqueio");
    }
  };

  // Bulk rate selection toggles
  const toggleRateRoom = (val: string) => {
    if (val === "global") {
      setRateRoomIds(["global"]);
      return;
    }
    setRateRoomIds(prev => {
      const withoutGlobal = prev.filter(v => v !== "global");
      if (withoutGlobal.includes(val)) {
        const next = withoutGlobal.filter(v => v !== val);
        return next.length === 0 ? ["global"] : next;
      }
      return [...withoutGlobal, val];
    });
  };

  const toggleBlockRoom = (val: string) => {
    if (val === "global") {
      setBlockRoomIds(["global"]);
      return;
    }
    setBlockRoomIds(prev => {
      const withoutGlobal = prev.filter(v => v !== "global");
      if (withoutGlobal.includes(val)) {
        const next = withoutGlobal.filter(v => v !== val);
        return next.length === 0 ? ["global"] : next;
      }
      return [...withoutGlobal, val];
    });
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateStartDate || !rateEndDate || !ratePrice) {
      toast.error("Preencha as datas e o valor da tarifa");
      return;
    }
    if (rateStartDate > rateEndDate) {
      toast.error("Data inicial não pode ser maior que a data final");
      return;
    }
    const price = parseFloat(ratePrice);
    if (isNaN(price) || price < 0) {
      toast.error("Informe um preço válido maior ou igual a zero");
      return;
    }

    setSavingRate(true);
    try {
      const isGlobal = rateRoomIds.includes("global");
      const targetIds = isGlobal ? [null] : rateRoomIds.map(id => parseInt(id));

      const res = await customRatesService.create({
        room_type_ids: targetIds,
        start_date: rateStartDate,
        end_date: rateEndDate,
        price_per_night: price,
        label: rateLabel || undefined,
      });

      toast.success(res.message || "Tarifa(s) por data cadastrada(s) com sucesso!");
      setRateStartDate("");
      setRateEndDate("");
      setRatePrice("");
      setRateLabel("");
      setRateRoomIds(["global"]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar tarifa");
    } finally {
      setSavingRate(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStartDate || !blockEndDate) {
      toast.error("Preencha as datas do bloqueio");
      return;
    }
    if (blockStartDate > blockEndDate) {
      toast.error("Data inicial não pode ser maior que a data final");
      return;
    }

    setSavingBlock(true);
    try {
      const isGlobal = blockRoomIds.includes("global");
      const targetIds = isGlobal ? [null] : blockRoomIds.map(id => parseInt(id));

      const res = await roomBlocksService.create({
        room_type_ids: targetIds,
        start_date: blockStartDate,
        end_date: blockEndDate,
        reason: blockReason || undefined,
      });

      toast.success(res.message || (isGlobal ? "Hotel bloqueado no período!" : "Bloqueios cadastrados com sucesso!"));
      setBlockStartDate("");
      setBlockEndDate("");
      setBlockReason("");
      setBlockRoomIds(["global"]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar bloqueio");
    } finally {
      setSavingBlock(false);
    }
  };

  // Generate grid dates
  const gridDates = Array.from({ length: gridDaysCount }, (_, i) => addDays(gridStartDate, i));

  // Dropdown Labels
  const rateRoomLabel = rateRoomIds.includes("global")
    ? "★ TODOS OS QUARTOS (GLOBAL)"
    : rateRoomIds.length === 1
    ? (rooms.find(r => String(r.id) === rateRoomIds[0])?.name || `${rateRoomIds.length} quarto selecionado`)
    : `${rateRoomIds.length} quartos selecionados`;

  const blockRoomLabel = blockRoomIds.includes("global")
    ? "🚨 BLOQUEIO GERAL (FECHAR TODO O HOTEL)"
    : blockRoomIds.length === 1
    ? (rooms.find(r => String(r.id) === blockRoomIds[0])?.name || `${blockRoomIds.length} quarto selecionado`)
    : `${blockRoomIds.length} quartos selecionados`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Gestão de Tarifas & Disponibilidade
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Painel estilo calendário para controlar os preços, status de vendas e monitorar a ocupação dia a dia.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* GRADE DE CALENDÁRIO INTERATIVA (ESTILO BOOKING) */}
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 bg-muted/20 border-b">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendário Tarifário Extranet
              </CardTitle>
              <CardDescription className="text-xs">
                Mostra tarifas, ocupação e bloqueios. Clique em qualquer quadrado para fazer alterações rápidas.
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleShiftDays(-7)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setGridStartDate(new Date())}>
                Hoje
              </Button>
              <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-background text-xs h-8">
                <span className="text-muted-foreground font-medium">Início:</span>
                <input 
                  type="date" 
                  value={format(gridStartDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const d = parseISO(e.target.value);
                    if (!isNaN(d.getTime())) setGridStartDate(d);
                  }}
                  className="border-0 p-0 focus:outline-none focus:ring-0 bg-transparent w-24 text-xs font-semibold"
                />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleShiftDays(7)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Select 
                value={String(gridDaysCount)} 
                onValueChange={(v) => setGridDaysCount(Number(v))}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                Carregando dados da grade...
              </div>
            ) : rooms.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                Nenhum quarto cadastrado. Cadastre quartos na aba "Hospedagens" primeiro.
              </div>
            ) : (
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 divide-x divide-border/60">
                    <th className="p-3 font-semibold text-muted-foreground w-64 min-w-[200px]">Acomodação</th>
                    {gridDates.map((date, idx) => {
                      const weekend = isWeekend(date);
                      const isTodayDate = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                      return (
                        <th 
                          key={idx} 
                          className={`p-2 text-center font-medium w-16 min-w-[55px] ${
                            weekend ? "bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400" : "text-foreground"
                          } ${isTodayDate ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                        >
                          <div className="font-semibold">{format(date, "eee", { locale: ptBR })}</div>
                          <div className="text-[10px] text-muted-foreground">{format(date, "dd/MM")}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-muted/10 divide-x divide-border/40">
                      <td className="p-3 w-64 min-w-[200px]">
                        <div className="font-semibold text-foreground truncate">{room.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Users className="h-3 w-3" />
                            {room.max_occupancy || room.capacity || 2} máx
                          </span>
                          <span>•</span>
                          <span>{room.total_units || 1} unid.</span>
                        </div>
                      </td>
                      {gridDates.map((date, idx) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const { price, isCustom } = getPriceForDate(room, dateStr);
                        const { blocked, reason } = getBlockForDate(room, dateStr);
                        const booked = getBookedCountForDate(room.id, dateStr);
                        const totalUnits = room.total_units || 1;
                        const available = Math.max(0, totalUnits - booked);
                        const weekend = isWeekend(date);

                        return (
                          <td 
                            key={idx}
                            onClick={() => handleCellClick(room, date)}
                            className={`p-1.5 text-center cursor-pointer relative group transition-all duration-150 select-none ${
                              blocked 
                                ? "bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-100/50" 
                                : weekend 
                                ? "bg-amber-50/10 dark:bg-amber-950/2 hover:bg-muted/50" 
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="space-y-1">
                              {/* Preço */}
                              <div className={`font-semibold text-[11px] ${
                                blocked 
                                  ? "text-rose-400 line-through font-normal" 
                                  : isCustom 
                                  ? "text-indigo-600 dark:text-indigo-400 font-bold" 
                                  : "text-foreground/80"
                              }`}>
                                {blocked ? "Bloq." : `R$ ${Math.round(price)}`}
                              </div>

                              {/* Ocupação / Inventário */}
                              {!blocked && (
                                <div className={`text-[9px] font-medium leading-none ${
                                  available === 0 
                                    ? "text-rose-600 dark:text-rose-400 font-semibold" 
                                    : available <= 2 
                                    ? "text-amber-600 dark:text-amber-400" 
                                    : "text-muted-foreground/60"
                                }`}>
                                  {available === 0 ? "Lotado" : `${available} disp`}
                                </div>
                              )}

                              {/* Badge de Bloqueio ou Tarifa Especial */}
                              {blocked ? (
                                <div className="flex justify-center">
                                  <Lock className="h-3 w-3 text-rose-500" />
                                </div>
                              ) : isCustom ? (
                                <div className="flex justify-center">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" title="Tarifa Especial" />
                                </div>
                              ) : (
                                <div className="h-1.5" />
                              )}
                            </div>
                            
                            {/* Hover tooltip */}
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-30 bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap pointer-events-none">
                              <p className="font-bold">{room.name}</p>
                              <p>{format(date, "dd/MM/yyyy")}</p>
                              <p className="mt-1">Preço: <span className="font-semibold text-emerald-400">{fmtCurrency(price)}</span> {isCustom ? "(Tarifa Especial)" : "(Padrão)"}</p>
                              {blocked ? (
                                <p className="text-rose-400 font-semibold mt-0.5">Status: Bloqueado ({reason})</p>
                              ) : (
                                <p className="text-emerald-400 font-semibold mt-0.5">Status: Disponível ({available}/{totalUnits} quartos livres)</p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* CARD INFORMAÇÃO / LEGENDA */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground p-3 border rounded-lg bg-card bg-muted/10 items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-foreground">Legenda do Calendário:</span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border bg-background" /> Preço Padrão (Sem tarifa especial)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border bg-indigo-50/30 border-indigo-200" /> 
              <span className="text-indigo-600 font-semibold">Tarifa Especial Ativa</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border bg-rose-50/50 border-rose-100 flex items-center justify-center">
                <Lock className="h-2 w-2 text-rose-500" />
              </span> 
              <span className="text-rose-500 font-semibold">Quarto Bloqueado / Fechado</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-rose-600 font-bold">Lotado</span> Todos os quartos estão reservados
            </span>
          </div>
          <p className="italic text-[10px]">Dica: Clique em qualquer célula da grade para editar preço e bloquear/desbloquear.</p>
        </div>

        {/* MODAL DE EDIÇÃO RÁPIDA (QUICK EDIT DIALOG) */}
        <Dialog open={selectedCell !== null} onOpenChange={(open) => { if (!open) setSelectedCell(null); }}>
          {selectedCell && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Editar Dia: {selectedCell.room.name}
                </DialogTitle>
                <DialogDescription>
                  Configurações para o dia {format(selectedCell.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="price-tab" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="price-tab" className="flex items-center gap-1 text-xs">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    Definir Preço
                  </TabsTrigger>
                  <TabsTrigger value="block-tab" className="flex items-center gap-1 text-xs">
                    <Lock className="h-3.5 w-3.5 text-rose-600" />
                    Bloquear Dia
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: QUICK PRICE */}
                <TabsContent value="price-tab" className="space-y-4">
                  <form onSubmit={handleQuickPriceSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="qp-price">Valor por Noite (R$)</Label>
                      <Input
                        id="qp-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 220.00"
                        value={quickPrice}
                        onChange={e => setQuickPrice(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="qp-start">De:</Label>
                        <Input
                          id="qp-start"
                          type="date"
                          value={quickPriceStart}
                          onChange={e => setQuickPriceStart(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="qp-end">Até (Inclusive):</Label>
                        <Input
                          id="qp-end"
                          type="date"
                          value={quickPriceEnd}
                          onChange={e => setQuickPriceEnd(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="qp-label">Rótulo / Evento (Opcional)</Label>
                      <Input
                        id="qp-label"
                        placeholder="Ex: Feriado, Fim de Semana"
                        value={quickPriceLabel}
                        onChange={e => setQuickPriceLabel(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCell(null)}>
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={savingRate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {savingRate ? "Salvando..." : "Salvar Preço"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* TAB 2: QUICK BLOCK */}
                <TabsContent value="block-tab" className="space-y-4">
                  <form onSubmit={handleQuickBlockSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="qb-start">De:</Label>
                        <Input
                          id="qb-start"
                          type="date"
                          value={quickBlockStart}
                          onChange={e => setQuickBlockStart(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="qb-end">Até (Inclusive):</Label>
                        <Input
                          id="qb-end"
                          type="date"
                          value={quickBlockEnd}
                          onChange={e => setQuickBlockEnd(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="qb-reason">Motivo do Bloqueio (Opcional)</Label>
                      <Input
                        id="qb-reason"
                        placeholder="Ex: Manutenção, Feriado fechado"
                        value={quickBlockReason}
                        onChange={e => setQuickBlockReason(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCell(null)}>
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" variant="destructive">
                        {savingBlock ? "Salvando..." : "Confirmar Bloqueio"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              {/* ACTIVE RULES ON THIS CELL DATE */}
              <div className="pt-3 mt-3 border-t space-y-3 text-xs">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Regras Ativas para {format(selectedCell.date, "dd/MM")} nesta acomodação:
                </h4>

                {/* Active Custom Rates */}
                <div className="space-y-2">
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Tarifas Cadastradas:</p>
                  {rates.filter(r => {
                    const isTarget = r.room_type_id === selectedCell.room.id || r.room_type_id === null;
                    const dateStr = format(selectedCell.date, "yyyy-MM-dd");
                    const start = r.start_date.split("T")[0];
                    const end = r.end_date.split("T")[0];
                    return isTarget && dateStr >= start && dateStr <= end;
                  }).length === 0 ? (
                    <p className="text-muted-foreground italic text-[11px]">Nenhuma tarifa especial. Seguindo preço base de {fmtCurrency(selectedCell.room.price_per_night)}.</p>
                  ) : (
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                      {rates.filter(r => {
                        const isTarget = r.room_type_id === selectedCell.room.id || r.room_type_id === null;
                        const dateStr = format(selectedCell.date, "yyyy-MM-dd");
                        const start = r.start_date.split("T")[0];
                        const end = r.end_date.split("T")[0];
                        return isTarget && dateStr >= start && dateStr <= end;
                      }).map(rate => (
                        <div key={rate.id} className="flex items-center justify-between p-1.5 rounded bg-muted/50 border">
                          <div>
                            <span className="font-bold text-emerald-600">{fmtCurrency(rate.price_per_night)}</span>
                            {rate.label && <span className="ml-1 text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded">{rate.label}</span>}
                            <span className="block text-[9px] text-muted-foreground">Válido de {fmtDate(rate.start_date)} a {fmtDate(rate.end_date)} {rate.room_type_id === null && "(GLOBAL)"}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDeleteRateRule(rate.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Blocks */}
                <div className="space-y-2 pt-1">
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Bloqueios de Vendas:</p>
                  {blocks.filter(b => {
                    const isTarget = b.room_type_id === selectedCell.room.id || b.room_type_id === null;
                    const dateStr = format(selectedCell.date, "yyyy-MM-dd");
                    const start = b.start_date.split("T")[0];
                    const end = b.end_date.split("T")[0];
                    return isTarget && dateStr >= start && dateStr <= end;
                  }).length === 0 ? (
                    <p className="text-muted-foreground italic text-[11px]">Nenhum bloqueio ativo. Quarto aberto para vendas.</p>
                  ) : (
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                      {blocks.filter(b => {
                        const isTarget = b.room_type_id === selectedCell.room.id || b.room_type_id === null;
                        const dateStr = format(selectedCell.date, "yyyy-MM-dd");
                        const start = b.start_date.split("T")[0];
                        const end = b.end_date.split("T")[0];
                        return isTarget && dateStr >= start && dateStr <= end;
                      }).map(block => (
                        <div key={block.id} className="flex items-center justify-between p-1.5 rounded bg-rose-50/50 border border-rose-100 text-rose-700 dark:bg-rose-950/10 dark:border-rose-900/30">
                          <div>
                            <span className="font-semibold">{block.reason || "Sem motivo informado"}</span>
                            <span className="block text-[9px] text-muted-foreground">Bloqueado de {fmtDate(block.start_date)} a {fmtDate(block.end_date)} {block.room_type_id === null && "(GLOBAL)"}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-rose-600 hover:text-rose-800 hover:bg-rose-100"
                            onClick={() => handleDeleteBlockRule(block.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* PAINEL DE CADASTRO EM MASSA (LOTE) */}
        <Card className="border border-border/80 shadow-md">
          <CardHeader className="bg-muted/40 pb-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Alteração de Tarifas e Datas em Massa (Lote)
            </CardTitle>
            <CardDescription className="text-xs">
              Use este formulário para definir preços especiais ou criar bloqueios em massa para grandes intervalos de datas ou múltiplos quartos de uma só vez.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="rates" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="rates" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Preços Específicos por Data (Lote)
                </TabsTrigger>
                <TabsTrigger value="blocks" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rose-600" />
                  Bloqueio de Datas (Lote)
                </TabsTrigger>
              </TabsList>

              {/* ABA 1: TARIFAS ESPECÍFICAS EM LOTE */}
              <TabsContent value="rates">
                <form onSubmit={handleCreateRate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Acomodação / Quartos Alvo</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal text-xs h-9">
                            <span className="truncate">{rateRoomLabel}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3 space-y-2 max-h-60 overflow-y-auto" align="start">
                          <div
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                            onClick={() => toggleRateRoom("global")}
                          >
                            <Checkbox checked={rateRoomIds.includes("global")} />
                            <span className="text-xs font-semibold text-primary">★ TODOS OS QUARTOS (GLOBAL)</span>
                          </div>
                          <div className="border-t pt-1.5 space-y-1">
                            {rooms.map(room => {
                              const isChecked = rateRoomIds.includes(String(room.id));
                              return (
                                <div
                                  key={room.id}
                                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                                  onClick={() => toggleRateRoom(String(room.id))}
                                >
                                  <Checkbox checked={isChecked} />
                                  <span className="truncate">{room.name} ({fmtCurrency(room.price_per_night)})</span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate-start">Data Inicial</Label>
                      <Input
                        id="rate-start"
                        type="date"
                        value={rateStartDate}
                        onChange={e => setRateStartDate(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate-end">Data Final (Inclusive)</Label>
                      <Input
                        id="rate-end"
                        type="date"
                        value={rateEndDate}
                        onChange={e => setRateEndDate(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate-price">Valor por Noite (R$)</Label>
                      <Input
                        id="rate-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 200.00"
                        value={ratePrice}
                        onChange={e => setRatePrice(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="rate-label">Identificação / Rótulo (Opcional)</Label>
                      <Input
                        id="rate-label"
                        placeholder="Ex: Fim de Semana, Réveillon, Feriado de Carnaval"
                        value={rateLabel}
                        onChange={e => setRateLabel(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <Button type="submit" disabled={savingRate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs">
                      {savingRate ? "Salvando..." : `Aplicar Tarifa (${rateRoomIds.length === 1 && rateRoomIds[0] === 'global' ? 'Global' : rateRoomIds.length + ' quarto(s)'})`}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ABA 2: BLOQUEIO EM MASSA EM LOTE */}
              <TabsContent value="blocks">
                <form onSubmit={handleCreateBlock} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quartos / Alvo do Bloqueio</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal text-xs h-9">
                            <span className="truncate">{blockRoomLabel}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3 space-y-2 max-h-60 overflow-y-auto" align="start">
                          <div
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                            onClick={() => toggleBlockRoom("global")}
                          >
                            <Checkbox checked={blockRoomIds.includes("global")} />
                            <span className="text-xs font-semibold text-rose-600">🚨 BLOQUEIO GERAL (HOTEL TODO)</span>
                          </div>
                          <div className="border-t pt-1.5 space-y-1">
                            {rooms.map(room => {
                              const isChecked = blockRoomIds.includes(String(room.id));
                              return (
                                <div
                                  key={room.id}
                                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                                  onClick={() => toggleBlockRoom(String(room.id))}
                                >
                                  <Checkbox checked={isChecked} />
                                  <span className="truncate">{room.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="block-start">Data Inicial do Bloqueio</Label>
                      <Input
                        id="block-start"
                        type="date"
                        value={blockStartDate}
                        onChange={e => setBlockStartDate(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="block-end">Data Final do Bloqueio (Inclusive)</Label>
                      <Input
                        id="block-end"
                        type="date"
                        value={blockEndDate}
                        onChange={e => setBlockEndDate(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="block-reason">Motivo do Bloqueio (Opcional)</Label>
                      <Input
                        id="block-reason"
                        placeholder="Ex: Manutenção preventiva, Feriado fechado, Reserva externa"
                        value={blockReason}
                        onChange={e => setBlockReason(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <Button type="submit" disabled={savingBlock} variant="destructive" className="w-full h-9 text-xs">
                      {savingBlock ? "Salvando..." : `Bloquear Datas (${blockRoomIds.includes('global') ? 'Global' : blockRoomIds.length + ' quarto(s)'})`}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
