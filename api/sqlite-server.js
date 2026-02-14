import express from 'express';
import cors from 'cors';
import { getConnection, testConnection } from './database/sqlite-connection.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Tenta carregar variáveis de ambiente se dotenv estiver instalado (opcional em dev)
try { import('dotenv/config'); } catch (e) {}

// Configuração do Stripe (Híbrido: Real se tiver chave, Mock se não tiver)
// Para produção: npm install stripe
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  // import Stripe from 'stripe'; // Descomente esta linha em produção real
  // stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Descomente esta linha
} else {
  stripe = { paymentIntents: { create: async () => ({ client_secret: 'mock_secret_dev' }) } };
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar charset UTF-8 para todas as respostas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inicializar tabelas auxiliares de infraestrutura
const initInfraTables = async () => {
  const db = await getConnection();
  await db.run(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      response TEXT,
      status_code INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Mensagens (Chat Admin <-> Usuário)
  await db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER,
      sender_role TEXT CHECK(sender_role IN ('admin', 'guest')),
      content TEXT,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    )
  `);

  // Adicionar colunas de pagamento à tabela de reservas se não existirem (migração simplificada)
  // Em produção, use uma ferramenta de migração real.
  try {
    await db.run("ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT");
    await db.run("ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'pending'");
  } catch (e) {
    // Colunas já existem ou erro ignorável em dev
  }
};
initInfraTables();

// Middleware de Autenticação Simulado (Zero Trust)
// Em produção, isso validaria um JWT ou Sessão real.
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const adminSecret = process.env.ADMIN_SECRET || 'Admin-Secret-123';
  
  // Verifica se o header bate com o segredo (do .env ou padrão)
  if (authHeader === adminSecret) {
    req.user = { role: 'admin', id: 1 };
  } else {
    req.user = { role: 'guest', id: 0 }; // ID 0 ou IP para guests anônimos
  }
  next();
};

app.use(authMiddleware);

// Rota para o Frontend decidir se mostra o botão de Admin
app.get('/api/auth/me', (req, res) => {
  // O frontend chama isso ao carregar. Se role for 'guest', esconde o botão.
  res.json({ 
    role: req.user.role,
    permissions: req.user.role === 'admin' ? ['view_admin', 'manage_reservations'] : ['view_public']
  `);
};
initInfraTables();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'API do Center Plaza funcionando com SQLite' });
});

