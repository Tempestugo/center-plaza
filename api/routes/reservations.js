import express from 'express';
const router = express.Router();

// GET /api/reservations - Buscar todas as reservas
router.get('/', async (req, res) => {
  try {
    const { hotel_id, status, guest_email, id, guest_name } = req.query;
    
    let query = `
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name, rt.price_per_night
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE 1=1
    `;
    const params = [];
    
    if (hotel_id) {
      query += ' AND r.hotel_id = ?';
      params.push(hotel_id);
    }
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    if (guest_email) {
      query += ' AND r.guest_email = ?';
      params.push(guest_email);
    }
    
    if (id) {
      query += ' AND r.id = ?';
      params.push(id);
    }

    if (guest_name) {
      query += ' AND r.guest_name LIKE ?';
      params.push(`%${guest_name}%`);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const [reservations] = await req.db.execute(query, params);
    res.json(reservations);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reservations/availability/:hotel_id/:room_type_id - Verificar disponibilidade
router.get('/availability/:hotel_id/:room_type_id', async (req, res) => {
  try {
    const { hotel_id, room_type_id } = req.params;
    const { check_in_date, check_out_date } = req.query;
    
    if (!check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Datas de check-in e check-out são obrigatórias' });
    }
    
    // Verificar conflitos de reserva
    const query = `
      SELECT COUNT(*) as conflicting_reservations
      FROM reservations
      WHERE hotel_id = ? AND room_type_id = ?
        AND status IN ('confirmed', 'pending')
        AND (
          (check_in_date <= ? AND check_out_date > ?)
          OR (check_in_date < ? AND check_out_date >= ?)
          OR (check_in_date >= ? AND check_out_date <= ?)
        )
    `;
    
    const [result] = await req.db.execute(query, [
      hotel_id, room_type_id,
      check_in_date, check_in_date,
      check_out_date, check_out_date,
      check_in_date, check_out_date
    ]);
    
    const isAvailable = result[0].conflicting_reservations === 0;
    
    res.json({
      available: isAvailable,
      conflicting_reservations: result[0].conflicting_reservations
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reservations/:id - Buscar reserva por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name, rt.price_per_night
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `;
    
    const [reservations] = await req.db.execute(query, [id]);
    
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    res.json(reservations[0]);
  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/reservations - Criar nova reserva
router.post('/', async (req, res) => {
  const connection = await req.db.getConnection();

  try {
    const {
      hotel_id,
      room_type_id,
      guest_name,
      guest_email,
      guest_phone,
      guest_document,
      check_in_date,
      check_out_date,
      number_of_guests,
      total_amount,
      special_requests
    } = req.body;
    
    // Validações básicas
    if (!hotel_id || !room_type_id || !guest_name || !guest_email || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    await connection.beginTransaction();

    // Verificar se o hotel existe
    const [hotels] = await connection.execute('SELECT id FROM hotels WHERE id = ?', [hotel_id]);
    if (hotels.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Hotel não encontrado' });
    }
    
    // Verificar se o tipo de quarto existe e sua capacidade
    const [roomTypes] = await connection.execute('SELECT id, max_occupancy FROM room_types WHERE id = ? AND hotel_id = ?', [room_type_id, hotel_id]);
    if (roomTypes.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Tipo de quarto não encontrado para este hotel' });
    }
    
    // Verificar se as datas são válidas
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      await connection.rollback();
      return res.status(400).json({ error: 'Datas inválidas fornecidas' });
    }

    // Validar capacidade
    if (number_of_guests && number_of_guests > roomTypes[0].max_occupancy) {
      await connection.rollback();
      return res.status(400).json({ error: `Número de hóspedes (${number_of_guests}) excede a capacidade do quarto (${roomTypes[0].max_occupancy})` });
    }
    
    if (checkIn < today) {
      await connection.rollback();
      return res.status(400).json({ error: 'Data de check-in não pode ser anterior a hoje' });
    }
    
    if (checkOut <= checkIn) {
      await connection.rollback();
      return res.status(400).json({ error: 'Data de check-out deve ser posterior à data de check-in' });
    }

    // Verificar disponibilidade (conflitos de data)
    const [conflicts] = await connection.execute(`
      SELECT COUNT(*) as count FROM reservations 
      WHERE room_type_id = ? 
      AND status IN ('confirmed', 'pending')
      AND check_in_date < ? AND check_out_date > ?
    `, [room_type_id, check_out_date, check_in_date]);

    if (conflicts[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Quarto indisponível para as datas selecionadas' });
    }
    
    const query = `
      INSERT INTO reservations (
        hotel_id, room_type_id, guest_name, guest_email, guest_phone,
        guest_document, check_in_date, check_out_date, number_of_guests,
        total_amount, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests || 1,
      total_amount, special_requests
    ]);
    
    await connection.commit();

    // Buscar a reserva criada com informações completas
    const [newReservation] = await connection.execute(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newReservation[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
});

// PUT /api/reservations/:id - Atualizar reserva
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      guest_name,
      guest_email,
      guest_phone,
      guest_document,
      check_in_date,
      check_out_date,
      number_of_guests,
      total_amount,
      status,
      special_requests
    } = req.body;
    
    // Verificar se a reserva existe
    const [existingReservation] = await req.db.execute('SELECT * FROM reservations WHERE id = ?', [id]);
    if (existingReservation.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    // Validar status se fornecido
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Verificar datas se fornecidas
    if (check_in_date && check_out_date) {
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);
      
      if (checkOut <= checkIn) {
        return res.status(400).json({ error: 'Data de check-out deve ser posterior à data de check-in' });
      }
    }
    
    const query = `
      UPDATE reservations SET
        guest_name = COALESCE(?, guest_name),
        guest_email = COALESCE(?, guest_email),
        guest_phone = COALESCE(?, guest_phone),
        guest_document = COALESCE(?, guest_document),
        check_in_date = COALESCE(?, check_in_date),
        check_out_date = COALESCE(?, check_out_date),
        number_of_guests = COALESCE(?, number_of_guests),
        total_amount = COALESCE(?, total_amount),
        status = COALESCE(?, status),
        special_requests = COALESCE(?, special_requests),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await req.db.execute(query, [
      guest_name, guest_email, guest_phone, guest_document,
      check_in_date, check_out_date, number_of_guests, total_amount,
      status, special_requests, id
    ]);
    
    // Buscar a reserva atualizada
    const [updatedReservation] = await req.db.execute(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
    
    res.json(updatedReservation[0]);
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/reservations/:id - Deletar reserva
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a reserva existe
    const [existingReservation] = await req.db.execute('SELECT * FROM reservations WHERE id = ?', [id]);
    if (existingReservation.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    await req.db.execute('DELETE FROM reservations WHERE id = ?', [id]);
    
    res.json({ message: 'Reserva deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;