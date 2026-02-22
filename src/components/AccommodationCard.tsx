import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Users, Share2, Heart, ArrowLeft, ChevronLeft, ChevronRight, Calendar, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { roomService } from "@/services/api";
import { BookingFlow } from "@/components/BookingFlow";
import { AuthModal } from "@/components/AuthModal";
import { ShareModal } from "@/components/ShareModal";

// Imagens de placeholder (mesmas do bundle)
const PLACEHOLDER_IMAGES = [
  "/assets/accommodation-1-ymyyJMDn.jpg",
  "/assets/accommodation-2-BJaeP26a.jpg",
  "/assets/accommodation-3-CfceqvWp.jpg"
];

export default function AccommodationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(3);
  
  // Modais
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRoom();
    }
  }, [id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const data = await roomService.getById(parseInt(id!));
      setRoom(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes do quarto:", error);
      toast.error("Erro ao carregar detalhes da acomodação");
    } finally {
      setLoading(false);
    }
  };

  // Lógica do botão RESERVAR
  const handleReserve = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true); // Abre modal de login se não estiver logado
      return;
    }
    setIsReservationOpen(true); // Abre modal de reserva se estiver logado
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (room) {
      if (isFavorite(room.id.toString())) {
        removeFromFavorites(room.id.toString());
        toast.success("Removido dos favoritos");
      } else {
        addToFavorites({
          id: room.id.toString(),
          name: room.name,
          location: room.hotel_name || "Center Plaza Hotel",
          price: room.price_per_night,
          rating: 4.8,
          image: PLACEHOLDER_IMAGES[0]
        });
        toast.success("Adicionado aos favoritos");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Acomodação não encontrada</h2>
        <Button onClick={() => navigate("/hospedagens")}>Voltar para Hospedagens</Button>
      </div>
    );
  }

  // Tratamento de dados para o formato da UI
  let amenitiesList: string[] = [];
  if (room.amenities) {
    if (typeof room.amenities === 'string') {
      try {
        amenitiesList = JSON.parse(room.amenities);
      } catch {
        amenitiesList = room.amenities.split(',').map((s: string) => s.trim());
      }
    } else if (Array.isArray(room.amenities)) {
      amenitiesList = room.amenities;
    }
  }

  const accommodation = {
    id: room.id,
    name: room.name,
    location: room.hotel_name || "Center Plaza Hotel",
    rating: 4.8,
    reviewCount: 45,
    price: room.price_per_night,
    maxGuests: room.max_occupancy,
    bedrooms: Math.ceil(room.max_occupancy / 2),
    bathrooms: 1,
    amenities: amenitiesList,
    images: PLACEHOLDER_IMAGES,
    description: room.description || "Quarto confortável e bem equipado no Center Plaza Hotel.",
  };

  const totalPrice = accommodation.price * nights;

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/hospedagens")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar às hospedagens
          </Button>
        </div>

        {/* Galeria de Imagens */}
        <section className="container mx-auto px-4 mb-8">
          <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden mb-4 group">
            <img 
              src={accommodation.images[currentImageIndex]} 
              alt={accommodation.name} 
              className="w-full h-full object-cover transition-transform duration-500"
            />
            
            {/* Botões de Navegação da Galeria */}
            <button 
              onClick={() => setCurrentImageIndex(prev => prev === 0 ? accommodation.images.length - 1 : prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentImageIndex(prev => prev === accommodation.images.length - 1 ? 0 : prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Ações (Share/Favorite) */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white" onClick={() => setIsShareOpen(true)}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="icon" 
                className={`bg-white/90 hover:bg-white ${isFavorite(accommodation.id.toString()) ? "text-red-500" : ""}`}
                onClick={handleFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorite(accommodation.id.toString()) ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Detalhes da Acomodação */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">{accommodation.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{accommodation.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>Até {accommodation.maxGuests} hóspedes</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Sobre esta hospedagem</h2>
                <p className="text-muted-foreground leading-relaxed">{accommodation.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Comodidades</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {accommodation.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card de Reserva */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        R$ {accommodation.price}
                      </div>
                      <div className="text-muted-foreground">por noite</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">Check-in</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input type="date" className="pl-10" />
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Hóspedes</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setGuests(Math.max(1, guests - 1))}>-</Button>
                          <span className="w-8 text-center">{guests}</span>
                          <Button variant="outline" size="icon" onClick={() => setGuests(Math.min(accommodation.maxGuests, guests + 1))}>+</Button>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Noites</Label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setNights(Math.max(1, nights - 1))}>-</Button>
                          <span className="w-8 text-center">{nights}</span>
                          <Button variant="outline" size="icon" onClick={() => setNights(nights + 1)}>+</Button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>R$ {accommodation.price} x {nights} noites</span>
                        <span>R$ {totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de serviço</span>
                        <span>R$ 50</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>R$ {totalPrice + 50}</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleReserve}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Reservar Agora
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Você não será cobrado ainda
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <AuthModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      
      <ShareModal 
        open={isShareOpen} 
        onOpenChange={setIsShareOpen} 
        accommodationName={accommodation.name}
        accommodationUrl={window.location.pathname}
      />

      <BookingFlow 
        open={isReservationOpen} 
        onOpenChange={setIsReservationOpen}
        accommodation={{
          id: accommodation.id,
          name: accommodation.name,
          location: accommodation.location,
          price: accommodation.price,
          maxGuests: accommodation.maxGuests,
          image: accommodation.images[0],
          amenities: accommodation.amenities
        }}
      />
    </div>
  );
}
