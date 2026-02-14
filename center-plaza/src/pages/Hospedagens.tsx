import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccommodationCard from "@/components/AccommodationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Users, Star, Loader2 } from "lucide-react";
import { useRooms } from "@/hooks/useRooms";

const Hospedagens = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuests, setSelectedGuests] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  
  const { rooms: accommodations, loading, error } = useRooms();

  const filteredAndSortedAccommodations = accommodations
    .filter(accommodation => {
      const matchesSearch = accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           accommodation.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGuests = selectedGuests === "" || accommodation.maxGuests >= parseInt(selectedGuests);
      return matchesSearch && matchesGuests;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "featured":
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary-light py-20">
          <div className="container mx-auto px-4 text-center text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Nossas Hospedagens
            </h1>
            <p className="text-xl max-w-2xl mx-auto">
              Encontre a acomodação perfeita para sua experiência na serra
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 bg-secondary/30 sticky top-20 z-40 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou localização..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select
                    className="pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground"
                    value={selectedGuests}
                    onChange={(e) => setSelectedGuests(e.target.value)}
                  >
                    <option value="">Qualquer quantidade</option>
                    <option value="2">2+ hóspedes</option>
                    <option value="4">4+ hóspedes</option>
                    <option value="6">6+ hóspedes</option>
                    <option value="8">8+ hóspedes</option>
                  </select>
                </div>
                
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando acomodações...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <p className="text-muted-foreground">
                    {filteredAndSortedAccommodations.length} hospedagem(ns) encontrada(s)
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Ordenar por:</span>
                    <select 
                      className="border border-input rounded-md px-3 py-1 bg-background text-foreground"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="featured">Destaque</option>
                      <option value="price-low">Menor Preço</option>
                      <option value="price-high">Maior Preço</option>
                      <option value="rating">Melhor Avaliação</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredAndSortedAccommodations.map((accommodation, index) => (
                    <div
                      key={accommodation.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <AccommodationCard {...accommodation} />
                    </div>
                  ))}
                </div>

                {filteredAndSortedAccommodations.length === 0 && accommodations.length > 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma hospedagem encontrada</h3>
                    <p className="text-muted-foreground">
                      Tente ajustar seus filtros de busca para encontrar mais opções.
                    </p>
                  </div>
                )}

                {accommodations.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma acomodação disponível</h3>
                    <p className="text-muted-foreground">
                      No momento não temos acomodações cadastradas. Volte em breve!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Hospedagens;