import { useState, useEffect } from 'react';
import { roomService, RoomType } from '@/services/api';

// Interface para mapear RoomType para AccommodationCard
export interface AccommodationData {
  id: number;
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

// Imagens padrão para as acomodações
const defaultImages = [
  '/src/assets/accommodation-1.jpg',
  '/src/assets/accommodation-2.jpg',
  '/src/assets/accommodation-3.jpg',
];

// Função para mapear RoomType para AccommodationData
function mapRoomToAccommodation(room: RoomType, index: number): AccommodationData {
  // Parse amenities se for string JSON
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

  return {
    id: room.id,
    name: room.name,
    image: defaultImages[index % defaultImages.length],
    location: room.hotel_name || 'Center Plaza',
    rating: 4.8, // Rating fixo baseado na qualidade do hotel
    reviewCount: 45, // Número fixo de reviews
    price: room.price_per_night,
    maxGuests: room.max_occupancy,
    amenities: amenities.length > 0 ? amenities : ['Wi-Fi', 'Estacionamento'],
    featured: index < 3,
  };
}

export function useRooms() {
  const [rooms, setRooms] = useState<AccommodationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roomTypes = await roomService.getAll();
      const accommodations = roomTypes.map((room, index) => 
        mapRoomToAccommodation(room, index)
      );
      
      setRooms(accommodations);
    } catch (err) {
      console.error('Erro ao buscar quartos:', err);
      setError('Erro ao carregar as acomodações');
      // Em caso de erro, manter lista vazia
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  return { rooms, loading, error, refetch: fetchRooms };
}

export function useFeaturedRooms() {
  const { rooms, loading, error } = useRooms();
  const featuredRooms = rooms.filter(room => room.featured).slice(0, 3);
  
  return { rooms: featuredRooms, loading, error };
}