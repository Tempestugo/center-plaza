import { useRef } from "react";
import { MapPin, ChevronLeft, ChevronRight, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Landmark {
  title: string;
  distance: string;
  description: string;
  image: string;
}

const landmarks: Landmark[] = [
  {
    title: "Avenida Paulista",
    distance: "1,2 km",
    description: "Cartão-postal com MASP, centros culturais, shoppings e restaurantes renomados.",
    image: "/landmarks/paulista.jpg",
  },
  {
    title: "Bairro da Liberdade",
    distance: "800m",
    description: "O tradicional bairro oriental com o icônico Torii, feirinha de artesanato e culinária asiática.",
    image: "/landmarks/liberdade.jpg",
  },
  {
    title: "Theatro Municipal de São Paulo",
    distance: "1,8 km",
    description: "Um dos mais belos patrimônios históricos e palcos de concertos e óperas do Brasil.",
    image: "/landmarks/teatro-municipal.jpg",
  },
  {
    title: "Hospital Beneficência Portuguesa",
    distance: "400m",
    description: "Complexo médico de ponta na Rua Maestro Cardim, a menos de 5 minutos a pé.",
    image: "/landmarks/beneficencia.jpg",
  },
  {
    title: "Roteiro Gastronômico do Bexiga",
    distance: "500m",
    description: "As tradicionais cantinas italianas da 13 de Maio, pizzarias e a Festa da Achiropita.",
    image: "/landmarks/bexiga.jpg",
  },
  {
    title: "Metrô São Joaquim (Linha 1-Azul)",
    distance: "350m",
    description: "Estação a 4 minutos de caminhada com acesso rápido a toda a malha metroviária de SP.",
    image: "/landmarks/metro.jpg",
  },
];

const LocationSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="localizacao" className="py-16 md:py-24 bg-stone-50 dark:bg-stone-950/40 scroll-mt-6 border-b border-stone-200/60 dark:border-stone-800">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-3">
            <Navigation className="w-3.5 h-3.5 text-amber-600" />
            <span>Localização Privilegiada</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            No coração de São Paulo
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Hospede-se na Bela Vista com fácil acesso ao metrô, hospitais de referência, teatros e ao melhor roteiro cultural e gastronômico da capital.
          </p>
        </div>

        {/* Carrossel de Pontos de Interesse */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                O que tem por perto
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Deslize para ver os pontos turísticos e facilidades nas imediações do hotel
              </p>
            </div>

            {/* Controles de rolagem */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                aria-label="Rolar para esquerda"
                className="h-9 w-9 rounded-full bg-white dark:bg-stone-900 shadow-sm hover:bg-stone-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                aria-label="Rolar para direita"
                className="h-9 w-9 rounded-full bg-white dark:bg-stone-900 shadow-sm hover:bg-stone-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Cards com fotos reais salvas localmente */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700"
            style={{ scrollbarWidth: "thin" }}
          >
            {landmarks.map((item, index) => (
              <div
                key={index}
                className="snap-start shrink-0 w-[260px] sm:w-[300px] rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Imagem real */}
                <div className="relative h-44 overflow-hidden bg-stone-200 dark:bg-stone-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Badge da distância */}
                  <span className="absolute bottom-3 left-3 bg-amber-500 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    {item.distance}
                  </span>
                </div>

                {/* Conteúdo descritivo */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa Embed do Google */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span>Rua Maestro Cardim, 418 — Bela Vista</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                São Paulo - SP, CEP 01323-000 • A 350m do Metrô São Joaquim
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 self-start md:self-auto border-stone-300 dark:border-stone-700 hover:bg-stone-100"
              asChild
            >
              <a
                href="https://maps.google.com/?q=Rua+Maestro+Cardim+418+Bela+Vista+São+Paulo"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir no Google Maps
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-inner border border-stone-200 dark:border-stone-800 aspect-[16/9] md:aspect-[21/9] w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1!2d-46.6395!3d-23.5610!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59b0e6e5e1a7%3A0x123456789!2sR.+Maestro+Cardim%2C+418+-+Bela+Vista%2C+S%C3%A3o+Paulo+-+SP%2C+01323-000!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Center Plaza Hotel"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default LocationSection;
