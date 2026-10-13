import { MapPin, Users, Star, Coffee } from "lucide-react";
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
  featured?: boolean;
  isActive?: boolean;
}

const CAFE_KEYWORDS = ["café da manhã", "cafe da manha", "café da manhã incluso", "breakfast"];

function hasCafe(amenities: string[]): boolean {
  return amenities.some(a =>
    CAFE_KEYWORDS.some(kw => a.toLowerCase().includes(kw))
  );
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
  amenities,
  featured = false,
  isActive = true,
}: AccommodationCardProps) => {
  const navigate = useNavigate();
  const includesCafe = hasCafe(amenities);

  const otherAmenities = amenities.filter(
    a => !CAFE_KEYWORDS.some(kw => a.toLowerCase().includes(kw))
  );

  const goToDetails = () => {
    navigate(`/hospedagem/${id}`);
  };

  return (
    <Card
      onClick={goToDetails}
      className={`card-elegant group overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        ${!isActive ? "opacity-90 bg-muted/20" : ""}
        ${includesCafe && isActive ? "ring-2 ring-amber-400/60 shadow-lg shadow-amber-100" : ""}
      `}
    >
      <div className="relative">
        <div className="image-overlay h-64 overflow-hidden">
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!isActive ? "grayscale-[30%]" : ""}`}
          />
        </div>

        {/* Badge top-left: esgotado ou destaque */}
        {!isActive ? (
          <Badge className="absolute top-4 left-4 bg-rose-600 text-white font-semibold shadow-md">
            🔴 Reservas Esgotadas
          </Badge>
        ) : featured ? (
          <Badge className="absolute top-4 left-4 bg-accent-warm text-accent-foreground">
            ⭐ Destaque
          </Badge>
        ) : null}

        {/* Rating top-right */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent-warm text-accent-warm" />
          <span className="text-sm font-medium">{rating}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Faixa âmbar na base da foto — só quando tem café e está ativo */}
        {includesCafe && isActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-400 text-white py-1.5 px-3 flex items-center gap-2">
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-semibold tracking-wide">☕ Café da manhã incluso</span>
          </div>
        )}
      </div>

      <CardContent className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{location}</span>
          </div>
        </div>

        <div className="mb-auto">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Até {maxGuests} hóspedes</span>
            </div>
          </div>

          {/* Amenities sem café da manhã (aparece separado) */}
          <div className="flex flex-wrap gap-2">
            {otherAmenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs font-normal capitalize">
                {amenity}
              </Badge>
            ))}
            {otherAmenities.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                +{otherAmenities.length - 3} mais
              </span>
            )}
          </div>

          {/* Box promocional de café — destaque adicional no corpo do card */}
          {includesCafe && isActive && (
            <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-medium text-amber-800">
                🎉 Café da manhã <span className="font-bold">incluso</span> na diária
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              {/* Preço de âncora cortado (25% off meramente visual) */}
              <div className="flex items-center gap-2 leading-none mb-1.5">
                <span className="text-sm sm:text-base text-muted-foreground line-through font-medium">
                  R$ {Math.round(price / 0.75).toLocaleString()}
                </span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  -25% OFF
                </span>
              </div>
              <div className="flex items-baseline">
                <span className={`text-2xl sm:text-3xl font-extrabold ${!isActive ? "text-muted-foreground" : "text-primary"}`}>
                  R$ {price.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground ml-1 font-medium">/noite</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToDetails();
              }}
            >
              Ver Detalhes
            </Button>
            {isActive ? (
              <Button
                className="flex-1 cursor-pointer"
                variant="hero"
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
                className="flex-1 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 cursor-not-allowed"
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
