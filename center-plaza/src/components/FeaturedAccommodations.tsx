import AccommodationCard from "./AccommodationCard";
import { Button } from "./ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFeaturedRooms } from "@/hooks/useRooms";

const FeaturedAccommodations = () => {
  const navigate = useNavigate();
  const { rooms: accommodations, loading, error } = useFeaturedRooms();

  if (loading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Acomodações em Destaque
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra nossas acomodações mais exclusivas, cuidadosamente
              selecionadas para proporcionar uma experiência inesquecível
            </p>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando acomodações...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Acomodações em Destaque
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra nossas acomodações mais exclusivas, cuidadosamente
              selecionadas para proporcionar uma experiência inesquecível
            </p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Acomodações em Destaque
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra nossas acomodações mais exclusivas, cuidadosamente
            selecionadas para proporcionar uma experiência inesquecível
          </p>
        </div>

        {accommodations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {accommodations.map((accommodation, index) => (
                <div
                  key={accommodation.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <AccommodationCard {...accommodation} />
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                variant="outline"
                className="group"
                onClick={() => navigate("/hospedagens")}
              >
                Ver Todas as Hospedagens
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma acomodação disponível no momento.</p>
            <Button onClick={() => navigate("/hospedagens")}>Ver Todas as Hospedagens</Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedAccommodations;