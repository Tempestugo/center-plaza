import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { hotelService, roomService } from "@/services/api";
import type { Hotel, RoomType } from "@/services/api";
import ImageUpload from "@/components/admin/ImageUpload";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Plus, Search, Edit, Trash2, Home, MapPin, Bed,
  Loader2, RefreshCw, X
} from "lucide-react";

// ─── Tipos de formulário ──────────────────────────────────────────────────────

const EMPTY_HOTEL = { name: "", address: "", city: "São Paulo", state: "SP", description: "" };
const EMPTY_ROOM  = {
  hotel_id: "",  name: "", description: "", size_sqm: "",
  bed_type: "", bed_count: 1, max_occupancy: 2,
  bathroom_type: "", smoking_allowed: false, price_per_night: "",
};

// ─── Componente ───────────────────────────────────────────────────────────────

const AdminHospedagens = () => {
  const [hotels,    setHotels]    = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState("");

  // Modais
  const [hotelModal, setHotelModal] = useState<"create" | "edit" | null>(null);
  const [roomModal,  setRoomModal]  = useState<"create" | "edit" | null>(null);

  // Dados selecionados
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom,  setSelectedRoom]  = useState<RoomType | null>(null);

  // Forms
  const [hotelForm, setHotelForm] = useState(EMPTY_HOTEL);
  const [roomForm,  setRoomForm]  = useState(EMPTY_ROOM);
  const [roomImages, setRoomImages] = useState<{id?: number; preview: string; displayOrder: number; isFeatured: boolean; file?: File}[]>([]);

  // ── Carregar dados ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, r] = await Promise.all([hotelService.getAll(), roomService.getAll()]);
      setHotels(h);
      setRoomTypes(r);
    } catch {
      toast.error("Erro ao carregar hospedagens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers de formulário ───────────────────────────────────────────────────
  const openCreateHotel = () => { setHotelForm(EMPTY_HOTEL); setHotelModal("create"); };
  const openEditHotel   = (h: Hotel) => {
    setSelectedHotel(h);
    setHotelForm({ name: h.name || "", address: h.address || "", city: h.city || "São Paulo", state: h.state || "SP", description: h.description || "" });
    setHotelModal("edit");
  };
  const openCreateRoom = () => { setRoomForm(EMPTY_ROOM); setRoomImages([]); setRoomModal("create"); };
  const openEditRoom   = (r: RoomType) => {
    setSelectedRoom(r);
    setRoomForm({
      hotel_id:       String(r.hotel_id ?? ""),
      name:           r.name ?? "",
      description:    r.description ?? "",
      size_sqm:       String(r.size_sqm ?? ""),
      bed_type:       r.bed_type ?? "",
      bed_count:      r.bed_count ?? 1,
      max_occupancy:  r.max_occupancy ?? 2,
      bathroom_type:  r.bathroom_type ?? "",
      smoking_allowed:r.smoking_allowed ?? false,
      price_per_night:String(r.price_per_night ?? ""),
    });
    const imgs = (r.images ?? []).map((img: any, i: number) => ({
      id: img.id,
      preview: `data:${img.image_type};base64,${img.image_data}`,
      displayOrder: img.display_order ?? i + 1,
      isFeatured: img.display_order === 1,
    }));
    setRoomImages(imgs.sort((a, b) => a.displayOrder - b.displayOrder));
    setRoomModal("edit");
  };

  // ── CRUD Hotel ──────────────────────────────────────────────────────────────
  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: hotelForm.name, address: hotelForm.address,
        city: hotelForm.city, state: hotelForm.state,
        zip_code: "", phone: "", email: "", website: "",
        description: hotelForm.description, amenities: [],
      };
      if (hotelModal === "create") {
        await hotelService.create(payload);
        toast.success("Hotel criado com sucesso!");
      } else {
        await hotelService.update(selectedHotel!.id, payload);
        toast.success("Hotel atualizado com sucesso!");
      }
      setHotelModal(null);
      loadData();
    } catch {
      toast.error(`Erro ao ${hotelModal === "create" ? "criar" : "atualizar"} hotel`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHotel = async (h: Hotel) => {
    if (!confirm(`Excluir o hotel "${h.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await hotelService.delete(h.id);
      toast.success("Hotel excluído com sucesso!");
      loadData();
    } catch {
      toast.error("Erro ao excluir hotel");
    }
  };

  // ── CRUD Quarto ─────────────────────────────────────────────────────────────
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        hotel_id:       parseInt(roomForm.hotel_id),
        name:           roomForm.name,
        description:    roomForm.description,
        size_sqm:       parseFloat(roomForm.size_sqm) || 0,
        bed_type:       roomForm.bed_type,
        bed_count:      Number(roomForm.bed_count),
        max_occupancy:  Number(roomForm.max_occupancy),
        bathroom_type:  roomForm.bathroom_type,
        smoking_allowed:roomForm.smoking_allowed,
        price_per_night:parseFloat(roomForm.price_per_night),
      };
      const newImgs = roomImages.filter(i => i.file).map(i => i.file as File);

      if (roomModal === "create") {
        if (newImgs.length > 0) {
          await roomService.createWithImages(payload, newImgs);
        } else {
          await roomService.create(payload);
        }
        toast.success("Quarto criado com sucesso!");
      } else {
        if (newImgs.length > 0) {
          await roomService.updateWithImages(selectedRoom!.id, payload, newImgs);
        } else {
          await roomService.update(selectedRoom!.id, payload);
        }
        toast.success("Quarto atualizado com sucesso!");
      }
      setRoomModal(null);
      setRoomImages([]);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao salvar quarto: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (r: RoomType) => {
    if (!confirm(`Excluir o quarto "${r.name}"?`)) return;
    try {
      await roomService.delete(r.id);
      toast.success("Quarto excluído com sucesso!");
      loadData();
    } catch {
      toast.error("Erro ao excluir quarto");
    }
  };

  // ── Filtro ──────────────────────────────────────────────────────────────────
  const filteredHotels = hotels.filter(h => {
    const t = search.toLowerCase();
    return (
      h.name?.toLowerCase().includes(t) ||
      h.address?.toLowerCase().includes(t) ||
      h.city?.toLowerCase().includes(t)
    );
  });

  const filteredRooms = roomTypes.filter(r => {
    const t = search.toLowerCase();
    return r.name?.toLowerCase().includes(t) || r.hotel_name?.toLowerCase().includes(t);
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openCreateRoom}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo Quarto
          </Button>
          <Button size="sm" onClick={openCreateHotel}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo Hotel
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hospedagens</h2>
          <p className="text-muted-foreground text-sm">
            {hotels.length} hotel{hotels.length !== 1 ? "is" : ""} · {roomTypes.length} tipo{roomTypes.length !== 1 ? "s" : ""} de quarto
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Hotéis",        value: hotels.length,    icon: Home, color: "text-blue-600" },
            { label: "Tipos de Quarto",     value: roomTypes.length, icon: Bed,  color: "text-purple-600" },
            { label: "Localizações únicas", value: new Set(hotels.map(h => h.city).filter(Boolean)).size, icon: MapPin, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Busca */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* ── Lista de Hotéis ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Hotéis ({filteredHotels.length})</CardTitle>
            <CardDescription>Gerencie seus hotéis e propriedades</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHotels.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {search ? "Nenhum hotel encontrado para essa busca." : "Nenhum hotel cadastrado ainda."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredHotels.map(hotel => (
                  <div key={hotel.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Home className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{hotel.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {[hotel.address, hotel.city, hotel.state].filter(Boolean).join(", ")}
                        </p>
                        {hotel.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                            {hotel.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditHotel(hotel)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteHotel(hotel)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Lista de Quartos ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Quarto ({filteredRooms.length})</CardTitle>
            <CardDescription>Gerencie os quartos disponíveis e seus preços</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {search ? "Nenhum quarto encontrado para essa busca." : "Nenhum quarto cadastrado ainda."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredRooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden shrink-0">
                        {room.images?.[0] ? (
                          <img
                            src={`data:${room.images[0].image_type};base64,${room.images[0].image_data}`}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Bed className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{room.name}</p>
                        {room.hotel_name && (
                          <p className="text-xs text-muted-foreground">{room.hotel_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            R$ {Number(room.price_per_night).toFixed(2)}/noite
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {room.max_occupancy ?? room.capacity} hóspedes
                          </Badge>
                          {(room.images?.length ?? 0) > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {room.images!.length} foto{room.images!.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRoom(room)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRoom(room)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modal Hotel ───────────────────────────────────────────────────────── */}
      <Dialog open={hotelModal !== null} onOpenChange={() => setHotelModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{hotelModal === "create" ? "Novo Hotel" : `Editar: ${selectedHotel?.name}`}</DialogTitle>
            <DialogDescription>
              {hotelModal === "create" ? "Adicione uma nova propriedade ao catálogo." : "Atualize as informações do hotel."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveHotel} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome do Hotel</Label>
                <Input
                  value={hotelForm.name}
                  onChange={e => setHotelForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Center Plaza Premium"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Endereço</Label>
                <Input
                  value={hotelForm.address}
                  onChange={e => setHotelForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Rua das Flores, 123"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input
                  value={hotelForm.city}
                  onChange={e => setHotelForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input
                  value={hotelForm.state}
                  onChange={e => setHotelForm(p => ({ ...p, state: e.target.value }))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={hotelForm.description}
                  onChange={e => setHotelForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva o hotel..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" type="button" onClick={() => setHotelModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {hotelModal === "create" ? "Criar Hotel" : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Quarto ──────────────────────────────────────────────────────── */}
      <Dialog open={roomModal !== null} onOpenChange={() => setRoomModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{roomModal === "create" ? "Novo Quarto" : `Editar: ${selectedRoom?.name}`}</DialogTitle>
            <DialogDescription>
              {roomModal === "create" ? "Configure o novo tipo de quarto." : "Atualize as informações do quarto."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRoom} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hotel */}
              <div className="space-y-1.5">
                <Label>Hotel</Label>
                <Select
                  value={roomForm.hotel_id}
                  onValueChange={v => setRoomForm(p => ({ ...p, hotel_id: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(h => (
                      <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <Label>Nome do Quarto</Label>
                <Input
                  value={roomForm.name}
                  onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Suíte Luxo"
                  required
                />
              </div>

              {/* Preço */}
              <div className="space-y-1.5">
                <Label>Preço por Noite (R$)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={roomForm.price_per_night}
                  onChange={e => setRoomForm(p => ({ ...p, price_per_night: e.target.value }))}
                  required
                />
              </div>

              {/* Ocupação */}
              <div className="space-y-1.5">
                <Label>Ocupação Máxima</Label>
                <Input
                  type="number" min="1" max="20"
                  value={roomForm.max_occupancy}
                  onChange={e => setRoomForm(p => ({ ...p, max_occupancy: Number(e.target.value) }))}
                  required
                />
              </div>

              {/* Tipo de cama */}
              <div className="space-y-1.5">
                <Label>Tipo de Cama</Label>
                <Select
                  value={roomForm.bed_type}
                  onValueChange={v => setRoomForm(p => ({ ...p, bed_type: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Solteiro", "Casal", "Queen", "King", "Beliche"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nº camas */}
              <div className="space-y-1.5">
                <Label>Número de Camas</Label>
                <Input
                  type="number" min="1" max="5"
                  value={roomForm.bed_count}
                  onChange={e => setRoomForm(p => ({ ...p, bed_count: Number(e.target.value) }))}
                />
              </div>

              {/* Área */}
              <div className="space-y-1.5">
                <Label>Área (m²)</Label>
                <Input
                  type="number" step="0.1"
                  value={roomForm.size_sqm}
                  onChange={e => setRoomForm(p => ({ ...p, size_sqm: e.target.value }))}
                />
              </div>

              {/* Banheiro */}
              <div className="space-y-1.5">
                <Label>Tipo de Banheiro</Label>
                <Input
                  value={roomForm.bathroom_type}
                  onChange={e => setRoomForm(p => ({ ...p, bathroom_type: e.target.value }))}
                  placeholder="Ex: Privativo com banheira"
                />
              </div>

              {/* Descrição */}
              <div className="col-span-2 space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={roomForm.description}
                  onChange={e => setRoomForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva as características do quarto..."
                />
              </div>
            </div>

            {/* Imagens */}
            <div className="space-y-2">
              <Label>Imagens do Quarto</Label>
              <ImageUpload
                images={roomImages}
                onImagesChange={setRoomImages}
                maxImages={10}
                showFeatured
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
};

export default AdminHospedagens;