// Rota para listar hotéis
app.get('/api/hotels', async (req, res) => {
  try {
    const db = await getConnection();
    const hotels = await db.all('SELECT * FROM hotels ORDER BY created_at DESC');
    
    // Parse amenities JSON and add location field
    const hotelsWithParsedAmenities = hotels.map(hotel => ({
      ...hotel,
      location: hotel.address, // Adicionar campo location para compatibilidade
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
    }));
    
    res.json(hotelsWithParsedAmenities);
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar hotel
app.post('/api/hotels', async (req, res) => {
  try {
    const { name, address, city, state, zip_code, phone, email, website, description, amenities } = req.body;
    
    const db = await getConnection();
    const result = await db.run(`
      INSERT INTO hotels (name, address, city, state, zip_code, phone, email, website, description, amenities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, address, city, state, zip_code, phone, email, website, description, JSON.stringify(amenities || [])]);
    
    const newHotel = await db.get('SELECT * FROM hotels WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      ...newHotel,
      amenities: newHotel.amenities ? JSON.parse(newHotel.amenities) : []
    });
  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar tipos de quartos
app.get('/api/rooms', async (req, res) => {
  try {
    const db = await getConnection();
    const rooms = await db.all(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      ORDER BY rt.created_at DESC
    `);
    
    // Parse amenities JSON
    const roomsWithParsedAmenities = rooms.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : []
    }));
    
    res.json(roomsWithParsedAmenities);
  } catch (error) {
    console.error('Erro ao buscar quartos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar tipo de quarto
app.post('/api/rooms', async (req, res) => {
  try {
    const {
      hotel_id, name, description, size_sqm, bed_type, bed_count,
      max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night
    } = req.body;
    
    const db = await getConnection();
    const result = await db.run(`
      INSERT INTO room_types (
        hotel_id, name, description, size_sqm, bed_type, bed_count,
        max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      hotel_id, name, description, size_sqm, bed_type, bed_count,
      max_occupancy, JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night
    ]);
    
    const newRoom = await db.get(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.id = ?
    `, [result.lastID]);
    
    res.status(201).json({
      ...newRoom,
      amenities: newRoom.amenities ? JSON.parse(newRoom.amenities) : []
    });
  } catch (error) {
    console.error('Erro ao criar quarto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar reservas
app.get('/api/reservations', async (req, res) => {
  try {
    const db = await getConnection();
    const reservations = await db.all(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.created_at DESC
    `);
    
    res.json(reservations);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar hotel por ID
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getConnection();
    const hotel = await db.get('SELECT * FROM hotels WHERE id = ?', [id]);
    
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }
    
    res.json({
      ...hotel,
      location: hotel.address, // Adicionar campo location para compatibilidade
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
    });
  } catch (error) {
    console.error('Erro ao buscar hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar quartos por hotel
app.get('/api/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const db = await getConnection();
    const rooms = await db.all(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.hotel_id = ?
      ORDER BY rt.created_at DESC
    `, [hotelId]);
    
    const roomsWithParsedAmenities = rooms.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : []
    }));
    
    res.json(roomsWithParsedAmenities);
  } catch (error) {
    console.error('Erro ao buscar quartos do hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar quarto por ID
app.get('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getConnection();
    const room = await db.get(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.id = ?
    `, [id]);
    
    if (!room) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }
    
    res.json({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : []
    });
  } catch (error) {
    console.error('Erro ao buscar quarto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar hotel
app.put('/api/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, zip_code, phone, email, website, description, amenities } = req.body;
    
    const db = await getConnection();
    
    // Verificar se hotel existe e buscar dados atuais
    const existingHotel = await db.get('SELECT * FROM hotels WHERE id = ?', [id]);
    if (!existingHotel) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }
    
    // Usar valores existentes se não fornecidos
    const updatedData = {
      name: name !== undefined ? name : existingHotel.name,
      address: address !== undefined ? address : existingHotel.address,
      city: city !== undefined ? city : existingHotel.city,
      state: state !== undefined ? state : existingHotel.state,
      zip_code: zip_code !== undefined ? zip_code : existingHotel.zip_code,
      phone: phone !== undefined ? phone : existingHotel.phone,
      email: email !== undefined ? email : existingHotel.email,
      website: website !== undefined ? website : existingHotel.website,
      description: description !== undefined ? description : existingHotel.description,
      amenities: amenities !== undefined ? amenities : (existingHotel.amenities ? JSON.parse(existingHotel.amenities) : [])
    };
    
    await db.run(`
      UPDATE hotels SET 
        name = ?, address = ?, city = ?, state = ?, zip_code = ?, 
        phone = ?, email = ?, website = ?, description = ?, amenities = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      updatedData.name, updatedData.address, updatedData.city, updatedData.state, 
      updatedData.zip_code, updatedData.phone, updatedData.email, updatedData.website, 
      updatedData.description, JSON.stringify(updatedData.amenities), id
    ]);
    
    const updatedHotel = await db.get('SELECT * FROM hotels WHERE id = ?', [id]);
    
    res.json({
      ...updatedHotel,
      location: updatedHotel.address, // Adicionar campo location para compatibilidade
      amenities: updatedHotel.amenities ? JSON.parse(updatedHotel.amenities) : []
    });
  } catch (error) {
    console.error('Erro ao atualizar hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar quarto
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotel_id, name, description, size_sqm, bed_type, bed_count,
      max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night
    } = req.body;
    
    console.log('🔄 Atualizando quarto ID:', id);
    console.log('📝 Dados recebidos:', req.body);
    
    const db = await getConnection();
    
    // Verificar se quarto existe
    const existingRoom = await db.get('SELECT id FROM room_types WHERE id = ?', [id]);
    if (!existingRoom) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }
    
    await db.run(`
      UPDATE room_types SET 
        hotel_id = ?, name = ?, description = ?, size_sqm = ?, bed_type = ?, 
        bed_count = ?, max_occupancy = ?, amenities = ?, bathroom_type = ?, 
        smoking_allowed = ?, price_per_night = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      hotel_id, name, description, size_sqm, bed_type, bed_count,
      max_occupancy, JSON.stringify(amenities || []), bathroom_type, 
      smoking_allowed ? 1 : 0, price_per_night, id
    ]);
    
    const updatedRoom = await db.get(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.id = ?
    `, [id]);
    
    console.log('✅ Quarto atualizado:', updatedRoom);
    
    res.json({
      ...updatedRoom,
      amenities: updatedRoom.amenities ? JSON.parse(updatedRoom.amenities) : []
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar quarto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar reservas com filtros
app.get('/api/reservations', async (req, res) => {
  try {
    const { guest_email, code, guest_name } = req.query;
    const db = await getConnection();
    
    let query = `
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (guest_email) {
      conditions.push('r.guest_email = ?');
      params.push(guest_email);
    }
    
    if (code && guest_name) {
      conditions.push('r.id = ? AND r.guest_name = ?');
      params.push(code, guest_name);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const reservations = await db.all(query, params);
    res.json(reservations);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar reserva por ID
app.get('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getConnection();
    const reservation = await db.get(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    res.json(reservation);
  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar reserva
app.post('/api/reservations', async (req, res) => {
  try {
    const {
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests,
      special_requests, status = 'pending'
    } = req.body;

    const idempotencyKey = req.headers['idempotency-key'];
    
    const db = await getConnection();

    // RESILIÊNCIA: Verificação de Idempotência (Antes de qualquer processamento)
    if (idempotencyKey) {
      const cached = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
      if (cached) {
        console.log(`🔁 Idempotency hit for key: ${idempotencyKey}`);
        return res.status(cached.status_code).json(JSON.parse(cached.response));
      }
    }

    // 0. SEGURANÇA: Validação de entrada (OWASP - Business Logic)
    const today = new Date().toISOString().split('T')[0];
    if (check_in_date < today) {
      return res.status(400).json({ error: 'A data de check-in não pode ser no passado.' });
    }

    // INTEGRIDADE DE DADOS: Iniciar Transação ACID (Prevent Race Conditions)
    await db.run('BEGIN EXCLUSIVE TRANSACTION');

    try {
      // 1. REGRA DE NEGÓCIO: Verificar conflito de datas (Overbooking) dentro da transação
      const conflict = await db.get(`
        SELECT COUNT(*) as count FROM reservations 
        WHERE room_type_id = ? 
        AND status != 'cancelled'
        AND (
          (check_in_date < ? AND check_out_date > ?)
        )
      `, [room_type_id, check_out_date, check_in_date]);

      if (conflict && conflict.count > 0) {
         await db.run('ROLLBACK');
         console.warn(`⚠️ Alerta de disponibilidade: Já existem ${conflict.count} reservas para este período.`);
         return res.status(409).json({ error: 'Quarto indisponível para as datas selecionadas' });
      }

      // 2. SEGURANÇA: Recalcular o valor total no backend
      const room = await db.get('SELECT price_per_night FROM room_types WHERE id = ?', [room_type_id]);
      if (!room) {
        await db.run('ROLLBACK');
        return res.status(404).json({ error: 'Quarto não encontrado' });
      }

      const start = new Date(check_in_date);
      const end = new Date(check_out_date);
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const calculatedTotal = room.price_per_night * (nights > 0 ? nights : 1);

      const result = await db.run(`
        INSERT INTO reservations (
          hotel_id, room_type_id, guest_name, guest_email, guest_phone,
          guest_document, check_in_date, check_out_date, number_of_guests,
          total_amount, special_requests, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        hotel_id, room_type_id, guest_name, guest_email, guest_phone,
        guest_document, check_in_date, check_out_date, number_of_guests,
        calculatedTotal, special_requests, status
      ]);
      
      const newReservation = await db.get(`
        SELECT r.*, h.name as hotel_name, rt.name as room_type_name
        FROM reservations r
        JOIN hotels h ON r.hotel_id = h.id
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.id = ?
      `, [result.lastID]);
      
      // Salvar chave de idempotência dentro da transação para garantir consistência
      if (idempotencyKey) {
        await db.run(`
          INSERT INTO idempotency_keys (key, response, status_code)
          VALUES (?, ?, ?)
        `, [idempotencyKey, JSON.stringify(newReservation), 201]);
      }

      await db.run('COMMIT'); // Confirma a transação
      res.status(201).json(newReservation);

    } catch (error) {
      await db.run('ROLLBACK'); // Reverte em caso de erro
      console.error('Erro ao criar reserva:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar Intenção de Pagamento (Stripe)
// Padrão PCI-DSS: O backend cria a intenção, o frontend coleta o cartão e confirma diretamente com o Stripe.
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'brl', reservation_id } = req.body;

    // 1. Validar se o valor corresponde à reserva no banco (Segurança)
    // Aqui simplificado, mas em produção deve-se buscar a reserva e usar o valor dela.
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      metadata: { reservation_id }
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erro no Stripe:', error);
    res.status(500).send({ error: error.message });
  }
});

// Webhook do Stripe (Essencial para confirmar pagamentos assíncronos como Boleto/Pix)
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  // Em produção: Validar assinatura do webhook para garantir que veio do Stripe
  console.log('Webhook do Stripe recebido');
  res.json({received: true});
});

// Rota para atualizar reserva completa
app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests,
      total_amount, special_requests, status
    } = req.body;
    
    const db = await getConnection();
    
    // Verificar se a reserva existe
    const existingReservation = await db.get('SELECT id FROM reservations WHERE id = ?', [id]);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    // Validar status se fornecido
    if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Atualizar reserva
    await db.run(`
      UPDATE reservations SET 
        hotel_id = COALESCE(?, hotel_id),
        room_type_id = COALESCE(?, room_type_id),
        guest_name = COALESCE(?, guest_name),
        guest_email = COALESCE(?, guest_email),
        guest_phone = COALESCE(?, guest_phone),
        guest_document = COALESCE(?, guest_document),
        check_in_date = COALESCE(?, check_in_date),
        check_out_date = COALESCE(?, check_out_date),
        number_of_guests = COALESCE(?, number_of_guests),
        total_amount = COALESCE(?, total_amount),
        special_requests = COALESCE(?, special_requests),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests,
      total_amount, special_requests, status, id
    ]);
    
    // Buscar reserva atualizada
    const updatedReservation = await db.get(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
    
    res.json(updatedReservation);
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar status da reserva
app.patch('/api/reservations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const db = await getConnection();
    await db.run('UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    
    const updatedReservation = await db.get(`
      SELECT r.*, h.name as hotel_name, rt.name as room_type_name
      FROM reservations r
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `, [id]);
    
    if (!updatedReservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    res.json(updatedReservation);
  } catch (error) {
    console.error('Erro ao atualizar status da reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar hotel
app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getConnection();
    
    // Verificar se hotel existe
    const existingHotel = await db.get('SELECT id FROM hotels WHERE id = ?', [id]);
    if (!existingHotel) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }
    
    // Verificar se há quartos associados
    const roomsCount = await db.get('SELECT COUNT(*) as count FROM room_types WHERE hotel_id = ?', [id]);
    if (roomsCount.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir hotel com quartos cadastrados. Exclua os quartos primeiro.' });
    }
    
    // Verificar se há reservas associadas
    const reservationsCount = await db.get('SELECT COUNT(*) as count FROM reservations WHERE hotel_id = ?', [id]);
    if (reservationsCount.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir hotel com reservas. Cancele as reservas primeiro.' });
    }
    
    // Deletar hotel
    await db.run('DELETE FROM hotels WHERE id = ?', [id]);
    
    console.log(`✅ Hotel ID ${id} deletado com sucesso`);
    res.json({ message: 'Hotel deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar quarto
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getConnection();
    
    // Verificar se quarto existe
    const existingRoom = await db.get('SELECT id FROM room_types WHERE id = ?', [id]);
    if (!existingRoom) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }
    
    // Verificar se há reservas associadas
    const reservationsCount = await db.get('SELECT COUNT(*) as count FROM reservations WHERE room_type_id = ?', [id]);
    if (reservationsCount.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir quarto com reservas. Cancele as reservas primeiro.' });
    }
    
    // Deletar quarto
    await db.run('DELETE FROM room_types WHERE id = ?', [id]);
    
    console.log(`✅ Quarto ID ${id} deletado com sucesso`);
    res.json({ message: 'Quarto deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar quarto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar reserva
app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getConnection();
    
    // Verificar se reserva existe
    const existingReservation = await db.get('SELECT id FROM reservations WHERE id = ?', [id]);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    // Deletar reserva
    await db.run('DELETE FROM reservations WHERE id = ?', [id]);
    
    console.log(`✅ Reserva ID ${id} deletada com sucesso`);
    res.json({ message: 'Reserva deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// --- Rotas de Chat (Comunicação Admin <-> Usuário) ---

// Listar mensagens de uma reserva
app.get('/api/chat/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const db = await getConnection();
    
    // Segurança: Verificar se o usuário tem permissão para ver essas mensagens
    // (Se é admin ou se é o dono da reserva)

    const messages = await db.all(
      'SELECT * FROM messages WHERE reservation_id = ? ORDER BY created_at ASC',
      [reservationId]
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem
app.post('/api/chat/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { content } = req.body;
    const senderRole = req.user.role; // 'admin' ou 'guest' (do middleware)

    const db = await getConnection();
    const result = await db.run(
      'INSERT INTO messages (reservation_id, sender_role, content) VALUES (?, ?, ?)',
      [reservationId, senderRole, content]
    );
    
    res.status(201).json({ id: result.lastID, content, senderRole, created_at: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Servir arquivos estáticos do Frontend (React/Vite)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));

// Qualquer rota não-API retorna o index.html do React (SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Rota não encontrada' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Inicializar servidor
export async function startServer() {
  try {
    // Testar conexão com banco
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🏨 Hotéis: http://localhost:${PORT}/api/hotels`);
      console.log(`🛏️  Quartos: http://localhost:${PORT}/api/rooms`);
      console.log(`📅 Reservas: http://localhost:${PORT}/api/reservations`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Apenas inicia o servidor se este arquivo for executado diretamente (node sqlite-server.js)
// Se for importado por um teste, não inicia automaticamente.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export { app };