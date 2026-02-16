import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly db: DatabaseService) {}

  getHello(): string {
    return 'Backend Center Plaza Online 🚀 (NestJS)';
  }

  // --- HOTELS ---
  async getHotels() {
    const hotels = await this.db.all('SELECT * FROM hotels ORDER BY created_at DESC');
    return hotels.map(hotel => ({
      ...hotel,
      location: hotel.address,
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
    }));
  }

  async getHotelById(id: number) {
    const hotel = await this.db.get('SELECT * FROM hotels WHERE id = ?', [id]);
    if (!hotel) throw new NotFoundException('Hotel não encontrado');
    return {
      ...hotel,
      location: hotel.address,
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
    };
  }

  // --- ROOMS ---
  async getRooms(hotelId?: number) {
    let query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
    `;
    const params = [];
    
    if (hotelId) {
      query += ' WHERE rt.hotel_id = ?';
      params.push(hotelId);
    }
    
    query += ' ORDER BY rt.created_at DESC';
    
    const rooms = await this.db.all(query, params);
    
    return Promise.all(rooms.map(async (room) => {
      const images = await this.db.all('SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [room.id]);
      return {
        ...room,
        amenities: room.amenities ? JSON.parse(room.amenities) : [],
        images: images.map(img => ({ id: img.id, url: `/api/room-images/${img.id}` }))
      };
    }));
  }

  async getRoomById(id: number) {
    const room = await this.db.get(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.id = ?
    `, [id]);

    if (!room) throw new NotFoundException('Quarto não encontrado');

    const images = await this.db.all('SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [id]);
    
    return {
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      images: images.map(img => ({ id: img.id, url: `/api/room-images/${img.id}` }))
    };
  }

  async createRoom(data: any, files: Array<Express.Multer.File>) {
    const { hotel_id, name, description, size_sqm, bed_type, bed_count, max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night } = data;
    
    const result = await this.db.run(`
      INSERT INTO room_types (
        hotel_id, name, description, size_sqm, bed_type, bed_count,
        max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      hotel_id, name, description, size_sqm, bed_type, bed_count,
      max_occupancy, JSON.stringify(amenities || []), bathroom_type, 
      (smoking_allowed === 'true' || smoking_allowed === true) ? 1 : 0, price_per_night
    ]);

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageData = file.buffer.toString('base64');
        await this.db.run(
          'INSERT INTO room_images (room_type_id, image_data, image_type, display_order) VALUES (?, ?, ?, ?)',
          [result.lastID, imageData, file.mimetype, i]
        );
      }
    }
    return { id: result.lastID, message: 'Quarto criado com sucesso' };
  }

  async getRoomImage(id: number) {
    const image = await this.db.get('SELECT image_data, image_type FROM room_images WHERE id = ?', [id]);
    if (!image) throw new NotFoundException('Imagem não encontrada');
    return image;
  }

  // --- RESERVATIONS ---
  async createReservation(data: any) {
    const {
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests,
      special_requests
    } = data;

    const room = await this.db.get('SELECT price_per_night FROM room_types WHERE id = ?', [room_type_id]);
    if (!room) throw new NotFoundException('Quarto não encontrado');

    const start = new Date(check_in_date);
    const end = new Date(check_out_date);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const total_amount = room.price_per_night * (nights > 0 ? nights : 1);

    const result = await this.db.run(`
      INSERT INTO reservations (
        hotel_id, room_type_id, guest_name, guest_email, guest_phone,
        guest_document, check_in_date, check_out_date, number_of_guests,
        total_amount, special_requests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests,
      total_amount, special_requests
    ]);

    return this.db.get('SELECT * FROM reservations WHERE id = ?', [result.lastID]);
  }

  async getReservations(email?: string) {
    let query = `
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
    `;
    const params = [];
    if (email) {
      query += ' WHERE r.guest_email = ?';
      params.push(email);
    }
    query += ' ORDER BY r.created_at DESC';
    return this.db.all(query, params);
  }

  // --- AUTH ---
  async login(username: string, pass: string) {
    const user = await this.db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, pass]);
    if (user) {
      const token = user.role === 'admin' ? 'Bearer admin-token' : 'Bearer user-token';
      return { token, role: user.role, username: user.username };
    }
    throw new BadRequestException('Credenciais inválidas');
  }
}