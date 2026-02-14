// Serviço de API para comunicação com o backend SQLite

// Configuração dinâmica da URL da API baseada no ambiente
const getApiBaseUrl = () => {
  // Priorizar variável de ambiente se definida
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Em produção (Hostinger), usar caminho relativo para que o navegador use o domínio atual
  if (import.meta.env.PROD) {
    return '/api';
  }
  // Em desenvolvimento, usar API local
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Tipos para as entidades
export interface Hotel {
  id: number;
  name: string;
  description?: string;
  address?: string;
  location?: string; // Campo para compatibilidade com frontend
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoomType {
  id: number;
  hotel_id: number;
  name: string;
  description?: string;
  capacity: number;
  price_per_night: number;
  amenities?: string[];
  created_at?: string;
  updated_at?: string;
  images?: { id: number; url: string }[];
}

export interface Reservation {
  id: number;
  hotel_id: number;
  room_type_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_document?: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_requests?: string;
  created_at?: string;
  updated_at?: string;
}

// Classe de erro personalizada para API
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Importar dados mockados
import { mockHotels, mockRoomTypes, mockReservations, simulateNetworkDelay, generateId } from './mockData';

// Função auxiliar para fazer requisições
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Se API_BASE_URL for null, usar dados mockados
  if (API_BASE_URL === null) {
    return handleMockRequest<T>(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Função para lidar com requisições mockadas
async function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  await simulateNetworkDelay(300); // Simular delay de rede
  
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;
  
  // Roteamento para diferentes endpoints
  if (endpoint === '/hotels') {
    if (method === 'GET') {
      return mockHotels as T;
    }
    if (method === 'POST') {
      const newHotel = { ...body, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockHotels.push(newHotel);
      return newHotel as T;
    }
  }
  
  if (endpoint.startsWith('/hotels/') && endpoint !== '/hotels') {
    const id = parseInt(endpoint.split('/')[2]);
    const hotel = mockHotels.find(h => h.id === id);
    if (method === 'GET') {
      if (!hotel) throw new ApiError(404, 'Hotel not found');
      return hotel as T;
    }
    if (method === 'PUT') {
      const index = mockHotels.findIndex(h => h.id === id);
      if (index === -1) throw new ApiError(404, 'Hotel not found');
      mockHotels[index] = { ...mockHotels[index], ...body, updated_at: new Date().toISOString() };
      return mockHotels[index] as T;
    }
    if (method === 'DELETE') {
      const index = mockHotels.findIndex(h => h.id === id);
      if (index === -1) throw new ApiError(404, 'Hotel not found');
      mockHotels.splice(index, 1);
      return {} as T;
    }
  }
  
  if (endpoint === '/rooms') {
    if (method === 'GET') {
      return mockRoomTypes as T;
    }
    if (method === 'POST') {
      const newRoom = { ...body, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockRoomTypes.push(newRoom);
      return newRoom as T;
    }
  }
  
  if (endpoint.startsWith('/rooms/') && endpoint !== '/rooms') {
    const id = parseInt(endpoint.split('/')[2]);
    const room = mockRoomTypes.find(r => r.id === id);
    if (method === 'GET') {
      if (!room) throw new ApiError(404, 'Room not found');
      return room as T;
    }
    if (method === 'PUT') {
      const index = mockRoomTypes.findIndex(r => r.id === id);
      if (index === -1) throw new ApiError(404, 'Room not found');
      mockRoomTypes[index] = { ...mockRoomTypes[index], ...body, updated_at: new Date().toISOString() };
      return mockRoomTypes[index] as T;
    }
    if (method === 'DELETE') {
      const index = mockRoomTypes.findIndex(r => r.id === id);
      if (index === -1) throw new ApiError(404, 'Room not found');
      mockRoomTypes.splice(index, 1);
      return {} as T;
    }
  }
  
  if (endpoint.startsWith('/hotels/') && endpoint.includes('/rooms')) {
    const hotelId = parseInt(endpoint.split('/')[2]);
    const hotelRooms = mockRoomTypes.filter(r => r.hotel_id === hotelId);
    return hotelRooms as T;
  }
  
  if (endpoint === '/reservations') {
    if (method === 'GET') {
      return mockReservations as T;
    }
    if (method === 'POST') {
      const newReservation = { ...body, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockReservations.push(newReservation);
      return newReservation as T;
    }
  }
  
  if (endpoint.startsWith('/reservations/') && endpoint !== '/reservations') {
    const id = parseInt(endpoint.split('/')[2]);
    const reservation = mockReservations.find(r => r.id === id);
    if (method === 'GET') {
      if (!reservation) throw new ApiError(404, 'Reservation not found');
      return reservation as T;
    }
    if (method === 'PUT') {
      const index = mockReservations.findIndex(r => r.id === id);
      if (index === -1) throw new ApiError(404, 'Reservation not found');
      mockReservations[index] = { ...mockReservations[index], ...body, updated_at: new Date().toISOString() };
      return mockReservations[index] as T;
    }
    if (method === 'DELETE') {
      const index = mockReservations.findIndex(r => r.id === id);
      if (index === -1) throw new ApiError(404, 'Reservation not found');
      mockReservations.splice(index, 1);
      return {} as T;
    }
  }
  
  if (endpoint.startsWith('/reservations/guest/')) {
    const email = endpoint.split('/')[3];
    const guestReservations = mockReservations.filter(r => r.guest_email === email);
    return guestReservations as T;
  }
  
  if (endpoint.startsWith('/reservations/search')) {
    // Implementar busca por código e nome se necessário
    return mockReservations as T;
  }
  
  if (endpoint === '/health') {
    return { status: 'ok', timestamp: new Date().toISOString() } as T;
  }
  
  throw new ApiError(404, `Endpoint not found: ${endpoint}`);
}

// Serviços para Hotels
export const hotelService = {
  // Listar todos os hotéis
  async getAll(): Promise<Hotel[]> {
    return apiRequest<Hotel[]>('/hotels');
  },

  // Buscar hotel por ID
  async getById(id: number): Promise<Hotel> {
    return apiRequest<Hotel>(`/hotels/${id}`);
  },

  // Criar novo hotel
  async create(hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>): Promise<Hotel> {
    return apiRequest<Hotel>('/hotels', {
      method: 'POST',
      body: JSON.stringify(hotel),
    });
  },

  // Atualizar hotel
  async update(id: number, hotel: Partial<Omit<Hotel, 'id' | 'created_at' | 'updated_at'>>): Promise<Hotel> {
    return apiRequest<Hotel>(`/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hotel),
    });
  },

  // Deletar hotel
  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/hotels/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviços para Room Types
export const roomService = {
  // Listar todos os tipos de quarto
  async getAll(): Promise<RoomType[]> {
    return apiRequest<RoomType[]>('/rooms');
  },

  // Buscar tipo de quarto por ID
  async getById(id: number): Promise<RoomType> {
    return apiRequest<RoomType>(`/rooms/${id}`);
  },

  // Buscar tipos de quarto por hotel
  async getByHotel(hotelId: number): Promise<RoomType[]> {
    return apiRequest<RoomType[]>(`/hotels/${hotelId}/rooms`);
  },

  // Criar novo tipo de quarto
  async create(room: Omit<RoomType, 'id' | 'created_at' | 'updated_at'>): Promise<RoomType> {
    return apiRequest<RoomType>('/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    });
  },

  // Atualizar tipo de quarto
  async update(id: number, room: Partial<Omit<RoomType, 'id' | 'created_at' | 'updated_at'>>): Promise<RoomType> {
    return apiRequest<RoomType>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(room),
    });
  },

  // Atualizar tipo de quarto com imagens
  async updateWithImages(id: number, room: Partial<Omit<RoomType, 'id' | 'created_at' | 'updated_at'>>, images: File[]): Promise<RoomType> {
    // Se API_BASE_URL for null (produção), usar dados mockados
    if (API_BASE_URL === null) {
      // Em produção, simular atualização com imagens usando dados mockados
      return handleMockRequest<RoomType>(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(room),
      });
    }

    const formData = new FormData();
    
    // Adicionar dados do quarto diretamente no FormData
    Object.entries(room).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    // Adicionar imagens
    images.forEach((image) => {
      formData.append('images', image);
    });
    
    const url = `${API_BASE_URL}/rooms/${id}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.room || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Deletar tipo de quarto
  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviços para Reservations
export const reservationService = {
  // Listar todas as reservas
  async getAll(): Promise<Reservation[]> {
    return apiRequest<Reservation[]>('/reservations');
  },

  // Buscar reserva por ID
  async getById(id: number): Promise<Reservation> {
    return apiRequest<Reservation>(`/reservations/${id}`);
  },

  // Buscar reservas por email do hóspede
  async getByGuestEmail(email: string): Promise<Reservation[]> {
    return apiRequest<Reservation[]>(`/reservations?guest_email=${encodeURIComponent(email)}`);
  },

  // Buscar reserva por código e nome
  async getByCodeAndName(code: string, guestName: string): Promise<Reservation | null> {
    try {
      const reservations = await apiRequest<Reservation[]>(
        `/reservations?id=${encodeURIComponent(code)}&guest_name=${encodeURIComponent(guestName)}`
      );
      return reservations.length > 0 ? reservations[0] : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Criar nova reserva
  async create(reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation> {
    return apiRequest<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });
  },

  // Atualizar reserva
  async update(id: number, reservation: Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at'>>): Promise<Reservation> {
    return apiRequest<Reservation>(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservation),
    });
  },

  // Atualizar status da reserva
  async updateStatus(id: number, status: Reservation['status']): Promise<Reservation> {
    return apiRequest<Reservation>(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Deletar reserva
  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/reservations/${id}`, {
      method: 'DELETE',
    });
  },
};

// Serviço de health check
export const healthService = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return apiRequest<{ status: string; timestamp: string }>('/health');
  },
};

// Exportar tudo como default também
export default {
  hotel: hotelService,
  room: roomService,
  reservation: reservationService,
  health: healthService,
  ApiError,
};