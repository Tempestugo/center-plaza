import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Tratamento de erros globais para evitar crash silencioso na inicialização
process.on('uncaughtException', (err) => {
  console.error('❌ Erro Crítico (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erro Crítico (Unhandled Rejection):', reason);
});

// Tenta carregar variáveis de ambiente se dotenv estiver instalado (opcional em dev)
try { require('dotenv').config(); } catch (e) {}

// Configuração do Stripe (Híbrido: Real se tiver chave, Mock se não tiver)
// Para produção: npm install stripe
let stripe = { paymentIntents: { create: async () => ({ client_secret: 'mock_secret_dev' }) } };

const app = express();
const PORT = process.env.PORT || 3001;

let dbInitializationError = null;

// Configuração do Multer para Upload de Imagens (Memória -> Banco de Dados)
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // Limite de 5MB

// Middleware
app.use(cors());

// ⚠️ IMPORTANTE: Webhook do Stripe deve vir ANTES do express.json global
// para garantir que o corpo da requisição não seja processado incorretamente.
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  // Em produção: Validar assinatura do webhook para garantir que veio do Stripe
  console.log('Webhook do Stripe recebido');
  res.json({received: true});
});

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

// Middleware de verificação de saúde do banco para rotas de API
app.use('/api', (req, res, next) => {
  if (dbInitializationError && req.path !== '/health' && req.path !== '/debug') {
    return res.status(500).json({ 
      error: 'Serviço de banco de dados indisponível', 
      details: dbInitializationError.message 
    });
  }
  next();
});

