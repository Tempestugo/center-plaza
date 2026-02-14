import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { reservationService, type Reservation as ApiReservation } from '../services/api';

export interface Reservation {
  id: string;
  accommodationId: number;
  accommodationName: string;
  accommodationImage: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  guestName: string;
  email: string;
  phone: string;
  document: string;
  specialRequests?: string;
  paymentMethod: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  paymentStatus: 'pago' | 'pendente' | 'estornado';
  createdAt: string;
  amenities: string[];
}

interface ReservationContextType {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => Promise<string>;
  getReservation: (id: string) => Reservation | undefined;
  getReservationById: (id: string) => Promise<Reservation | undefined>;
  getReservationByCodeAndName: (code: string, lastName: string) => Promise<Reservation | undefined>;
  getUserReservations: (userEmail: string) => Promise<Reservation[]>;
  updateReservationStatus: (id: string, status: Reservation['status']) => Promise<void>;
  updatePaymentStatus: (id: string, paymentStatus: Reservation['paymentStatus']) => Promise<void>;
  refreshReservations: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

// Função para converter reserva da API para o formato do frontend
const convertApiReservationToFrontend = (apiReservation: ApiReservation): Reservation => {
  return {
    id: apiReservation.id.toString(),
    accommodationId: apiReservation.hotel_id,
    accommodationName: (apiReservation as ApiReservation & {hotel_name?: string}).hotel_name || 'Hotel',
    accommodationImage: '/placeholder-hotel.jpg',
    location: 'Centro da Cidade',
    checkIn: apiReservation.check_in_date,
    checkOut: apiReservation.check_out_date,
    guests: apiReservation.guests_count,
    nights: Math.ceil((new Date(apiReservation.check_out_date).getTime() - new Date(apiReservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24)),
    pricePerNight: apiReservation.total_price / Math.ceil((new Date(apiReservation.check_out_date).getTime() - new Date(apiReservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24)),
    subtotal: apiReservation.total_price * 0.9,
    serviceFee: apiReservation.total_price * 0.1,
    total: apiReservation.total_price,
    guestName: apiReservation.guest_name,
    email: apiReservation.guest_email,
    phone: apiReservation.guest_phone || '',
    document: (apiReservation as ApiReservation & {guest_document?: string}).guest_document || '',
    specialRequests: apiReservation.special_requests || '',
    paymentMethod: 'PIX',
    status: apiReservation.status === 'confirmed' ? 'confirmada' : apiReservation.status === 'cancelled' ? 'cancelada' : 'pendente',
    paymentStatus: 'pago',
    createdAt: apiReservation.created_at || new Date().toISOString(),
    amenities: []
  };
};

// Função para converter reserva do frontend para o formato da API
const convertFrontendReservationToApi = (frontendReservation: Omit<Reservation, 'id' | 'createdAt'>): Omit<ApiReservation, 'id' | 'created_at' | 'updated_at'> => {
  return {
    hotel_id: frontendReservation.accommodationId,
    room_type_id: 1, // Assumindo room_type_id padrão por enquanto
    guest_name: frontendReservation.guestName,
    guest_email: frontendReservation.email,
    guest_phone: frontendReservation.phone,
    check_in_date: frontendReservation.checkIn,
    check_out_date: frontendReservation.checkOut,
    guests_count: frontendReservation.guests,
    total_price: frontendReservation.total,
    status: frontendReservation.status === 'confirmada' ? 'confirmed' : frontendReservation.status === 'cancelada' ? 'cancelled' : 'pending',
    special_requests: frontendReservation.specialRequests
  };
};

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar reservas da API na inicialização
  useEffect(() => {
    refreshReservations();
  }, []);

  const refreshReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiReservations = await reservationService.getAll();
      const frontendReservations = apiReservations.map(convertApiReservationToFrontend);
      setReservations(frontendReservations);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
      setError('Erro ao carregar reservas');
      // Fallback para localStorage em caso de erro
      const savedReservations = localStorage.getItem('center_plaza_reservations');
      if (savedReservations) {
        try {
          const parsed = JSON.parse(savedReservations);
          setReservations(parsed);
        } catch (parseError) {
          console.error('Erro ao carregar reservas do localStorage:', parseError);
          setReservations([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const apiReservationData = convertFrontendReservationToApi(reservationData);
      const newApiReservation = await reservationService.create(apiReservationData);
      const newReservation = convertApiReservationToFrontend(newApiReservation);
      
      setReservations(prev => [...prev, newReservation]);
      
      // Backup no localStorage
      const updatedReservations = [...reservations, newReservation];
      localStorage.setItem('center_plaza_reservations', JSON.stringify(updatedReservations));
      
      return newReservation.id;
    } catch (err) {
      console.error('Erro ao criar reserva:', err);
      setError('Erro ao criar reserva');
      
      // Fallback para localStorage
      const newId = `RS${Date.now().toString().slice(-6)}`;
      const newReservation: Reservation = {
        ...reservationData,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      
      setReservations(prev => [...prev, newReservation]);
      localStorage.setItem('center_plaza_reservations', JSON.stringify([...reservations, newReservation]));
      
      return newId;
    } finally {
      setLoading(false);
    }
  };

  const getReservation = (id: string): Reservation | undefined => {
    return reservations.find(reservation => reservation.id === id);
  };

  const getReservationById = async (id: string): Promise<Reservation | undefined> => {
    try {
      const apiReservation = await reservationService.getById(parseInt(id));
      return convertApiReservationToFrontend(apiReservation);
    } catch (err) {
      console.error('Erro ao buscar reserva por ID:', err);
      // Fallback para busca local
      return reservations.find(reservation => reservation.id === id);
    }
  };

  const getReservationByCodeAndName = async (code: string, lastName: string): Promise<Reservation | undefined> => {
    try {
      // Buscar todas as reservas e filtrar localmente
      await refreshReservations();
      return reservations.find(reservation => {
        const reservationLastName = reservation.guestName.split(' ').pop()?.toLowerCase();
        return reservation.id.toLowerCase() === code.toLowerCase() && 
               reservationLastName === lastName.toLowerCase();
      });
    } catch (err) {
      console.error('Erro ao buscar reserva por código e nome:', err);
      return reservations.find(reservation => {
        const reservationLastName = reservation.guestName.split(' ').pop()?.toLowerCase();
        return reservation.id.toLowerCase() === code.toLowerCase() && 
               reservationLastName === lastName.toLowerCase();
      });
    }
  };

  const getUserReservations = async (userEmail: string): Promise<Reservation[]> => {
    try {
      await refreshReservations();
      return reservations.filter(reservation => 
        reservation.email.toLowerCase() === userEmail.toLowerCase()
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('Erro ao buscar reservas do usuário:', err);
      return reservations.filter(reservation => 
        reservation.email.toLowerCase() === userEmail.toLowerCase()
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const updateReservationStatus = async (id: string, status: Reservation['status']): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const apiStatus = status === 'confirmada' ? 'confirmed' : status === 'cancelada' ? 'cancelled' : 'pending';
      await reservationService.updateStatus(parseInt(id), apiStatus);
      
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === id ? { ...reservation, status } : reservation
        )
      );
      
      // Backup no localStorage
      const updatedReservations = reservations.map(reservation => 
        reservation.id === id ? { ...reservation, status } : reservation
      );
      localStorage.setItem('center_plaza_reservations', JSON.stringify(updatedReservations));
      
    } catch (err) {
      console.error('Erro ao atualizar status da reserva:', err);
      setError('Erro ao atualizar status da reserva');
      
      // Fallback para atualização local
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === id ? { ...reservation, status } : reservation
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: Reservation['paymentStatus']): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Como não temos endpoint específico para payment status, atualizamos localmente
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === id ? { ...reservation, paymentStatus } : reservation
        )
      );
      
      // Backup no localStorage
      const updatedReservations = reservations.map(reservation => 
        reservation.id === id ? { ...reservation, paymentStatus } : reservation
      );
      localStorage.setItem('center_plaza_reservations', JSON.stringify(updatedReservations));
      
    } catch (err) {
      console.error('Erro ao atualizar status de pagamento:', err);
      setError('Erro ao atualizar status de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const value: ReservationContextType = {
    reservations,
    loading,
    error,
    addReservation,
    getReservation,
    getReservationById,
    getReservationByCodeAndName,
    getUserReservations,
    updateReservationStatus,
    updatePaymentStatus,
    refreshReservations,
  };

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
};