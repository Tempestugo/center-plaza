// Dados mockados para uso em produção
import { Hotel, RoomType, Reservation } from './api';

export const mockHotels: Hotel[] = [
  {
    id: 1,
    name: "Center Plaza Hotel",
    description: "Um hotel moderno no centro da cidade com todas as comodidades necessárias para uma estadia confortável.",
    address: "Rua Principal, 123 - Centro",
    location: "Centro da Cidade",
    phone: "(11) 1234-5678",
    email: "contato@centerplaza.com",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

export const mockRoomTypes: RoomType[] = [
  {
    id: 1,
    hotel_id: 1,
    name: "Quarto Standard",
    description: "Quarto confortável com cama de casal, ar-condicionado e Wi-Fi gratuito.",
    capacity: 2,
    price_per_night: 150.00,
    amenities: ["Wi-Fi", "Ar-condicionado", "TV", "Frigobar"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    hotel_id: 1,
    name: "Quarto Deluxe",
    description: "Quarto espaçoso com vista para a cidade, cama king size e banheira.",
    capacity: 3,
    price_per_night: 250.00,
    amenities: ["Wi-Fi", "Ar-condicionado", "TV", "Frigobar", "Banheira", "Vista da cidade"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 3,
    hotel_id: 1,
    name: "Suíte Premium",
    description: "Suíte luxuosa com sala de estar separada, varanda e serviço de quarto 24h.",
    capacity: 4,
    price_per_night: 400.00,
    amenities: ["Wi-Fi", "Ar-condicionado", "TV", "Frigobar", "Varanda", "Sala de estar", "Serviço de quarto 24h"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

export const mockReservations: Reservation[] = [
  {
    id: 1,
    hotel_id: 1,
    room_type_id: 1,
    guest_name: "João Silva",
    guest_email: "joao@email.com",
    guest_phone: "(11) 9876-5432",
    check_in_date: "2024-02-15",
    check_out_date: "2024-02-18",
    guests_count: 2,
    total_price: 450.00,
    status: "confirmed",
    special_requests: "Quarto no andar alto",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    hotel_id: 1,
    room_type_id: 2,
    guest_name: "Maria Santos",
    guest_email: "maria@email.com",
    guest_phone: "(11) 5555-1234",
    check_in_date: "2024-02-20",
    check_out_date: "2024-02-25",
    guests_count: 2,
    total_price: 1250.00,
    status: "pending",
    special_requests: "Check-in tardio",
    created_at: "2024-01-20T14:15:00Z",
    updated_at: "2024-01-20T14:15:00Z"
  }
];

// Simulação de delay de rede para tornar mais realista
export const simulateNetworkDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Gerador de IDs únicos para novos registros
let nextId = Math.max(
  Math.max(...mockHotels.map(h => h.id), 0),
  Math.max(...mockRoomTypes.map(r => r.id), 0),
  Math.max(...mockReservations.map(r => r.id), 0)
) + 1;

export const generateId = () => nextId++;