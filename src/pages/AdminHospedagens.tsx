import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { roomService } from "@/services/api";
import type { RoomType } from "@/services/api";
import ImageUpload from "@/components/admin/ImageUpload";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Plus, Search, Edit, Trash2, Bed, Loader2, X,
  CheckCircle, XCircle, LayoutGrid, List, RefreshCw,
  DollarSign, CheckSquare, Square, Layers, Power, PowerOff
} from "lucide-react";

const BED_TYPE_OCCUPANCY: Record<string, number> = {
  "Solteiro": 1,
  "Casal": 2,
  "Queen": 2,
  "King": 2,
  "Triplo": 3,
  "Quádruplo": 4,
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_ROOM = {
  hotel_id: "", name: "", description: "", size_sqm: "",
  bed_type: "", bed_count: 1, max_occupancy: 2, total_units: 1,
  bathroom_type: "", smoking_allowed: false, price_per_night: "", room_number: "",
  stripe_price_id: "",
  amenities: [] as string[],
};

const AMENITIES_OPTIONS = [
  "Ar condicionado", "TV", "Wi-Fi", "Frigobar", "Hidromassagem",
  "Varanda", "Cofre", "Secador de Cabelo", "Banheira", "Vista para o Mar"
];

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AdminHospedagens() {
  const [rooms,        setRooms]        = useState<RoomType[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [togglingId,   setTogglingId]   = useState<number | null>(null);
  const [search,       setSearch]       = useState("");
  const [viewMode,     setViewMode]     = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [roomModal,    setRoomModal]    = useState<"create" | "edit" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [roomForm,     setRoomForm]     = useState(EMPTY_ROOM);
  const [imageFiles,   setImageFiles]   = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{id: number; url: string}[]>([]);

  // Selection & Bulk Operations State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [bulkPriceInput, setBulkPriceInput] = useState("");

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      let data: RoomType[];
      try {
        data = await roomService.getAllAdmin();
      } catch {
        data = await roomService.getAll();
      }
      setRooms(data.map(r => ({ ...r, is_active: (r.is_active === undefined || r.is_active === 1) ? 1 : 0 })));
    } catch {
      toast.error("Erro ao carregar quartos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const toggleSelectRoom = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (filteredRooms: RoomType[]) => {
    const filteredIds = filteredRooms.map(r => r.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBatchStatus = async (is_active: number) => {
    if (selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      const res = await roomService.batchUpdateStatus(selectedIds, is_active);
      toast.success(res.message || `${selectedIds.length} quarto(s) atualizado(s)!`);
      setSelectedIds([]);
      loadRooms();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar status dos quartos selecionados");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(bulkPriceInput);
    if (isNaN(price) || price < 0) {
      toast.error("Informe um preço válido maior ou igual a zero");
      return;
    }
    if (selectedIds.length === 0) return;

    setBatchProcessing(true);
    try {
      const res = await roomService.batchUpdatePrice(selectedIds, price);
      toast.success(res.message || `Preço atualizado para ${selectedIds.length} quarto(s)!`);
      setBulkPriceModalOpen(false);
      setBulkPriceInput("");
      setSelectedIds([]);
      loadRooms();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar preços dos quartos selecionados");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir os ${selectedIds.length} quarto(s) selecionados?\n\nQuartos que possuírem reservas ativas serão desativados automaticamente em vez de excluídos.`)) return;

    setBatchProcessing(true);
    try {
      const res = await roomService.batchDelete(selectedIds);
      toast.success(res.message || "Exclusão em massa concluída!");
      setSelectedIds([]);
      loadRooms();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir quartos selecionados");
    } finally {
      setBatchProcessing(false);
    }
  };

  const toggleAvailability = async (room: RoomType) => {
    setTogglingId(room.id);
    const newVal = room.is_active === 1 ? 0 : 1;
    try {
      await roomService.updateAvailability(room.id, newVal);
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_active: newVal } : r));
      toast.success(newVal === 1 ? `"${room.name}" ativado` : `"${room.name}" desativado`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar disponibilidade");
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateRoom = () => {
    setRoomForm(EMPTY_ROOM);
    setImageFiles([]);
    setExistingImages([]);
    setRoomModal("create");
  };

  const openEditRoom   = (r: RoomType) => {
    setSelectedRoom(r);
    let am: string[] = [];
    if (Array.isArray(r.amenities)) am = r.amenities;
    else if (typeof r.amenities === 'string') {
      try { am = JSON.parse(r.amenities); } catch { am = []; }
    }

    setRoomForm({
      stripe_price_id: r.stripe_price_id || "",
      hotel_id: String(r.hotel_id ?? ""), name: r.name ?? "", description: r.description ?? "",
      size_sqm: String(r.size_sqm ?? ""), bed_type: r.bed_type ?? "", bed_count: r.bed_count ?? 1,
      max_occupancy: r.max_occupancy ?? 2, total_units: r.total_units ?? 1, bathroom_type: r.bathroom_type ?? "",
      smoking_allowed: r.smoking_allowed ?? false, price_per_night: String(r.price_per_night ?? ""),
      room_number: r.room_number ?? "",
      amenities: am,
    });

    setExistingImages(r.images || []);
    setImageFiles([]);
    setRoomModal("edit");
  };

  const handleBedTypeChange = (value: string) => {
    const maxOcc = BED_TYPE_OCCUPANCY[value] || roomForm.max_occupancy;
    setRoomForm(p => ({ ...p, bed_type: value, max_occupancy: maxOcc }));
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        hotel_id: parseInt(roomForm.hotel_id) || 1, name: roomForm.name,
        description: roomForm.description, size_sqm: parseFloat(roomForm.size_sqm) || 0,
        bed_type: roomForm.bed_type, bed_count: Number(roomForm.bed_count),
        max_occupancy: Number(roomForm.max_occupancy), total_units: Number(roomForm.total_units), bathroom_type: roomForm.bathroom_type,
        smoking_allowed: roomForm.smoking_allowed, price_per_night: parseFloat(roomForm.price_per_night),
        amenities: roomForm.amenities,
        stripe_price_id: roomForm.stripe_price_id || undefined,
      };

      if (roomModal === "create") {
        const room = await roomService.create(payload);
        for (const file of imageFiles) {
          const base64 = await fileToBase64(file);
          await roomService.uploadImage(room.id, base64, file.type);
        }
        toast.success("Quarto criado!");
      } else {
        await roomService.update(selectedRoom!.id, payload);
        for (const file of imageFiles) {
          const base64 = await fileToBase64(file);
          await roomService.uploadImage(selectedRoom!.id, base64, file.type);
        }
        toast.success("Quarto atualizado!");
      }
      setRoomModal(null);
      loadRooms();
    } catch (err) {
      toast.error(`Erro: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("Excluir imagem?")) return;
    try {
      await roomService.deleteImage(imageId);
      setExistingImages(prev => prev.filter(i => i.id !== imageId));
      toast.success("Imagem removida");
      
      loadRooms();
    } catch (err) {
      toast.error("Erro ao excluir imagem");
    }
  };

  const handleDeleteRoom = async (r: RoomType) => {
    if (!confirm(`Excluir "${r.name}"?\nSe houver reservas ativas, o quarto será desativado em vez de excluído.`)) return;
    try {
      await roomService.delete(r.id);
      toast.success("Quarto excluído com sucesso!");
      loadRooms();
    } catch (err: any) {
      if (err?.message?.includes("reservas") || err?.message?.includes("400")) {
        await roomService.update(r.id, { ...r, is_active: 0 });
        toast.success("Quarto tem reservas ativas — foi desativado em vez de excluído.");
        loadRooms();
      } else {
        toast.error("Erro ao excluir quarto");
      }
    }
  };

  const filtered = rooms.filter(r => {
    const t = search.toLowerCase();
    const matchSearch = !t || r.name?.toLowerCase().includes(t) || r.room_number?.toLowerCase().includes(t);
    const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? r.is_active === 1 : r.is_active === 0;
    return matchSearch && matchStatus;
  });

  const activeCount   = rooms.filter(r => (r.is_active === 1 || r.is_active === true)).length;
  const inactiveCount = rooms.length - activeCount;
  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.includes(r.id));

  return (
    <AdminLayout
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadRooms} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={openCreateRoom}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo Quarto
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-20">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hospedagens</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie a disponibilidade e altere quartos individualmente ou em massa</p>
        </div>

        <div className="grid gap-4 grid-cols-3">
          {[
            { label: "Total de Quartos", value: rooms.length,    icon: Bed,          color: "text-muted-foreground" },
            { label: "Disponíveis",      value: activeCount,     icon: CheckCircle,  color: "text-green-600" },
            { label: "Indisponíveis",    value: inactiveCount,   icon: XCircle,      color: "text-red-500" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSelectAll(filtered)}
              className="h-9 gap-1.5"
            >
              {allFilteredSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
              <span>{allFilteredSelected ? "Desmarcar Todos" : "Selecionar Todos"}</span>
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-52 h-9" placeholder="Buscar por nome ou nº..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
            </div>
            {(["all", "active", "inactive"] as const).map(s => (
              <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)} className="h-9">
                {s === "all" ? `Todos (${rooms.length})` : s === "active" ? `Disponíveis (${activeCount})` : `Inativos (${inactiveCount})`}
              </Button>
            ))}
          </div>
          <div className="flex items-center border rounded-md overflow-hidden">
            {(["grid", "list"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`p-2 transition-colors ${viewMode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {m === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bed className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>{search ? "Nenhum quarto encontrado." : "Nenhum quarto cadastrado."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map(room => {
              const isSelected = selectedIds.includes(room.id);
              return (
                <div
                  key={room.id}
                  className={`relative rounded-lg border p-3 transition-all ${
                    isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : room.is_active === 1 ? "bg-white hover:border-primary/50" : "bg-muted/30 opacity-70"
                  }`}
                >
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectRoom(room.id)}
                      className="bg-white dark:bg-card shadow"
                    />
                  </div>
                  <div className="w-full h-20 rounded-md bg-muted overflow-hidden mb-2 relative">
                    {room.images?.[0] ? (
                      <img src={room.images[0].url} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Bed className="h-6 w-6 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {room.room_number && <p className="text-[10px] font-mono text-muted-foreground">Nº {room.room_number}</p>}
                    <p className="text-xs font-semibold leading-tight line-clamp-1">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtCurrency(room.price_per_night)}/noite</p>
                    <p className="text-[10px] text-muted-foreground">
                      {room.total_units || 1} unidade{(room.total_units || 1) !== 1 ? "s" : ""} · máx {room.max_occupancy ?? (room as any).capacity} hóspede{(room.max_occupancy ?? (room as any).capacity) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className={`text-[10px] font-medium ${room.is_active === 1 ? "text-green-600" : "text-red-500"}`}>
                      {room.is_active === 1 ? "Disponível" : "Inativo"}
                    </span>
                    {togglingId === room.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      : <Switch checked={room.is_active === 1} onCheckedChange={() => toggleAvailability(room)} className="scale-75" />
                    }
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-1" onClick={() => openEditRoom(room)}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRoom(room)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={() => toggleSelectAll(filtered)}
                    />
                  </th>
                  {["Nº", "Nome", "Cama", "Hóspedes", "Unidades", "Preço/noite", "Disponível", "Ações"].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-medium text-muted-foreground ${h === "Disponível" ? "text-center" : h === "Ações" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(room => {
                  const isSelected = selectedIds.includes(room.id);
                  return (
                    <tr key={room.id} className={`transition-colors ${isSelected ? "bg-primary/5" : room.is_active === 1 ? "hover:bg-muted/20" : "bg-muted/10 opacity-70"}`}>
                      <td className="px-3 py-2.5 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRoom(room.id)}
                        />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{room.room_number || `#${room.id}`}</td>
                      <td className="px-4 py-2.5 font-medium">{room.name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{room.bed_type || "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{room.max_occupancy ?? (room as any).capacity}</td>
                      <td className="px-4 py-2.5 text-xs">{room.total_units || 1}</td>
                      <td className="px-4 py-2.5 text-xs font-medium">{fmtCurrency(room.price_per_night)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-center">
                          {togglingId === room.id
                            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            : <Switch checked={room.is_active === 1} onCheckedChange={() => toggleAvailability(room)} />
                          }
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRoom(room)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRoom(room)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background dark:bg-card dark:text-foreground px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-background/20 dark:border-border">
            <Layers className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">
              {selectedIds.length} quarto(s) selecionado(s)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              disabled={batchProcessing}
              onClick={() => handleBatchStatus(1)}
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              <Power className="h-3.5 w-3.5" />
              Ativar Todos
            </Button>

            <Button
              size="sm"
              variant="secondary"
              disabled={batchProcessing}
              onClick={() => handleBatchStatus(0)}
              className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-0"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Desativar Todos
            </Button>

            <Button
              size="sm"
              variant="secondary"
              disabled={batchProcessing}
              onClick={() => { setBulkPriceInput(""); setBulkPriceModalOpen(true); }}
              className="h-8 gap-1.5"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Alterar Preço
            </Button>

            <Button
              size="sm"
              variant="destructive"
              disabled={batchProcessing}
              onClick={handleBatchDelete}
              className="h-8 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs hover:bg-background/20 dark:hover:bg-accent"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <Dialog open={bulkPriceModalOpen} onOpenChange={setBulkPriceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Alterar Preço em Massa
            </DialogTitle>
            <DialogDescription>
              Defina o novo valor da diária que será aplicado aos {selectedIds.length} quarto(s) selecionado(s).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBatchPriceSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-price">Novo Valor por Noite (R$)</Label>
              <Input
                id="bulk-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 250.00"
                value={bulkPriceInput}
                onChange={e => setBulkPriceInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBulkPriceModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={batchProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {batchProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Aplicar a Todos ({selectedIds.length})
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roomModal !== null} onOpenChange={() => setRoomModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{roomModal === "create" ? "Novo Quarto" : `Editar: ${selectedRoom?.name}`}</DialogTitle>
            <DialogDescription>{roomModal === "create" ? "Configure o novo quarto." : "Atualize as informações."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRoom} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Número do Quarto</Label>
                <Input value={roomForm.room_number} onChange={e => setRoomForm(p => ({ ...p, room_number: e.target.value }))} placeholder="Ex: 101, 201A..." />
              </div>
              <div className="space-y-1.5">
                <Label>Nome / Tipo</Label>
                <Input value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Suíte Luxo" required />
              </div>
              <div className="space-y-1.5">
                <Label>Preço por Noite (R$)</Label>
                <Input type="number" step="0.01" min="0" value={roomForm.price_per_night} onChange={e => setRoomForm(p => ({ ...p, price_per_night: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ocupação Máxima</Label>
                <Input type="number" min="1" max="20" value={roomForm.max_occupancy} onChange={e => setRoomForm(p => ({ ...p, max_occupancy: Number(e.target.value) }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Cama</Label>
                <Select value={roomForm.bed_type} onValueChange={handleBedTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Solteiro", "Casal", "Queen", "King", "Triplo", "Quádruplo", "Beliche", "Twin"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Número de Camas</Label>
                <Input type="number" min="1" max="10" value={roomForm.bed_count} onChange={e => setRoomForm(p => ({ ...p, bed_count: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Unidades Físicas</Label>
                  <span className="text-[10px] text-muted-foreground">Qtd. em estoque</span>
                </div>
                <Input type="number" min="1" max="100" value={roomForm.total_units} onChange={e => setRoomForm(p => ({ ...p, total_units: parseInt(e.target.value) || 1 }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Área (m²)</Label>
                <Input type="number" step="0.1" value={roomForm.size_sqm} onChange={e => setRoomForm(p => ({ ...p, size_sqm: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Banheiro</Label>
                <Input value={roomForm.bathroom_type} onChange={e => setRoomForm(p => ({ ...p, bathroom_type: e.target.value }))} placeholder="Ex: Privativo com banheira" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição</Label>
                <Textarea rows={3} value={roomForm.description} onChange={e => setRoomForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva as características..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comodidades</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AMENITIES_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${opt}`}
                      checked={roomForm.amenities.includes(opt)}
                      onCheckedChange={(checked) => {
                        setRoomForm(p => ({
                          ...p,
                          amenities: checked ? [...p.amenities, opt] : p.amenities.filter(a => a !== opt)
                        }));
                      }}
                    />
                    <label htmlFor={`amenity-${opt}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{opt}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagens do Quarto</Label>
              <ImageUpload
                onFilesChange={setImageFiles}
                existingImages={existingImages}
                onDeleteExisting={handleDeleteImage}
                maxFiles={5}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" type="button" onClick={() => setRoomModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {roomModal === "create" ? "Criar Quarto" : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}