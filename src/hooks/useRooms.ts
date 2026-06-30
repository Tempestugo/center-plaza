import { useState, useEffect } from 'react';
import { roomService, RoomType } from '@/services/api';

export interface AccommodationData {
  id: number;
  name: string;
  image: string;
  images: string[];
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  maxGuests: number;
  amenities: string[];
  description: string;
  featured?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80';

function mapRoomToAccommodation(
  room: RoomType & { hotel_name?: string; max_occupancy?: number; is_active?: number; images?: any[] },
  index: number
): AccommodationData {
  let amenities: string[] = [];
  if (room.amenities) {
    if (Array.isArray(room.amenities)) {
      amenities = room.amenities;
    } else {
      try { amenities = JSON.parse(room.amenities as unknown as string); }
      catch { amenities = (room.amenities as unknown as string).split(',').map(a => a.trim()); }
    }
  }

  
  const images: string[] = [];
  if (room.images && Array.isArray(room.images) && room.images.length > 0) {
    room.images.forEach((img: any) => {
      if (img.url) images.push(img.url);
      else if (img.image_data) images.push('data:' + (img.image_type || 'image/jpeg') + ';base64,' + img.image_data);
    });
  }
  const primaryImage = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  return {
    id:          room.id,
    name:        room.name,
    image:       primaryImage,
    images:      images.length > 0 ? images : [FALLBACK_IMAGE],
    location:    (room as any).hotel_name || 'Center Plaza',
    rating:      4.8,
    reviewCount: 45,
    price:       room.price_per_night,
    maxGuests:   (room as any).max_occupancy ?? (room as any).capacity ?? 2,
    amenities:   amenities.length > 0 ? amenities : ['Wi-Fi', 'Estacionamento'],
    description: room.description || '',
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
      const activeRooms = roomTypes.filter(
        (r: any) => r.is_active === undefined || r.is_active === 1 || r.is_active === true
      );
      setRooms(activeRooms.map((room, index) => mapRoomToAccommodation(room as any, index)));
    } catch (err) {
      console.error('Erro ao buscar quartos:', err);
      setError('Erro ao carregar as acomodacoes');
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
