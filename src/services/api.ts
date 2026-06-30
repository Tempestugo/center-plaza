


const getApiBaseUrl = () => {
  
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`,
});


export interface Hotel {
  id: number;
  name: string;
  description?: string;
  address?: string;
  location?: string; 
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
  max_occupancy?: number;
  total_units?: number;
  bed_type?: string;
  bed_count?: number;
  size_sqm?: number;
  bathroom_type?: string;
  smoking_allowed?: boolean;
  hotel_name?: string;
  price_per_night: number;
  amenities?: string[] | string;
  images?: { id: number; url: string }[];
  is_active?: number | boolean;
  room_number?: string;
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
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  special_requests?: string;
  created_at?: string;
  updated_at?: string;
  hotel_name?: string;
  room_type_name?: string;
  unread_count?: number;
}

export interface Message {
  id: number;
  reservation_id: number;
  sender_role: 'admin' | 'guest';
  content: string;
  read: number;
  created_at: string;
}


export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}


import { mockHotels, mockRoomTypes, mockReservations, simulateNetworkDelay, generateId } from './mockData';


async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  
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


async function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  await simulateNetworkDelay(300); 
  
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;
  
  
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
    
    return mockReservations as T;
  }
  
  if (endpoint === '/health') {
    return { status: 'ok', timestamp: new Date().toISOString() } as T;
  }
  
  throw new ApiError(404, `Endpoint not found: ${endpoint}`);
}


export const hotelService = {
  
  async getAll(): Promise<Hotel[]> {
    return apiRequest<Hotel[]>('/hotels');
  },

  
  async getById(id: number): Promise<Hotel> {
    return apiRequest<Hotel>(`/hotels/${id}`);
  },

  
  async create(hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>): Promise<Hotel> {
    return apiRequest<Hotel>('/hotels', {
      method: 'POST',
      body: JSON.stringify(hotel),
    });
  },

  
  async update(id: number, hotel: Partial<Omit<Hotel, 'id' | 'created_at' | 'updated_at'>>): Promise<Hotel> {
    return apiRequest<Hotel>(`/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hotel),
    });
  },

  
  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/hotels/${id}`, {
      method: 'DELETE',
    });
  },
};


export const roomService = {
  
  async getAll(): Promise<RoomType[]> {
    return apiRequest<RoomType[]>('/rooms');
  },

  
  async getAllAdmin(): Promise<RoomType[]> {
    return apiRequest<RoomType[]>('/rooms/all', {
      headers: getAuthHeaders(),
    });
  },

  
  async updateAvailability(id: number, is_active: number): Promise<RoomType> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao atualizar disponibilidade');
    }
    return response.json();
  },

  async updateRoomNumber(id: number, room_number: string): Promise<RoomType> {
    return apiRequest<RoomType>(`/rooms/${id}/room-number`, {
      method: 'PATCH',
      body: JSON.stringify({ room_number }),
    });
  },

  
  async getById(id: number): Promise<RoomType> {
    return apiRequest<RoomType>(`/rooms/${id}`);
  },

  
  async getByHotel(hotelId: number): Promise<RoomType[]> {
    return apiRequest<RoomType[]>(`/hotels/${hotelId}/rooms`);
  },

  
  async create(room: Omit<RoomType, 'id' | 'created_at' | 'updated_at'>): Promise<RoomType> {
    return apiRequest<RoomType>('/rooms', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(room),
    });
  },

  
  async update(id: number, room: Partial<Omit<RoomType, 'id' | 'created_at' | 'updated_at'>>): Promise<RoomType> {
    return apiRequest<RoomType>(`/rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(room),
    });
  },

  
  async uploadImage(roomId: number, base64Data: string, imageType: string): Promise<{ id: number; url: string }> {
    return apiRequest<{ id: number; url: string }>(`/room-images/${roomId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image_data: base64Data, image_type: imageType }),
    });
  },

  
  async deleteImage(imageId: number): Promise<void> {
    return apiRequest<void>(`/room-images/${imageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  
  async createWithImages(data: any, imageFiles: File[]): Promise<RoomType> {
    
    const room = await this.create(data);
    
    for (const file of imageFiles) {
      const base64 = await fileToBase64(file);
      await this.uploadImage(room.id, base64, file.type);
    }
    return room;
  },

  
  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};


export const reservationService = {
  
  async getAll(): Promise<Reservation[]> {
    return apiRequest<Reservation[]>('/reservations', {
      headers: getAuthHeaders(),
    });
  },

  
  async getById(id: number): Promise<Reservation> {
    return apiRequest<Reservation>(`/reservations/${id}`);
  },

  
  async getByGuestEmail(email: string): Promise<Reservation[]> {
    return apiRequest<Reservation[]>(`/reservations?guest_email=${encodeURIComponent(email)}`);
  },

  
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

  
  async create(reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation> {
    return apiRequest<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });
  },

  
  async update(id: number, reservation: Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at'>>): Promise<Reservation> {
    return apiRequest<Reservation>(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservation),
    });
  },

  
  async updateStatus(id: number, status: 'confirmed' | 'cancelled' | 'pending' | Reservation['status']): Promise<Reservation> {
    return apiRequest<Reservation>(`/reservations/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  
  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/reservations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};

export const chatService = {
  getMessages: async (reservationId: number): Promise<Message[]> => {
    return apiRequest<Message[]>(`/chat/${reservationId}`, {
      headers: getAuthHeaders(),
    });
  },

  sendMessage: async (reservationId: number, content: string): Promise<Message> => {
    return apiRequest<Message>(`/chat/${reservationId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, sender_role: 'admin' }),
    });
  },
};


export const healthService = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return apiRequest<{ status: string; timestamp: string }>('/health');
  },
};


export default {
  hotel: hotelService,
  room: roomService,
  reservation: reservationService,
  chat: chatService,
  health: healthService,
  ApiError,
};


function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}