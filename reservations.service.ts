import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import Stripe from 'stripe';

@Injectable()
export class ReservationsService {
  private stripe: Stripe;

  constructor(private db: DatabaseService) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    }
  }

  async findAll(email?: string, code?: string, name?: string) {
    let query = `
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
    `;
    const params = [];
    const conditions = [];

    if (email) { conditions.push('r.guest_email = ?'); params.push(email); }
    if (code && name) { conditions.push('r.id = ? AND r.guest_name = ?'); params.push(code, name); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY r.created_at DESC';

    return this.db.all(query, params);
  }

  async findOne(id: number) {
    return this.db.get(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
  }

  async create(data: any, idempotencyKey?: string) {
    if (idempotencyKey) {
      const cached = await this.db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
      if (cached) return JSON.parse(cached.response);
    }

    const today = new Date().toISOString().split('T')[0];
    if (data.check_in_date < today) throw new Error('A data de check-in não pode ser no passado.');

    // Verificação de conflito
    const conflict = await this.db.get(`
      SELECT COUNT(*) as count FROM reservations 
      WHERE room_type_id = ? AND status != 'cancelled'
      AND ((check_in_date < ? AND check_out_date > ?))
    `, [data.room_type_id, data.check_out_date, data.check_in_date]);

    if (conflict && conflict.count > 0) throw new Error('Quarto indisponível para as datas selecionadas');

    const room = await this.db.get('SELECT price_per_night FROM room_types WHERE id = ?', [data.room_type_id]);
    if (!room) throw new Error('Quarto não encontrado');

    const start = new Date(data.check_in_date);
    const end = new Date(data.check_out_date);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedTotal = room.price_per_night * (nights > 0 ? nights : 1);

    const result = await this.db.run(`
      INSERT INTO reservations (
        hotel_id, room_type_id, guest_name, guest_email, guest_phone,
        guest_document, check_in_date, check_out_date, number_of_guests,
        total_amount, special_requests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.hotel_id, data.room_type_id, data.guest_name, data.guest_email, data.guest_phone,
      data.guest_document, data.check_in_date, data.check_out_date, data.number_of_guests,
      calculatedTotal, data.special_requests, data.status || 'pending'
    ]);

    const newReservation = await this.findOne(result.lastID);

    if (idempotencyKey) {
      await this.db.run('INSERT INTO idempotency_keys (key, response, status_code) VALUES (?, ?, ?)', 
        [idempotencyKey, JSON.stringify(newReservation), 201]);
    }

    return newReservation;
  }

  async createPaymentIntent(amount: number, reservationId: number) {
    if (!this.stripe) return { clientSecret: 'mock_secret_dev' };
    
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      metadata: { reservation_id: reservationId.toString() }
    });

    return { clientSecret: paymentIntent.client_secret };
  }
}