// Inicializar tabelas auxiliares de infraestrutura
const initInfraTables = async () => {
  // Importação dinâmica para evitar crash na inicialização se o módulo falhar
  const { getConnection } = await import('./database/sqlite-connection.js');
  const db = await getConnection();
  
  // 1. Tabelas de Negócio (Garantir que existem)
  await db.run(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      description TEXT,
      amenities TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS room_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      size_sqm REAL,
      bed_type TEXT,
      bed_count INTEGER,
      max_occupancy INTEGER,
      amenities TEXT,
      bathroom_type TEXT,
      smoking_allowed BOOLEAN,
      price_per_night REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hotel_id) REFERENCES hotels(id)
    )
  `);

  // Tabela de Imagens dos Quartos
  await db.run(`
    CREATE TABLE IF NOT EXISTS room_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_type_id INTEGER,
      image_data TEXT,
      image_type TEXT,
      display_order INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    )
  `);

  // Tabela de Reservas (Criar se não existir)
  await db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER,
      room_type_id INTEGER,
      guest_name TEXT,
      guest_email TEXT,
      guest_phone TEXT,
      guest_document TEXT,
      check_in_date DATE,
      check_out_date DATE,
      number_of_guests INTEGER,
      total_amount REAL,
      special_requests TEXT,
      status TEXT DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hotel_id) REFERENCES hotels(id),
      FOREIGN KEY(room_type_id) REFERENCES room_types(id)
    )
  `);

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

  // Tabela de Contatos (Mensagens do site)
  await db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Usuários (Login)
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `);

  // Adicionar colunas de pagamento à tabela de reservas se não existirem (migração simplificada)
  try {
    await db.run("ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT");
    await db.run("ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'pending'");
  } catch (e) {
    // Colunas já existem ou erro ignorável em dev
  }

  // Criar/Atualizar usuário ADMIN para formato de email
  const adminUser = await db.get("SELECT * FROM users WHERE username = 'admin' OR username = 'admin@centerplaza.com'");
  
  if (!adminUser) {
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin@centerplaza.com', 'admin', 'admin']);
    console.log("✅ Usuário admin criado: admin@centerplaza.com / admin");
  } else if (adminUser.username === 'admin') {
    // Migrar usuário antigo para email
    await db.run("UPDATE users SET username = ? WHERE id = ?", ['admin@centerplaza.com', adminUser.id]);
    console.log("✅ Usuário admin atualizado para: admin@centerplaza.com");
  }

  // Criar Hotel de Exemplo se não existir nenhum
  const hotelCount = await db.get("SELECT COUNT(*) as count FROM hotels");
  if (hotelCount.count === 0) {
    await db.run(`
      INSERT INTO hotels (name, address, city, state, description, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Center Plaza Hotel', 'Av. Central, 100', 'São Paulo', 'SP', 
      'O melhor hotel da região com conforto e qualidade.', 
      JSON.stringify(['Wi-Fi', 'Café da manhã', 'Estacionamento', 'Piscina'])
    ]);
    console.log("✅ Hotel de exemplo criado.");
  }

  // Criar Quarto de Exemplo se não existir nenhum
  const roomCount = await db.get("SELECT COUNT(*) as count FROM room_types");
  if (roomCount.count === 0) {
    const hotel = await db.get("SELECT id FROM hotels LIMIT 1");
    if (hotel) {
      await db.run(`
        INSERT INTO room_types (hotel_id, name, description, price_per_night, max_occupancy, amenities)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        hotel.id, 'Suíte Luxo', 'Quarto espaçoso com vista para o mar.', 
        250.00, 2, 
        JSON.stringify(['Ar condicionado', 'TV 50"', 'Frigobar', 'Hidromassagem'])
      ]);
      console.log("✅ Quarto de exemplo criado.");
    }
  }
};

// Middleware de Autenticação Simulado (Zero Trust)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const adminSecret = process.env.ADMIN_SECRET || 'Admin-Secret-123';
  
  if (authHeader === adminSecret || authHeader === 'Bearer admin-token') {
    req.user = { role: 'admin', id: 1 };
  } else {
    req.user = { role: 'guest', id: 0 };
  }
  next();
};

app.use(authMiddleware);

// Rota para o Frontend decidir se mostra o botão de Admin
app.get('/api/auth/me', (req, res) => {
  res.json({ 
    role: req.user.role,
    permissions: req.user.role === 'admin' ? ['view_admin', 'manage_reservations'] : ['view_public']
  });
});

// --- Rotas de Autenticação e Contato ---

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const { getConnection } = await import('./database/sqlite-connection.js');
  const db = await getConnection();
  
  const user = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
  
  if (user) {
    const token = user.role === 'admin' ? 'Bearer admin-token' : 'Bearer user-token';
    res.json({ token, role: user.role, username: user.username });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Criar Conta (Register)
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const { getConnection } = await import('./database/sqlite-connection.js');
  const db = await getConnection();
  
  try {
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, password]);
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: 'Usuário já existe ou erro nos dados' });
  }
});

// Contato (Salvar mensagem)
app.post('/api/contact', async (req, res) => { 
  const { name, email, message } = req.body;
  const { getConnection } = await import('./database/sqlite-connection.js');
  const db = await getConnection();
  try {
    await db.run("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)", [name, email, message]);
    console.log(`📩 Novo contato salvo de ${name} (${email})`);
    res.json({ message: 'Mensagem recebida com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
    res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

// Rota para listar mensagens de contato (Painel Admin)
app.get('/api/contacts', async (req, res) => {
  try {
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const contacts = await db.all('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(contacts);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API do Center Plaza funcionando com SQLite',
    dbStatus: dbInitializationError ? 'error' : 'connected'
  });
});

// Rota de Diagnóstico
app.get('/api/debug', async (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbDir = path.join(__dirname, 'database');
  
  const debugInfo = {
    status: 'online',
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    dbDirExists: fs.existsSync(dbDir),
    dbDirContents: fs.existsSync(dbDir) ? fs.readdirSync(dbDir) : 'N/A'
  };

  try {
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const counts = {};
    for (const t of tables) {
      const count = await db.get(`SELECT COUNT(*) as c FROM ${t.name}`);
      counts[t.name] = count.c;
    }
    debugInfo.database = { connected: true, tables: counts };
  } catch (error) {
    debugInfo.database = { connected: false, error: error.message, initError: dbInitializationError?.message };
  }
  
  res.json(debugInfo);
});

// Rota para servir imagens dos quartos (evita payload gigante de base64)
app.get('/api/room-images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const image = await db.get('SELECT image_data, image_type FROM room_images WHERE id = ?', [id]);
    
    if (!image) {
      return res.status(404).send('Imagem não encontrada');
    }
    
    let base64Data = image.image_data || '';
    // Limpeza de segurança: se o banco tiver o prefixo data:image/..., removemos para não quebrar o Buffer
    if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
    }

    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.writeHead(200, {
      'Content-Type': image.image_type,
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache por 1 dia
    });
    res.end(imgBuffer);
  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    res.status(500).send('Erro interno');
  }
});

// Rota para listar hotéis
app.get('/api/hotels', async (req, res) => {
  try {
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    let hotels = await db.all('SELECT * FROM hotels ORDER BY created_at DESC');
    
    if (hotels.length === 0) {
      console.log('📭 Nenhum hotel encontrado. Tentando repopular o banco...');
      await initInfraTables();
      hotels = await db.all('SELECT * FROM hotels ORDER BY created_at DESC');
    }

    const hotelsWithParsedAmenities = hotels.map(hotel => ({
      ...hotel,
      location: hotel.address,
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
    
    const { getConnection } = await import('./database/sqlite-connection.js');
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const rooms = await db.all(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      ORDER BY rt.created_at DESC
    `);
    
    const roomsWithParsedAmenities = await Promise.all(rooms.map(async (room) => {
      const images = await db.all('SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [room.id]);
      
      const processedImages = images.map(img => ({
        id: img.id,
        url: `/api/room-images/${img.id}`
      }));

      return {
        ...room,
        amenities: room.amenities ? JSON.parse(room.amenities) : [],
        images: processedImages
      };
    }));
    
    res.json(roomsWithParsedAmenities);
  } catch (error) {
    console.error('Erro ao buscar quartos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar tipo de quarto
app.post('/api/rooms', (req, res, next) => {
  upload.array('images')(req, res, (err) => {
    if (err) {
      console.error('❌ Erro no Upload (Multer):', err);
      return res.status(400).json({ error: 'Erro no upload de imagem: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const {
      hotel_id, name, description, size_sqm, bed_type, bed_count,
      max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night
    } = req.body;
    
    const { getConnection } = await import('./database/sqlite-connection.js');
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
    
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageData = file.buffer.toString('base64');
        await db.run(
          'INSERT INTO room_images (room_type_id, image_data, image_type, display_order) VALUES (?, ?, ?, ?)',
          [result.lastID, imageData, file.mimetype, i]
        );
      }
    }

    const newRoom = await db.get(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.id = ?
    `, [result.lastID]);

    // Buscar imagens recém criadas para retornar URLs
    const images = await db.all('SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [result.lastID]);
    const processedImages = images.map(img => ({
      id: img.id,
      url: `/api/room-images/${img.id}`
    }));

    res.status(201).json({
      ...newRoom,
      amenities: newRoom.amenities ? JSON.parse(newRoom.amenities) : [],
      images: processedImages
    });
  } catch (error) {
    console.error('Erro ao criar quarto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar reservas
app.get('/api/reservations', async (req, res) => {
  try {
    const { getConnection } = await import('./database/sqlite-connection.js');
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

// Rota para "Minhas Reservas" (Usuário Logado)
app.get('/api/my-reservations', async (req, res) => {
  try {
    const { getConnection } = await import('./database/sqlite-connection.js');
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const hotel = await db.get('SELECT * FROM hotels WHERE id = ?', [id]);
    
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }
    
    res.json({
      ...hotel,
      location: hotel.address,
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const rooms = await db.all(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.hotel_id = ?
      ORDER BY rt.created_at DESC
    `, [hotelId]);
    
    const roomsWithParsedAmenities = await Promise.all(rooms.map(async (room) => {
      const images = await db.all('SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [room.id]);
      const processedImages = images.map(img => ({
        id: img.id,
        url: `/api/room-images/${img.id}`
      }));
      return {
        ...room,
        amenities: room.amenities ? JSON.parse(room.amenities) : [],
        images: processedImages
      };
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    const room = await db.get(`
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      JOIN hotels h ON rt.hotel_id = h.id 
      WHERE rt.id = ?
    `, [id]);
    
    const images = await db.all('SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [id]);
    const processedImages = images.map(img => ({
      id: img.id,
      url: `/api/room-images/${img.id}`
    }));

    if (!room) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }
    
    res.json({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      images: processedImages
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
    
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
    const existingHotel = await db.get('SELECT * FROM hotels WHERE id = ?', [id]);
    if (!existingHotel) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }
    
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
      location: updatedHotel.address,
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
    
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
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
    const { getConnection } = await import('./database/sqlite-connection.js');
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
    const { getConnection } = await import('./database/sqlite-connection.js');
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
    
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();

    if (idempotencyKey) {
      const cached = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
      if (cached) {
        console.log(`🔁 Idempotency hit for key: ${idempotencyKey}`);
        return res.status(cached.status_code).json(JSON.parse(cached.response));
      }
    }

    const today = new Date().toISOString().split('T')[0];
    if (check_in_date < today) {
      return res.status(400).json({ error: 'A data de check-in não pode ser no passado.' });
    }

    await db.run('BEGIN EXCLUSIVE TRANSACTION');

    try {
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
      
      if (idempotencyKey) {
        await db.run(`
          INSERT INTO idempotency_keys (key, response, status_code)
          VALUES (?, ?, ?)
        `, [idempotencyKey, JSON.stringify(newReservation), 201]);
      }

      await db.run('COMMIT');
      res.status(201).json(newReservation);

    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Erro ao criar reserva:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar Intenção de Pagamento (Stripe)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'brl', reservation_id } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
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

// Rota para atualizar reserva completa
app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests,
      total_amount, special_requests, status
    } = req.body;
    
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
    const existingReservation = await db.get('SELECT id FROM reservations WHERE id = ?', [id]);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
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
    
    const { getConnection } = await import('./database/sqlite-connection.js');
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
    const existingHotel = await db.get('SELECT id FROM hotels WHERE id = ?', [id]);
    if (!existingHotel) {
      return res.status(404).json({ error: 'Hotel não encontrado' });
    }
    
    const roomsCount = await db.get('SELECT COUNT(*) as count FROM room_types WHERE hotel_id = ?', [id]);
    if (roomsCount.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir hotel com quartos cadastrados. Exclua os quartos primeiro.' });
    }
    
    const reservationsCount = await db.get('SELECT COUNT(*) as count FROM reservations WHERE hotel_id = ?', [id]);
    if (reservationsCount.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir hotel com reservas. Cancele as reservas primeiro.' });
    }
    
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
    const existingRoom = await db.get('SELECT id FROM room_types WHERE id = ?', [id]);
    if (!existingRoom) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }
    
    const reservationsCount = await db.get('SELECT COUNT(*) as count FROM reservations WHERE room_type_id = ?', [id]);
    if (reservationsCount.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir quarto com reservas. Cancele as reservas primeiro.' });
    }
    
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
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
    const existingReservation = await db.get('SELECT id FROM reservations WHERE id = ?', [id]);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    await db.run('DELETE FROM reservations WHERE id = ?', [id]);
    
    console.log(`✅ Reserva ID ${id} deletada com sucesso`);
    res.json({ message: 'Reserva deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// --- Rotas de Chat (Comunicação Admin <-> Usuário) ---

// Rota para admin ver todas as conversas (agrupadas por reserva)
app.get('/api/admin/chat-threads', async (req, res) => {
  try {
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    // Lista reservas que possuem mensagens, ordenadas pela mensagem mais recente
    const threads = await db.all(`
      SELECT DISTINCT r.id as reservation_id, r.guest_name, r.guest_email, h.name as hotel_name,
      (SELECT content FROM messages m2 WHERE m2.reservation_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages m2 WHERE m2.reservation_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
      (SELECT COUNT(*) FROM messages m2 WHERE m2.reservation_id = r.id AND m2.read = 0 AND m2.sender_role = 'guest') as unread_count
      FROM reservations r
      JOIN messages m ON r.id = m.reservation_id
      JOIN hotels h ON r.hotel_id = h.id
      ORDER BY last_message_at DESC
    `);
    res.json(threads);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Listar mensagens de uma reserva
app.get('/api/chat/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { getConnection } = await import('./database/sqlite-connection.js');
    const db = await getConnection();
    
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
    const senderRole = req.user.role;

    const { getConnection } = await import('./database/sqlite-connection.js');
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

// Inicialização do Stripe (Assíncrona para evitar Top-Level Await)
const initStripe = async () => {
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      // Tenta importar dinamicamente para não quebrar se o pacote não estiver instalado
      const { default: Stripe } = await import('stripe');
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      console.log('💳 Stripe inicializado com sucesso');
    } catch (e) {
      console.warn("⚠️ STRIPE_SECRET_KEY definida, mas pacote 'stripe' não instalado. Usando Mock.");
    }
  }
};

// Inicializar servidor
export async function startServer() {
  await initStripe();
  try {
    // Garantir que o diretório do banco de dados existe
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbDir = path.join(__dirname, 'database');
    
    if (!fs.existsSync(dbDir)) {
      console.log(`📁 Criando diretório do banco de dados: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Tentar inicializar o banco de dados
    await initInfraTables();
    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados (o servidor continuará):', error);
    dbInitializationError = error;
  }

  try {
    // Iniciar o servidor
    app.listen(PORT, async () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      
      if (dbInitializationError) {
        console.warn('⚠️ AVISO: O servidor iniciou, mas o banco de dados falhou. As rotas de API retornarão erro 500.');
      }
    });
  } catch (error) {
    console.error('❌ Erro FATAL ao iniciar servidor HTTP:', error);
    // Se não conseguir abrir a porta, aí sim o processo deve falhar
    process.exit(1);
  }
}

// Apenas inicia o servidor se este arquivo for executado diretamente (node sqlite-server.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export { app };
