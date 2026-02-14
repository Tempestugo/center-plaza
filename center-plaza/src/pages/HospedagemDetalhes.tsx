import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthModal } from "@/components/AuthModal";
import { ShareModal } from "@/components/ShareModal";
import { BookingFlow } from "@/components/BookingFlow";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { roomService, RoomType } from "@/services/api";
import { toast } from "sonner";
import { 
  Star, 
  MapPin, 
  Users, 
  Wifi, 
  Car, 
  Coffee,
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import accommodation1 from "@/assets/accommodation-1.jpg";
import accommodation2 from "@/assets/accommodation-2.jpg";
import accommodation3 from "@/assets/accommodation-3.jpg";

const HospedagemDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(3);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [bookingFlowOpen, setBookingFlowOpen] = useState(false);
  const [room, setRoom] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRoomDetails();
    }
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const roomData = await roomService.getById(parseInt(id!));
      setRoom(roomData);
    } catch (error) {
      console.error('Erro ao buscar detalhes do quarto:', error);
      toast.error('Erro ao carregar detalhes da acomodação');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Carregando...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Acomodação não encontrada</div>
          </div>
        </main>
      </div>
    );
  }

  // Parse amenities
  let amenities: string[] = [];
  if (room.amenities) {
    if (typeof room.amenities === 'string') {
      try {
        amenities = JSON.parse(room.amenities);
      } catch {
        amenities = room.amenities.split(',').map(a => a.trim());
      }
    } else if (Array.isArray(room.amenities)) {
      amenities = room.amenities;
    }
  }

  const accommodation = {
    id: room.id,
    name: room.name,
    location: room.hotel_name || 'Center Plaza Hotel',
    rating: 4.8,
    reviewCount: 45,
    price: room.price_per_night,
    maxGuests: room.max_occupancy,
    bedrooms: Math.ceil(room.max_occupancy / 2),
    bathrooms: 1,
    amenities: amenities.slice(0, 3).map(a => a.toLowerCase().replace(/\s+/g, '')),
    images: [accommodation1, accommodation2, accommodation3],
    description: room.description || 'Quarto confortável e bem equipado no Center Plaza Hotel.',
    features: amenities.slice(0, 6),
    reviews: [
      {
        id: 1,
        name: "Maria Silva",
        rating: 5,
        date: "Novembro 2024",
        comment: "Quarto excelente! Muito confortável e bem localizado."
      },
      {
        id: 2,
        name: "João Santos",
        rating: 5,
        date: "Outubro 2024",
        comment: "Perfeito para relaxar. Atendimento excelente e instalações impecáveis."
      }
    ]
  };

  const amenityIcons = {
    wifi: Wifi,
    estacionamento: Car,
    cafe: Coffee
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === accommodation.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? accommodation.images.length - 1 : prev - 1
    );
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    const isCurrentlyFavorited = isFavorite(accommodation.id.toString());
    
    if (isCurrentlyFavorited) {
      removeFromFavorites(accommodation.id.toString());
      toast.success("Removido dos favoritos");
    } else {
      addToFavorites({
        id: accommodation.id.toString(),
        name: accommodation.name,
        location: accommodation.location,
        price: accommodation.price,
        rating: accommodation.rating,
        image: accommodation.images[0]
      });
      toast.success("Adicionado aos favoritos");
    }
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setBookingFlowOpen(true);
  };

  const totalPrice = accommodation.price * nights;

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20">
        {/* Back Button */}
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/hospedagens")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar às hospedagens
          </Button>
        </div>

        {/* Image Gallery */}
        <section className="container mx-auto px-4 mb-8">
          <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden mb-4">
            <img 
              src={accommodation.images[currentImageIndex]} 
              alt={accommodation.name}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {accommodation.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white" onClick={handleShare}>
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

        {/* Content */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
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
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{accommodation.rating}</span>
                      </div>
                      <span className="text-muted-foreground">({accommodation.reviewCount} avaliações)</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      R$ {accommodation.price}
                    </div>
                    <div className="text-muted-foreground">por noite</div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{accommodation.bedrooms} quartos</span>
                  <span>•</span>
                  <span>{accommodation.bathrooms} banheiros</span>
                  <span>•</span>
                  <span>Até {accommodation.maxGuests} hóspedes</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Sobre esta hospedagem</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {accommodation.description}
                </p>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-xl font-semibold mb-4">O que este lugar oferece</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accommodation.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Comodidades</h2>
                <div className="flex gap-4">
                  {accommodation.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity as keyof typeof amenityIcons];
                    return (
                      <div key={amenity} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="capitalize">{amenity.replace('estacionamento', 'Estacionamento').replace('wifi', 'Wi-Fi').replace('cafe', 'Café da manhã')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Avaliações</h2>
                <div className="space-y-4">
                  {accommodation.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{review.name}</h4>
                            <p className="text-sm text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="flex">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        R$ {accommodation.price}
                      </div>
                      <div className="text-muted-foreground">por noite</div>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data de check-in</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          type="date"
                          className="pl-10"
                          defaultValue="2024-12-15"
                        />
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Hóspedes</label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{guests}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setGuests(Math.min(accommodation.maxGuests, guests + 1))}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Nights */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Noites</label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNights(Math.max(1, nights - 1))}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{nights}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNights(nights + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span>R$ {accommodation.price} x {nights} noites</span>
                        <span>R$ {totalPrice}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Taxa de serviço</span>
                        <span>R$ 50</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>R$ {totalPrice + 50}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleBookNow}
                    >
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

      <Footer />

      {/* Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <ShareModal 
        open={shareModalOpen} 
        onOpenChange={setShareModalOpen}
        title={accommodation.name}
        url={window.location.href}
      />
      <BookingFlow 
        open={bookingFlowOpen}
        onOpenChange={setBookingFlowOpen}
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
};

export default HospedagemDetalhes;