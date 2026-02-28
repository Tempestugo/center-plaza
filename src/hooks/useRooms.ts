import { useState, useEffect } from 'react';
import { roomService, RoomType } from '@/services/api';

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

const defaultImages = [
  '/src/assets/accommodation-1.jpg',
  '/src/assets/accommodation-2.jpg',
  '/src/assets/accommodation-3.jpg',
];

function mapRoomToAccommodation(
  room: RoomType & { hotel_name?: string; max_occupancy?: number; is_active?: number },
  index: number
): AccommodationData {
  let amenities: string[] = [];
  if (room.amenities) {
    if (Array.isArray(room.amenities)) {
      amenities = room.amenities;
    } else {
      try {
        amenities = JSON.parse(room.amenities as unknown as string);
      } catch {
        amenities = (room.amenities as unknown as string).split(',').map(a => a.trim());
      }
    }
  }

  return {
    id:          room.id,
    name:        room.name,
    image:       defaultImages[index % defaultImages.length],
    location:    (room as any).hotel_name || 'Center Plaza',
    rating:      4.8,
    reviewCount: 45,
    price:       room.price_per_night,
    maxGuests:   (room as any).max_occupancy ?? room.capacity ?? 2,
    amenities:   amenities.length > 0 ? amenities : ['Wi-Fi', 'Estacionamento'],
    featured:    index < 3,
  };
}

export function useRooms() {
  const [rooms,   setRooms]   = useState<AccommodationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomTypes = await roomService.getAll();

      // A rota pública /rooms já retorna só ativos (is_active = 1) após o patch do backend.
      // Este filtro é uma camada extra de segurança caso a rota ainda não esteja atualizada.
      const activeRooms = roomTypes.filter(
        (r: any) => r.is_active === undefined || r.is_active === 1 || r.is_active === true
      );

      setRooms(activeRooms.map((room, index) => mapRoomToAccommodation(room, index)));
    } catch (err) {
      console.error('Erro ao buscar quartos:', err);
      setError('Erro ao carregar as acomodações');
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