import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { roomService } from "@/services/api";
import type { RoomType } from "@/services/api";
import ImageUpload from "@/components/admin/ImageUpload";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Plus, Search, Edit, Trash2, Bed, Loader2, X,
  CheckCircle, XCircle, LayoutGrid, List, RefreshCw
} from "lucide-react";

const EMPTY_ROOM = {
  hotel_id: "", name: "", description: "", size_sqm: "",
  bed_type: "", bed_count: 1, max_occupancy: 2,
  bathroom_type: "", smoking_allowed: false, price_per_night: "", room_number: "",
};

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
  const [roomImages,   setRoomImages]   = useState<{id?: number; preview: string; displayOrder: number; isFeatured: boolean; file?: File}[]>([]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      let data: RoomType[];
      try {
        data = await roomService.getAllAdmin();
      } catch {
        data = await roomService.getAll();
      }
      setRooms(data.map(r => ({ ...r, is_active: r.is_active ?? 1 })));
    } catch {
      toast.error("Erro ao carregar quartos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const toggleAvailability = async (room: RoomType) => {
    setTogglingId(room.id);
    const newVal = room.is_active === 1 ? 0 : 1;
    try {
      await roomService.updateAvailability(room.id, newVal);
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_active: newVal } : r));
      toast.success(newVal === 1 ? `"${room.name}" ativado` : `"${room.name}" desativado`);
    } catch {
      toast.error("Erro ao atualizar disponibilidade");
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateRoom = () => { setRoomForm(EMPTY_ROOM); setRoomImages([]); setRoomModal("create"); };
  const openEditRoom   = (r: RoomType) => {
    setSelectedRoom(r);
    setRoomForm({
      hotel_id: String(r.hotel_id ?? ""), name: r.name ?? "", description: r.description ?? "",
      size_sqm: String(r.size_sqm ?? ""), bed_type: r.bed_type ?? "", bed_count: r.bed_count ?? 1,
      max_occupancy: r.max_occupancy ?? 2, bathroom_type: r.bathroom_type ?? "",
      smoking_allowed: r.smoking_allowed ?? false, price_per_night: String(r.price_per_night ?? ""),
      room_number: r.room_number ?? "",
    });
    const imgs = (r.images ?? []).map((img: any, i: number) => ({
      id: img.id, preview: `data:${img.image_type};base64,${img.image_data}`,
      displayOrder: img.display_order ?? i + 1, isFeatured: img.display_order === 1,
    }));
    setRoomImages(imgs.sort((a, b) => a.displayOrder - b.displayOrder));
    setRoomModal("edit");
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        hotel_id: parseInt(roomForm.hotel_id) || 1, name: roomForm.name,
        description: roomForm.description, size_sqm: parseFloat(roomForm.size_sqm) || 0,
        bed_type: roomForm.bed_type, bed_count: Number(roomForm.bed_count),
        max_occupancy: Number(roomForm.max_occupancy), bathroom_type: roomForm.bathroom_type,
        smoking_allowed: roomForm.smoking_allowed, price_per_night: parseFloat(roomForm.price_per_night),
      };
      const newImgs = roomImages.filter(i => i.file).map(i => i.file as File);
      if (roomModal === "create") {
        const created = newImgs.length > 0
          ? await roomService.createWithImages(payload, newImgs)
          : await roomService.create(payload);
        if (roomForm.room_number) {
          await roomService.updateRoomNumber(created.id, roomForm.room_number);
        }
        toast.success("Quarto criado!");
      } else {
        newImgs.length > 0
          ? await roomService.updateWithImages(selectedRoom!.id, payload, newImgs)
          : await roomService.update(selectedRoom!.id, payload);
        await roomService.updateRoomNumber(selectedRoom!.id, roomForm.room_number);
        toast.success("Quarto atualizado!");
      }
      setRoomModal(null);
      setRoomImages([]);
      loadRooms();
    } catch (err) {
      toast.error(`Erro: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (r: RoomType) => {
    if (!confirm(`Excluir "${r.name}"?`)) return;
    try { await roomService.delete(r.id); toast.success("Excluído!"); loadRooms(); }
    catch { toast.error("Erro ao excluir"); }
  };

  const filtered = rooms.filter(r => {
    const t = search.toLowerCase();
    const matchSearch = !t || r.name?.toLowerCase().includes(t) || r.room_number?.toLowerCase().includes(t);
    const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? r.is_active === 1 : r.is_active === 0;
    return matchSearch && matchStatus;
  });

  const activeCount   = rooms.filter(r => r.is_active === 1).length;
  const inactiveCount = rooms.filter(r => r.is_active === 0).length;

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
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hospedagens</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie a disponibilidade dos quartos</p>
        </div>

        {/* Cards de resumo */}
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

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
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

        {/* Lista de quartos */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bed className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>{search ? "Nenhum quarto encontrado." : "Nenhum quarto cadastrado."}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map(room => (
              <div key={room.id} className={`relative rounded-lg border p-3 transition-all ${room.is_active === 1 ? "bg-white hover:border-primary/50" : "bg-muted/30 opacity-60"}`}>
                <div className="w-full h-20 rounded-md bg-muted overflow-hidden mb-2">
                  {room.images?.[0] ? (
                    <img src={`data:${room.images[0].image_type};base64,${room.images[0].image_data}`} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Bed className="h-6 w-6 text-muted-foreground/40" /></div>
                  )}
                </div>
                <div className="space-y-0.5">
                  {room.room_number && <p className="text-[10px] font-mono text-muted-foreground">Nº {room.room_number}</p>}
                  <p className="text-xs font-semibold leading-tight line-clamp-1">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{fmtCurrency(room.price_per_night)}/noite</p>
                  <p className="text-[10px] text-muted-foreground">{room.max_occupancy ?? (room as any).capacity} hóspedes</p>
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
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Nº", "Nome", "Cama", "Hóspedes", "Preço/noite", "Disponível", "Ações"].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-medium text-muted-foreground ${h === "Disponível" ? "text-center" : h === "Ações" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(room => (
                  <tr key={room.id} className={`transition-colors ${room.is_active === 1 ? "hover:bg-muted/20" : "bg-muted/10 opacity-60"}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{room.room_number || `#${room.id}`}</td>
                    <td className="px-4 py-2.5 font-medium">{room.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{room.bed_type || "—"}</td>
                    <td className="px-4 py-2.5 text-xs">{room.max_occupancy ?? (room as any).capacity}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Quarto */}
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
                <Select value={roomForm.bed_type} onValueChange={v => setRoomForm(p => ({ ...p, bed_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Solteiro", "Casal", "Queen", "King", "Beliche", "Twin"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Número de Camas</Label>
                <Input type="number" min="1" max="10" value={roomForm.bed_count} onChange={e => setRoomForm(p => ({ ...p, bed_count: Number(e.target.value) }))} />
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
              <Label>Imagens do Quarto</Label>
              <ImageUpload images={roomImages} onImagesChange={setRoomImages} maxImages={10} showFeatured />
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