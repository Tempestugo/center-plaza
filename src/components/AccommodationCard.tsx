import { useState, useEffect } from "react";
import { MapPin, Users, Star, Coffee, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gtmEvent } from "@/lib/gtm";

interface AccommodationCardProps {
  id: number | string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  maxGuests: number;
  amenities: string[];
  description?: string;
  featured?: boolean;
  isActive?: boolean;
}

const CAFE_KEYWORDS = [
  "café da manhã",
  "cafe da manha",
  "café da manhã incluso",
  "cafe da manha incluso",
  "café incluso",
  "cafe incluso",
  "breakfast",
  "café matinal",
  "cafe matinal"
];

function hasCafe(amenities?: string[]): boolean {
  if (!amenities || !Array.isArray(amenities)) return false;
  return amenities.some(a => {
    if (typeof a !== "string") return false;
    const lower = a.toLowerCase().trim();
    return CAFE_KEYWORDS.some(kw => lower === kw || lower.includes("café da manhã") || lower.includes("cafe da manha") || lower.includes("breakfast"));
  });
}

const AccommodationCard = ({
  id,
  name,
  image,
  location,
  rating,
  reviewCount,
  price,
  maxGuests,
  amenities = [],
  description,
  featured = false,
  isActive = true,
}: AccommodationCardProps) => {
  const navigate = useNavigate();
  const [promoText, setPromoText] = useState<string>("30/10");

  useEffect(() => {
    // Data da promoção: 30/10
    const defaultDate = "30/10";

    fetch('/api/settings/promo_text')
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          // Extrair apenas a data caso venha "Válido até DD/MM" e garantir 30/10
          const cleanDate = d.value.replace(/válido até\s*/i, '').replace(/31\/10/g, '30/10').trim();
          setPromoText(cleanDate || defaultDate);
        } else {
          setPromoText(defaultDate);
        }
      })
      .catch(() => setPromoText(defaultDate));
  }, []);

  // Mostra café da manhã SOMENTE se estiver expressamente selecionado nas comodidades do quarto
  const includesCafe = hasCafe(amenities);

  const otherAmenities = (amenities || []).filter(
    a => !hasCafe([a])
  );

  const goToDetails = () => {
    navigate(`/hospedagem/${id}`);
  };

  return (
    <Card
      onClick={goToDetails}
      className={`card-elegant group overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border border-stone-200/80 dark:border-stone-800
        ${!isActive ? "opacity-90 bg-muted/20" : "bg-card"}
        ${isActive ? "ring-1 ring-amber-400/40 hover:ring-amber-400" : ""}
      `}
    >
      <div className="relative">
        <div className="image-overlay h-64 overflow-hidden">
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isActive ? "grayscale-[30%]" : ""}`}
          />
        </div>

        {/* Badge top-left: esgotado ou destaque */}
        {!isActive ? (
          <Badge className="absolute top-4 left-4 bg-rose-600 text-white font-semibold shadow-md">
            🔴 Reservas Esgotadas
          </Badge>
        ) : featured ? (
          <Badge className="absolute top-4 left-4 bg-amber-500 text-stone-950 font-bold shadow-md">
            ⭐ Mais Reservado
          </Badge>
        ) : null}

        {/* Avaliações reais no topo direito */}
        <div className="absolute top-4 right-4 bg-stone-900/90 text-white backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-lg">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold">{rating.toFixed(1)}</span>
          <span className="text-[11px] text-stone-300">({reviewCount})</span>
        </div>

        {/* Faixa âmbar na base da foto — SOMENTE se o quarto tiver café da manhã em suas comodidades */}
        {isActive && includesCafe && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 py-1.5 px-3 flex items-center justify-between font-semibold shadow-md">
            <div className="flex items-center gap-1.5 text-xs">
              <Coffee className="w-3.5 h-3.5 shrink-0" />
              <span>Café da manhã incluso</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold bg-black/15 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Até {promoText}</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold group-hover:text-amber-600 transition-colors">
              {name}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs">{location}</span>
          </div>
        </div>

        {/* Descrição individual personalizada para o quarto */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3.5 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mb-auto">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <span>Até {maxGuests} hóspedes</span>
            </div>
          </div>

          {/* Comodidades principais */}
          <div className="flex flex-wrap gap-1.5">
            {otherAmenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-[11px] font-normal py-0.5 px-2">
                {amenity}
              </Badge>
            ))}
            {otherAmenities.length > 3 && (
              <span className="text-[11px] text-muted-foreground self-center">
                +{otherAmenities.length - 3} mais
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-border/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              {/* Preço de âncora cortado (-25% off) */}
              <div className="flex items-center gap-1.5 leading-none mb-1">
                <span className="text-xs sm:text-sm text-muted-foreground line-through font-medium">
                  R$ {Math.round(price / 0.75).toLocaleString()}
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  -25% OFF
                </span>
              </div>
              <div className="flex items-baseline">
                <span className={`text-2xl sm:text-3xl font-extrabold ${!isActive ? "text-muted-foreground" : "text-primary"}`}>
                  R$ {price.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground ml-1 font-medium">/noite</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs sm:text-sm cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={(e) => {
                e.stopPropagation();
                goToDetails();
              }}
            >
              Ver Detalhes
            </Button>
            {isActive ? (
              <Button
                className="flex-1 text-xs sm:text-sm cursor-pointer font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  gtmEvent("click_reservar", { quarto: name, preco: price });
                  goToDetails();
                }}
              >
                Reservar
              </Button>
            ) : (
              <Button
                className="flex-1 text-xs sm:text-sm bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 cursor-not-allowed"
                disabled
                onClick={(e) => e.stopPropagation()}
              >
                Esgotado
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccommodationCard;
