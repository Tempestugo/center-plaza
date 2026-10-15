import AccommodationCard from "./AccommodationCard";
import { Button } from "./ui/button";
import { ArrowDown, Loader2, Sparkles } from "lucide-react";
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
              Descubra nossas acomodações, perfeitamente localizadas
              para quem busca praticidade e conforto no centro de São Paulo.
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
              Descubra nossas acomodações, perfeitamente localizadas
              para quem busca praticidade e conforto no centro de São Paulo.
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
    <section id="acomodacoes" className="py-16 md:py-24 bg-stone-100/70 dark:bg-stone-900/40 scroll-mt-6 border-y border-stone-200/60 dark:border-stone-800">
      <div className="container mx-auto px-4">

        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Acomodações em Destaque
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-light">
            Conforto, qualidade e o melhor custo-benefício para a sua melhor experiência em São Paulo.
          </p>
        </div>

        {accommodations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14">
              {accommodations.map((accommodation, index) => (
                <div
                  key={accommodation.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <AccommodationCard {...accommodation} />
                </div>
              ))}
            </div>

            {/* Botão na cor de vinho padrão do hotel */}
            <div className="text-center">
              <Button
                size="xl"
                className="group px-10 py-6 text-base font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-gradient-to-r from-primary to-primary-light hover:brightness-110 text-primary-foreground shadow-primary/25 border border-primary/20"
                onClick={() => navigate("/hospedagens")}
              >
                Ver Todas as Hospedagens
                <ArrowDown className="ml-2 w-5 h-5 transition-transform group-hover:translate-y-1" />
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