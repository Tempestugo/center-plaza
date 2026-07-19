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
import { roomService, customRatesService, roomBlocksService } from "@/services/api";
import type { RoomType, CustomRate, RoomBlock } from "@/services/api";
import { Calendar, DollarSign, Lock, Trash2, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Building2, ChevronDown, Check } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);

  // Form Rate State (Array for multi-selection)
  const [rateRoomIds, setRateRoomIds] = useState<string[]>(["global"]);
  const [rateStartDate, setRateStartDate] = useState<string>("");
  const [rateEndDate, setRateEndDate] = useState<string>("");
  const [ratePrice, setRatePrice] = useState<string>("");
  const [rateLabel, setRateLabel] = useState<string>("");

  // Form Block State (Array for multi-selection)
  const [blockRoomIds, setBlockRoomIds] = useState<string[]>(["global"]);
  const [blockStartDate, setBlockStartDate] = useState<string>("");
  const [blockEndDate, setBlockEndDate] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsData, ratesData, blocksData] = await Promise.all([
        roomService.getAll().catch(() => []),
        customRatesService.getAll().catch(() => []),
        roomBlocksService.getAll().catch(() => []),
      ]);
      setRooms(roomsData);
      setRates(ratesData);
      setBlocks(blocksData);
    } catch {
      toast.error("Erro ao carregar dados de disponibilidade");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleDeleteRate = async (id: number) => {
    try {
      await customRatesService.delete(id);
      setRates(prev => prev.filter(r => r.id !== id));
      toast.success("Tarifa removida");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover tarifa");
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

  const handleDeleteBlock = async (id: number) => {
    try {
      await roomBlocksService.delete(id);
      setBlocks(prev => prev.filter(b => b.id !== id));
      toast.success("Bloqueio removido");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover bloqueio");
    }
  };

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
              Configure preços diferenciados por período e gerencie datas bloqueadas ou indisponibilidade geral do hotel.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Card Principal - Retângulo de Gerenciamento em Massa */}
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-muted/40 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Painel de Alteração de Tarifas e Datas (Múltiplos Quartos)
            </CardTitle>
            <CardDescription>
              Selecione um ou vários quartos (ou Global) abaixo para aplicar novos preços ou fechar vendas para períodos específicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="rates" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="rates" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Preços Específicos por Data
                </TabsTrigger>
                <TabsTrigger value="blocks" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rose-600" />
                  Bloqueio de Datas (Indisponibilidade Geral / Múltipla)
                </TabsTrigger>
              </TabsList>

              {/* ABA 1: TARIFAS ESPECÍFICAS POR DATA */}
              <TabsContent value="rates">
                <form onSubmit={handleCreateRate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Acomodação / Quartos Alvo</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal">
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
                      />
                    </div>
                    <Button type="submit" disabled={savingRate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      {savingRate ? "Salvando..." : `Aplicar Tarifa (${rateRoomIds.length === 1 && rateRoomIds[0] === 'global' ? 'Global' : rateRoomIds.length + ' quarto(s)'})`}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ABA 2: BLOQUEIO DE DATAS / INDISPONIBILIDADE */}
              <TabsContent value="blocks">
                <form onSubmit={handleCreateBlock} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quartos / Alvo do Bloqueio</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal">
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
                      />
                    </div>
                    <Button type="submit" disabled={savingBlock} variant="destructive" className="w-full">
                      {savingBlock ? "Salvando..." : `Bloquear Datas (${blockRoomIds.includes('global') ? 'Global' : blockRoomIds.length + ' quarto(s)'})`}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* LISTA DE REGRAS ATIVAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD TARIFAS ESPECIAIS ATIVAS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Tarifas Especiais Vigentes ({rates.length})
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Valores dinâmicos aplicados por período no cálculo do site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rates.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                  Nenhuma tarifa por data configurada. Todos os quartos seguem o preço padrão.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {rates.map(rate => (
                    <div
                      key={rate.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors flex items-center justify-between text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {rate.room_type_id ? (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {rate.room_name || `Quarto #${rate.room_type_id}`}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
                              GLOBAL (TODOS OS QUARTOS)
                            </Badge>
                          )}
                          {rate.label && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {rate.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Período: <span className="font-semibold text-foreground">{fmtDate(rate.start_date)}</span> até <span className="font-semibold text-foreground">{fmtDate(rate.end_date)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600 text-base">
                          {fmtCurrency(rate.price_per_night)}
                          <span className="text-[10px] text-muted-foreground font-normal">/noite</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeleteRate(rate.id)}
                          title="Remover tarifa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD BLOQUEIOS DE DATAS ATIVOS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rose-600" />
                  Datas Bloqueadas / Indisponíveis ({blocks.length})
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Períodos em que o site impedirá a seleção e realização de reservas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                  Nenhum bloqueio manual ativo. A disponibilidade segue o estoque de reservas.
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {blocks.map(block => (
                    <div
                      key={block.id}
                      className="p-3 rounded-lg border border-rose-100 bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60 transition-colors flex items-center justify-between text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {block.room_type_id ? (
                            <Badge variant="outline" className="text-xs border-rose-300 text-rose-700">
                              {block.room_name || `Quarto #${block.room_type_id}`}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs font-bold">
                              🚨 BLOQUEIO GERAL DO HOTEL
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Período: <span className="font-semibold text-foreground">{fmtDate(block.start_date)}</span> até <span className="font-semibold text-foreground">{fmtDate(block.end_date)}</span>
                        </p>
                        {block.reason && (
                          <p className="text-xs text-rose-600 font-medium">
                            Motivo: {block.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-100/50"
                        onClick={() => handleDeleteBlock(block.id)}
                        title="Remover bloqueio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
