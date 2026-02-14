import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { hotelService, roomService, Hotel, RoomType } from "@/services/api";
import ImageUpload from "@/components/admin/ImageUpload";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Home,
  Calendar,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Upload,
  MapPin,
  Users,
  Star,
  Bed
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminHospedagens = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditHotelDialogOpen, setIsEditHotelDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    maxGuests: "",
    price: "",
    rooms: ""
  });
  const [roomFormData, setRoomFormData] = useState({
    hotel_id: '',
    name: '',
    description: '',
    size_sqm: '',
    bed_type: '',
    bed_count: 1,
    max_occupancy: 2,
    amenities: [],
    bathroom_type: '',
    smoking_allowed: false,
    price_per_night: ''
  });
  const [roomImages, setRoomImages] = useState<{id?: number; preview: string; displayOrder: number; isFeatured: boolean}[]>([]);

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hotelsData, roomTypesData] = await Promise.all([
        hotelService.getAll(),
        roomService.getAll()
      ]);
      setHotels(hotelsData);
      setRoomTypes(roomTypesData);
    } catch (err) {
      setError('Erro ao carregar dados');
      toast.error('Erro ao carregar hospedagens');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newHotel = {
        name: formData.name,
        address: formData.location,
        city: 'São Paulo',
        state: 'SP',
        zip_code: '',
        phone: '',
        email: '',
        website: '',
        description: formData.description,
        amenities: []
      };
      
      await hotelService.create(newHotel);
      toast.success('Hotel criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        location: "",
        description: "",
        maxGuests: "",
        price: "",
        rooms: ""
      });
      loadData();
    } catch (err) {
      toast.error('Erro ao criar hotel');
      console.error('Erro ao criar hotel:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleEditHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setFormData({
      name: hotel.name || '',
      location: hotel.address || '',
      description: hotel.description || '',
      maxGuests: '',
      price: '',
      rooms: ''
    });
    setIsEditHotelDialogOpen(true);
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    
    try {
      const updatedHotel = {
        name: formData.name,
        address: formData.location,
        city: selectedHotel.city || 'São Paulo',
        state: selectedHotel.state || 'SP',
        zip_code: selectedHotel.zip_code || '',
        phone: selectedHotel.phone || '',
        email: selectedHotel.email || '',
        website: selectedHotel.website || '',
        description: formData.description,
        amenities: selectedHotel.amenities || []
      };
      
      await hotelService.update(selectedHotel.id, updatedHotel);
      toast.success('Hotel atualizado com sucesso!');
      setIsEditHotelDialogOpen(false);
      setSelectedHotel(null);
      setFormData({
        name: '',
        location: '',
        description: '',
        maxGuests: '',
        price: '',
        rooms: ''
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao atualizar hotel:', err);
      toast.error('Erro ao atualizar hotel');
    }
  };

  const handleDeleteHotel = async (hotel: Hotel) => {
    if (!confirm(`Tem certeza que deseja excluir o hotel "${hotel.name}"?`)) {
      return;
    }
    
    try {
      await hotelService.delete(hotel.id);
      toast.success('Hotel excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir hotel:', error);
      toast.error('Erro ao excluir hotel');
    }
  };

  const handleDeleteRoom = async (room: RoomType) => {
    if (!confirm(`Tem certeza que deseja excluir o quarto "${room.name}"?`)) {
      return;
    }
    
    try {
      await roomService.delete(room.id);
      toast.success('Quarto excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir quarto:', error);
      toast.error('Erro ao excluir quarto');
    }
  };

  const handleEditRoom = (room: RoomType) => {
    setSelectedRoom(room);
    setRoomFormData({
      hotel_id: room.hotel_id || '',
      name: room.name || '',
      description: room.description || '',
      size_sqm: room.size_sqm || '',
      bed_type: room.bed_type || '',
      bed_count: room.bed_count || 1,
      max_occupancy: room.max_occupancy || 2,
      amenities: room.amenities || [],
      bathroom_type: room.bathroom_type || '',
      smoking_allowed: room.smoking_allowed || false,
      price_per_night: room.price_per_night || ''
    });
    
    // Converter imagens existentes para o formato do componente
     const existingImages = (room.images || []).map((img: {id: number; image_type: string; image_data: string; display_order?: number}, index: number) => ({
       id: img.id,
       preview: `data:${img.image_type};base64,${img.image_data}`,
       displayOrder: img.display_order || index + 1,
       isFeatured: img.display_order === 1
     }));
     
     // Ordenar por display_order
     existingImages.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setRoomImages(existingImages);
    setIsEditDialogOpen(true);
  };

  const handleRoomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Dados sendo enviados:');
      console.log('Room ID:', selectedRoom.id);
      console.log('Form Data:', roomFormData);
      console.log('Room Images:', roomImages);
      
      const roomData = {
        hotel_id: parseInt(roomFormData.hotel_id),
        name: roomFormData.name,
        description: roomFormData.description,
        size_sqm: parseFloat(roomFormData.size_sqm),
        bed_type: roomFormData.bed_type,
        bed_count: parseInt(roomFormData.bed_count),
        max_occupancy: parseInt(roomFormData.max_occupancy),
        amenities: roomFormData.amenities || [],
        bathroom_type: roomFormData.bathroom_type,
        smoking_allowed: roomFormData.smoking_allowed,
        price_per_night: parseFloat(roomFormData.price_per_night)
      };
      
      // Verificar se há novas imagens para enviar
      const newImages = roomImages
        .filter(img => img.file) // Apenas imagens que têm o arquivo original
        .map(img => img.file as File);
      
      let updatedRoom;
      
      if (newImages.length > 0) {
        console.log('📸 Enviando com imagens:', newImages.length);
        updatedRoom = await roomService.updateWithImages(selectedRoom.id, roomData, newImages);
      } else {
        console.log('📝 Enviando apenas dados (sem imagens)');
        updatedRoom = await roomService.update(selectedRoom.id, roomData);
      }
      
      console.log('✅ Quarto atualizado:', updatedRoom);
       
      // Recarregar dados para garantir sincronização
      await loadData();
       
      // Mostrar mensagem de sucesso
      alert('Quarto atualizado com sucesso!');
      
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
      setRoomImages([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao atualizar quarto:', err);
      alert('Erro ao atualizar quarto: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setRoomFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const filteredAccommodations = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Gerenciar Hospedagens</h1>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Hospedagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Hospedagem</DialogTitle>
                <DialogDescription>
                  Adicione uma nova propriedade ao seu catálogo
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateHotel}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Hospedagem</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Chalé das Montanhas" 
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input 
                      id="location" 
                      placeholder="Ex: Serra da Mantiqueira" 
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva a hospedagem..." 
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagens</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clique para fazer upload ou arraste as imagens</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Hospedagem</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
            <Button variant="default" className="w-full justify-start">
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
            {/* Search */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar hospedagens..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hotéis</p>
                      <p className="text-2xl font-bold">{hotels.length}</p>
                    </div>
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipos de Quarto</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {roomTypes.length}
                      </p>
                    </div>
                    <Bed className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Localizações</p>
                      <p className="text-2xl font-bold">{new Set(hotels.map(h => h.location)).size}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-2xl font-bold text-green-600">Ativo</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-green-600 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accommodations List */}
            <Card>
              <CardHeader>
                <CardTitle>Hotéis ({filteredAccommodations.length})</CardTitle>
                <CardDescription>Gerencie seus hotéis e propriedades</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Carregando hotéis...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={loadData} variant="outline">
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredAccommodations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum hotel encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAccommodations.map((hotel) => (
                      <div key={hotel.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Home className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{hotel.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {hotel.location}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {hotel.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="default">
                                Ativo
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                ID: {hotel.id}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => handleEditHotel(hotel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive" 
                            title="Excluir"
                            onClick={() => handleDeleteHotel(hotel)}
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
            
            {/* Room Types Section */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Quartos ({roomTypes.length})</CardTitle>
                <CardDescription>Gerencie os tipos de quartos disponíveis</CardDescription>
              </CardHeader>
              <CardContent>
                {roomTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum tipo de quarto encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roomTypes.map((room) => (
                      <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {room.images && room.images.length > 0 ? (
                              <img 
                                src={`data:${room.images[0].image_type};base64,${room.images[0].image_data}`}
                                alt={room.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Bed className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {room.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline">
                                R$ {room.price_per_night}/noite
                              </Badge>
                              <Badge variant="secondary">
                                {room.max_occupancy} hóspedes
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {room.images?.length || 0} imagens
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => handleEditRoom(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive" 
                            title="Excluir"
                            onClick={() => handleDeleteRoom(room)}
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
          </div>
        </main>
      </div>
      
      {/* Edit Hotel Dialog */}
      <Dialog open={isEditHotelDialogOpen} onOpenChange={setIsEditHotelDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Hotel: {selectedHotel?.name}</DialogTitle>
            <DialogDescription>
              Edite as informações do hotel
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateHotel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Hotel</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Endereço Completo</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ex: Rua das Flores, 123 - Centro"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva o hotel..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setIsEditHotelDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Quarto: {selectedRoom?.name}</DialogTitle>
            <DialogDescription>
              Edite as informações e imagens do quarto
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRoomFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Quarto</Label>
                <Input
                  id="name"
                  name="name"
                  value={roomFormData.name}
                  onChange={handleRoomInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price_per_night">Preço por Noite (R$)</Label>
                <Input
                  id="price_per_night"
                  name="price_per_night"
                  type="number"
                  step="0.01"
                  value={roomFormData.price_per_night}
                  onChange={handleRoomInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bed_type">Tipo de Cama</Label>
                <Select 
                  value={roomFormData.bed_type} 
                  onValueChange={(value) => setRoomFormData(prev => ({ ...prev, bed_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de cama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cama de Solteiro">Cama de Solteiro</SelectItem>
                    <SelectItem value="Cama de Casal">Cama de Casal</SelectItem>
                    <SelectItem value="Cama King">Cama King</SelectItem>
                    <SelectItem value="Cama Queen">Cama Queen</SelectItem>
                    <SelectItem value="Beliche">Beliche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_occupancy">Ocupação Máxima</Label>
                <Input
                  id="max_occupancy"
                  name="max_occupancy"
                  type="number"
                  min="1"
                  max="10"
                  value={roomFormData.max_occupancy}
                  onChange={handleRoomInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size_sqm">Área (m²)</Label>
                <Input
                  id="size_sqm"
                  name="size_sqm"
                  type="number"
                  step="0.1"
                  value={roomFormData.size_sqm}
                  onChange={handleRoomInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bed_count">Número de Camas</Label>
                <Input
                  id="bed_count"
                  name="bed_count"
                  type="number"
                  min="1"
                  max="5"
                  value={roomFormData.bed_count}
                  onChange={handleRoomInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={roomFormData.description}
                onChange={handleRoomInputChange}
                placeholder="Descreva as características do quarto..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bathroom_type">Tipo de Banheiro</Label>
              <Input
                id="bathroom_type"
                name="bathroom_type"
                value={roomFormData.bathroom_type}
                onChange={handleRoomInputChange}
                placeholder="Ex: Banheiro privativo com chuveiro"
              />
            </div>
            
            <div className="space-y-4">
              <Label>Imagens do Quarto</Label>
              <ImageUpload
                images={roomImages}
                onImagesChange={setRoomImages}
                maxImages={10}
                showFeatured={true}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHospedagens;