import { MapPin, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gtmEvent } from "@/main";

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
}: AccommodationCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="card-elegant group overflow-hidden h-full flex flex-col">
      <div className="relative">
        <div className="image-overlay h-64">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        {featured && (
          <Badge className="absolute top-4 left-4 bg-accent-warm text-accent-foreground">
            ⭐ Destaque
          </Badge>
        )}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent-warm text-accent-warm" />
          <span className="text-sm font-medium">{rating}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>
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
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs font-normal capitalize">
                {amenity}
              </Badge>
            ))}
            {amenities.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                +{amenities.length - 3} mais
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold text-primary">
                R$ {price.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-1">/noite</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/hospedagem/${id}`)}
            >
              Ver Detalhes
            </Button>
            <Button 
              className="flex-1" 
              variant="hero"
              onClick={() => {
                gtmEvent('click_reservar', { quarto: name, preco: price });
                navigate(`/hospedagem/${id}`);
              }}
            >
              Reservar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccommodationCard;
