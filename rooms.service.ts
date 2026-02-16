import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class RoomsService {
  constructor(private db: DatabaseService) {}

  async findAll(hotelId?: string) {
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

  async findOne(id: number) {
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

  async create(data: any, files: Array<Express.Multer.File>) {
    const result = await this.db.run(`
      INSERT INTO room_types (
        hotel_id, name, description, size_sqm, bed_type, bed_count,
        max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.hotel_id, data.name, data.description, data.size_sqm, data.bed_type, data.bed_count,
      data.max_occupancy, JSON.stringify(data.amenities || []), data.bathroom_type, data.smoking_allowed ? 1 : 0, data.price_per_night
    ]);

    const roomId = result.lastID;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageData = file.buffer.toString('base64');
        await this.db.run(
          'INSERT INTO room_images (room_type_id, image_data, image_type, display_order) VALUES (?, ?, ?, ?)',
          [roomId, imageData, file.mimetype, i]
        );
      }
    }

    return this.findOne(roomId);
  }

  async update(id: number, data: any, files: Array<Express.Multer.File>) {
    await this.db.run(`
      UPDATE room_types SET 
        name = COALESCE(?, name), description = COALESCE(?, description), 
        size_sqm = COALESCE(?, size_sqm), bed_type = COALESCE(?, bed_type), 
        bed_count = COALESCE(?, bed_count), max_occupancy = COALESCE(?, max_occupancy), 
        amenities = COALESCE(?, amenities), bathroom_type = COALESCE(?, bathroom_type), 
        smoking_allowed = COALESCE(?, smoking_allowed), price_per_night = COALESCE(?, price_per_night), 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.name, data.description, data.size_sqm, data.bed_type, data.bed_count,
      data.max_occupancy, data.amenities ? JSON.stringify(data.amenities) : undefined, 
      data.bathroom_type, data.smoking_allowed !== undefined ? (data.smoking_allowed ? 1 : 0) : undefined, 
      data.price_per_night, id
    ]);

    if (files && files.length > 0) {
      const maxOrder = await this.db.get('SELECT MAX(display_order) as max FROM room_images WHERE room_type_id = ?', [id]);
      let nextOrder = (maxOrder?.max || 0) + 1;
      
      for (const file of files) {
        const imageData = file.buffer.toString('base64');
        await this.db.run(
          'INSERT INTO room_images (room_type_id, image_data, image_type, display_order) VALUES (?, ?, ?, ?)',
          [id, imageData, file.mimetype, nextOrder++]
        );
      }
    }
    return this.findOne(id);
  }

  async remove(id: number) { return this.db.run('DELETE FROM room_types WHERE id = ?', [id]); }
  async removeImage(roomId: number, imageId: number) { return this.db.run('DELETE FROM room_images WHERE id = ? AND room_type_id = ?', [imageId, roomId]); }
}