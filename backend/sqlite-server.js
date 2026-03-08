'use strict';

try { require('dotenv').config(); } catch (e) {}

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer');
const fs       = require('fs');

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

router.use(cors());

router.use((req, res, next) => {
  console.log(new Date().toISOString() + ' - ' + req.method + ' /api' + req.path);
  next();
});

// ── Banco de Dados ────────────────────────────────────────────────────────────

let _db = null;
let dbInitializationError = null;

async function getDb() {
  if (_db) return _db;
  const sqlite  = require('sqlite');
  const sqlite3 = require('sqlite3');
  const dbDir   = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  _db = await sqlite.open({
    filename: path.join(dbDir, 'center-plaza.sqlite'),
    driver: sqlite3.Database,
  });
  return _db;
}

async function initDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT, city TEXT, state TEXT, zip_code TEXT,
      phone TEXT, email TEXT, website TEXT, description TEXT, amenities TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS room_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER,
      name TEXT NOT NULL, description TEXT,
      size_sqm REAL, bed_type TEXT, bed_count INTEGER,
      max_occupancy INTEGER, amenities TEXT, bathroom_type TEXT,
      smoking_allowed BOOLEAN, price_per_night REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hotel_id) REFERENCES hotels(id)
    );
    CREATE TABLE IF NOT EXISTS room_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_type_id INTEGER,
      image_data TEXT, image_type TEXT, display_order INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER, room_type_id INTEGER,
      guest_name TEXT, guest_email TEXT, guest_phone TEXT, guest_document TEXT,
      check_in_date DATE, check_out_date DATE, number_of_guests INTEGER,
      total_amount REAL, special_requests TEXT,
      status TEXT DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hotel_id) REFERENCES hotels(id),
      FOREIGN KEY(room_type_id) REFERENCES room_types(id)
    );
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      response TEXT, status_code INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER,
      sender_role TEXT CHECK(sender_role IN ('admin','guest')),
      content TEXT, read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, email TEXT, message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrações seguras
  try { await db.run("ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT"); } catch (e) {}
  try { await db.run("ALTER TABLE room_types ADD COLUMN stripe_price_id TEXT"); } catch (e) {}
  try { await db.run("ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'pending'"); } catch (e) {}
  try { await db.run("ALTER TABLE room_types ADD COLUMN is_active BOOLEAN DEFAULT 1"); } catch (e) {}

  // Admin padrão
  const admin = await db.get("SELECT id FROM users WHERE username = 'admin@centerplaza.com'");
  if (!admin) {
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ['admin@centerplaza.com', 'admin', 'admin']);
    console.log('✅ Admin criado: admin@centerplaza.com / admin');
  }

  // Seed hotel
  const hCount = await db.get("SELECT COUNT(*) as c FROM hotels");
  if (hCount.c === 0) {
    await db.run(
      "INSERT INTO hotels (name, address, city, state, description, amenities) VALUES (?, ?, ?, ?, ?, ?)",
      ['Center Plaza Hotel','Av. Central, 100','São Paulo','SP',
       'O melhor hotel da região.',
       JSON.stringify(['Wi-Fi','Café da manhã','Estacionamento','Piscina'])]
    );
    console.log('✅ Hotel seed criado');
  }

  // Seed quarto
  const rCount = await db.get("SELECT COUNT(*) as c FROM room_types");
  if (rCount.c === 0) {
    const hotel = await db.get("SELECT id FROM hotels LIMIT 1");
    if (hotel) {
      await db.run(
        "INSERT INTO room_types (hotel_id, name, description, price_per_night, max_occupancy, amenities) VALUES (?, ?, ?, ?, ?, ?)",
        [hotel.id,'Suíte Luxo','Quarto espaçoso com vista panorâmica.',250.00,2,
         JSON.stringify(['Ar condicionado','TV 50"','Frigobar','Hidromassagem'])]
      );
      console.log('✅ Quarto seed criado');
    }
  }
}

// Guard de banco
router.use((req, res, next) => {
  if (dbInitializationError && req.path !== '/health' && req.path !== '/debug') {
    return res.status(500).json({ error: 'Banco de dados indisponível', details: dbInitializationError.message });
  }
  next();
});

// ── Autenticação ──────────────────────────────────────────────────────────────

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'center_plaza_admin_2026_secure_token';

const authMiddleware = (req, res, next) => {
  const auth   = req.headers['authorization'];
  const secret = process.env.ADMIN_SECRET || 'Admin-Secret-123';
  req.user = (auth === secret || auth === 'Bearer admin-token')
    ? { role: 'admin', id: 1 }
    : { role: 'guest', id: 0 };
  next();
};

const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  // console.log('Auth Check:', { received: token, expected: ADMIN_TOKEN }); // Descomente para debug
  if (token === ADMIN_TOKEN || token === 'admin-token') {
    req.user = { role: 'admin', id: 1 };
    next();
  } else {
    return res.status(401).json({ error: 'Não autorizado' });
  }
};
router.use(authMiddleware);

router.get('/auth/me', (req, res) => {
  res.json({ role: req.user.role,
    permissions: req.user.role === 'admin' ? ['view_admin','manage_reservations'] : ['view_public'] });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db   = await getDb();
    const user = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (user) {
      res.json({ token: user.role === 'admin' ? ADMIN_TOKEN : 'user-token',
        role: user.role, username: user.username });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await getDb();
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, password]);
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) { res.status(400).json({ error: 'Usuário já existe ou dados inválidos' }); }
});

// ── Health & Debug ────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbInitializationError ? 'error' : 'connected',
    message: 'API do Center Plaza funcionando com SQLite' });
});

router.get('/debug', async (req, res) => {
  const info = { cwd: process.cwd(), node: process.version, timestamp: new Date().toISOString() };
  try {
    const db     = await getDb();
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const counts = {};
    for (const t of tables) {
      const r = await db.get('SELECT COUNT(*) as c FROM ' + t.name);
      counts[t.name] = r.c;
    }
    info.database = { connected: true, tables: counts };
  } catch (e) {
    info.database = { connected: false, error: e.message };
  }
  res.json(info);
});

// ── Imagens ───────────────────────────────────────────────────────────────────

router.get('/room-images/:id', async (req, res) => {
  try {
    const db  = await getDb();
    const img = await db.get('SELECT image_data, image_type FROM room_images WHERE id = ?', [req.params.id]);
    if (!img) return res.status(404).send('Imagem não encontrada');
    let data = img.image_data || '';
    if (data.includes('base64,')) data = data.split('base64,')[1];
    const buf = Buffer.from(data, 'base64');
    res.writeHead(200, { 'Content-Type': img.image_type, 'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400' });
    res.end(buf);
  } catch (err) { res.status(500).send('Erro interno'); }
});

router.post('/room-images/:roomId', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
    const { image_data, image_type } = req.body;
    const db = await getDb();
    const r = await db.run(
      'INSERT INTO room_images (room_type_id,image_data,image_type,display_order) VALUES (?,?,?,0)',
      [req.params.roomId, image_data, image_type]
    );
    res.status(201).json({ id: r.lastID, url: `/api/room-images/${r.lastID}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/room-images/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
    const db = await getDb();
    await db.run('DELETE FROM room_images WHERE id = ?', [req.params.id]);
    res.json({ message: 'Imagem excluída' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function roomsWithImages(db, rows) {
  return Promise.all(rows.map(async (room) => {
    const imgs = await db.all(
      'SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [room.id]);
    return {
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      images: imgs.map(i => ({ id: i.id, url: '/api/room-images/' + i.id }))
    };
  }));
}

// ── Hotéis ────────────────────────────────────────────────────────────────────

router.get('/hotels', async (req, res) => {
  try {
    const db     = await getDb();
    const hotels = await db.all('SELECT * FROM hotels ORDER BY created_at DESC');
    res.json(hotels.map(h => ({ ...h, location: h.address,
      amenities: h.amenities ? JSON.parse(h.amenities) : [] })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hotels/:id', async (req, res) => {
  try {
    const db    = await getDb();
    const hotel = await db.get('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (!hotel) return res.status(404).json({ error: 'Hotel não encontrado' });
    res.json({ ...hotel, location: hotel.address,
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/hotels', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { name, address, city, state, zip_code, phone, email, website, description, amenities } = req.body;
    const db = await getDb();
    const r  = await db.run(
      'INSERT INTO hotels (name,address,city,state,zip_code,phone,email,website,description,amenities) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [name, address, city, state, zip_code, phone, email, website, description, JSON.stringify(amenities || [])]
    );
    const hotel = await db.get('SELECT * FROM hotels WHERE id = ?', [r.lastID]);
    res.status(201).json({ ...hotel, amenities: JSON.parse(hotel.amenities || '[]') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hotels/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { name, address, city, state, zip_code, phone, email, website, description, amenities } = req.body;
    const db = await getDb();
    await db.run(
      'UPDATE hotels SET name=?,address=?,city=?,state=?,zip_code=?,phone=?,email=?,website=?,description=?,amenities=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [name, address, city, state, zip_code, phone, email, website, description,
       JSON.stringify(amenities || []), req.params.id]
    );
    const hotel = await db.get('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (!hotel) return res.status(404).json({ error: 'Hotel não encontrado' });
    res.json({ ...hotel, amenities: JSON.parse(hotel.amenities || '[]') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/hotels/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const db    = await getDb();
    const rooms = await db.get('SELECT COUNT(*) as c FROM room_types WHERE hotel_id = ?', [req.params.id]);
    if (rooms.c > 0) return res.status(400).json({ error: 'Exclua os quartos antes de excluir o hotel' });
    const resv  = await db.get('SELECT COUNT(*) as c FROM reservations WHERE hotel_id = ?', [req.params.id]);
    if (resv.c  > 0) return res.status(400).json({ error: 'Cancele as reservas antes de excluir o hotel' });
    await db.run('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    res.json({ message: 'Hotel excluído com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Quartos ───────────────────────────────────────────────────────────────────

router.get('/rooms', async (req, res) => {
  try {
    const db   = await getDb();
    const rows = await db.all(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id ORDER BY rt.created_at DESC');
    res.json(await roomsWithImages(db, rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const db   = await getDb();
    const rows = await db.all(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id WHERE rt.hotel_id = ?',
      [req.params.hotelId]);
    res.json(await roomsWithImages(db, rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rooms/:id', async (req, res) => {
  try {
    const db   = await getDb();
    const room = await db.get(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id WHERE rt.id = ?',
      [req.params.id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
    const [result] = await roomsWithImages(db, [room]);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rooms', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { hotel_id, name, description, size_sqm, bed_type, bed_count,
            max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night, is_active } = req.body;
    const db = await getDb();
    const r  = await db.run(
      'INSERT INTO room_types (hotel_id,name,description,size_sqm,bed_type,bed_count,max_occupancy,amenities,bathroom_type,smoking_allowed,price_per_night,is_active,stripe_price_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, name, description, size_sqm, bed_type, bed_count, max_occupancy,
       JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active !== undefined ? is_active : 1, req.body.stripe_price_id || null]
    );
    const room = await db.get(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id WHERE rt.id = ?',
      [r.lastID]);
    const [result] = await roomsWithImages(db, [room]);
    res.status(201).json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/rooms/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { hotel_id, name, description, size_sqm, bed_type, bed_count,
            max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night, is_active } = req.body;
    const db = await getDb();
    await db.run(
      'UPDATE room_types SET hotel_id=?,name=?,description=?,size_sqm=?,bed_type=?,bed_count=?,max_occupancy=?,amenities=?,bathroom_type=?,smoking_allowed=?,price_per_night=?,is_active=COALESCE(?,is_active),stripe_price_id=COALESCE(?,stripe_price_id),updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [hotel_id, name, description, size_sqm, bed_type, bed_count, max_occupancy,
       JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active, req.body.stripe_price_id || null, req.params.id]
    );
    const room = await db.get(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id WHERE rt.id = ?',
      [req.params.id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
    const [result] = await roomsWithImages(db, [room]);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/rooms/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const db   = await getDb();
    const resv = await db.get('SELECT COUNT(*) as c FROM reservations WHERE room_type_id = ?', [req.params.id]);
    if (resv.c > 0) return res.status(400).json({ error: 'Cancele as reservas antes de excluir o quarto' });
    await db.run('DELETE FROM room_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Quarto excluído com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Reservas ──────────────────────────────────────────────────────────────────

const reservationJoin = `
  SELECT r.*, h.name as hotel_name, rt.name as room_type_name
  FROM reservations r
  JOIN hotels h  ON r.hotel_id      = h.id
  JOIN room_types rt ON r.room_type_id = rt.id
`;

router.get('/reservations', async (req, res) => {
  try {
    const { guest_email, code, guest_name } = req.query;
    const db     = await getDb();
    let   query  = reservationJoin;
    const params = [];
    const conds  = [];
    if (guest_email)         { conds.push('r.guest_email = ?');              params.push(guest_email); }
    if (code && guest_name)  { conds.push('r.id = ? AND r.guest_name = ?'); params.push(code, guest_name); }
    if (conds.length)  query += ' WHERE ' + conds.join(' AND ');
    query += ' ORDER BY r.created_at DESC';
    res.json(await db.all(query, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-reservations', async (req, res) => {
  try {
    const db = await getDb();
    res.json(await db.all(reservationJoin + ' ORDER BY r.created_at DESC'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reservations/:id', async (req, res) => {
  try {
    const db = await getDb();
    const r  = await db.get(reservationJoin + ' WHERE r.id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reservations', async (req, res) => {
  try {
    const { hotel_id, room_type_id, guest_name, guest_email, guest_phone,
            guest_document, check_in_date, check_out_date, number_of_guests,
            special_requests, status = 'pending' } = req.body;
    const iKey = req.headers['idempotency-key'];
    const db   = await getDb();

    if (iKey) {
      const cached = await db.get('SELECT * FROM idempotency_keys WHERE key = ?', [iKey]);
      if (cached) return res.status(cached.status_code).json(JSON.parse(cached.response));
    }

    const today = new Date().toISOString().split('T')[0];
    if (check_in_date < today) return res.status(400).json({ error: 'Data de check-in não pode ser no passado' });

    await db.run('BEGIN EXCLUSIVE TRANSACTION');
    try {
      const conflict = await db.get(
        "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND status='confirmed' AND check_in_date<? AND check_out_date>?",
        [room_type_id, check_out_date, check_in_date]);
      if (conflict.c > 0) { await db.run('ROLLBACK'); return res.status(409).json({ error: 'Quarto indisponível para as datas selecionadas' }); }

      const room = await db.get('SELECT price_per_night FROM room_types WHERE id = ?', [room_type_id]);
      if (!room)  { await db.run('ROLLBACK'); return res.status(404).json({ error: 'Quarto não encontrado' }); }

      const nights = Math.max(1, Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000));
      const total  = room.price_per_night * nights;

      const ins = await db.run(
        'INSERT INTO reservations (hotel_id,room_type_id,guest_name,guest_email,guest_phone,guest_document,check_in_date,check_out_date,number_of_guests,total_amount,special_requests,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [hotel_id, room_type_id, guest_name, guest_email, guest_phone,
         guest_document, check_in_date, check_out_date, number_of_guests, total, special_requests, status]
      );

      const newRes = await db.get(reservationJoin + ' WHERE r.id = ?', [ins.lastID]);

      if (iKey) await db.run(
        'INSERT INTO idempotency_keys (key,response,status_code) VALUES (?,?,?)',
        [iKey, JSON.stringify(newRes), 201]);

      await db.run('COMMIT');
      res.status(201).json(newRes);
    } catch (err) { await db.run('ROLLBACK'); throw err; }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/reservations/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { hotel_id, room_type_id, guest_name, guest_email, guest_phone,
            guest_document, check_in_date, check_out_date, number_of_guests,
            total_amount, special_requests, status } = req.body;
    if (status && !['pending','confirmed','cancelled'].includes(status))
      return res.status(400).json({ error: 'Status inválido' });
    const db = await getDb();
    await db.run(
      'UPDATE reservations SET hotel_id=COALESCE(?,hotel_id),room_type_id=COALESCE(?,room_type_id),guest_name=COALESCE(?,guest_name),guest_email=COALESCE(?,guest_email),guest_phone=COALESCE(?,guest_phone),guest_document=COALESCE(?,guest_document),check_in_date=COALESCE(?,check_in_date),check_out_date=COALESCE(?,check_out_date),number_of_guests=COALESCE(?,number_of_guests),total_amount=COALESCE(?,total_amount),special_requests=COALESCE(?,special_requests),status=COALESCE(?,status),updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [hotel_id, room_type_id, guest_name, guest_email, guest_phone,
       guest_document, check_in_date, check_out_date, number_of_guests,
       total_amount, special_requests, status, req.params.id]
    );
    const r = await db.get(reservationJoin + ' WHERE r.id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/reservations/:id/status', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { status } = req.body;
    if (!['pending','confirmed','cancelled'].includes(status))
      return res.status(400).json({ error: 'Status inválido' });
    const db = await getDb();
    await db.run('UPDATE reservations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [status, req.params.id]);
    const r = await db.get(reservationJoin + ' WHERE r.id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/reservations/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const db = await getDb();
    await db.run('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reserva excluída com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contato ───────────────────────────────────────────────────────────────────

router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const db = await getDb();
    await db.run("INSERT INTO contacts (name,email,message) VALUES (?,?,?)", [name, email, message]);
    res.json({ message: 'Mensagem recebida com sucesso!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/contacts', async (req, res) => {
  try {
    const db = await getDb();
    res.json(await db.all('SELECT * FROM contacts ORDER BY created_at DESC'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Chat ──────────────────────────────────────────────────────────────────────

router.get('/admin/chat-threads', async (req, res) => {
  try {
    const db = await getDb();
    res.json(await db.all(`
      SELECT DISTINCT r.id as reservation_id, r.guest_name, r.guest_email, h.name as hotel_name,
        (SELECT content    FROM messages m2 WHERE m2.reservation_id=r.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m2 WHERE m2.reservation_id=r.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*)   FROM messages m2 WHERE m2.reservation_id=r.id AND m2.read=0 AND m2.sender_role='guest') as unread_count
      FROM reservations r
      JOIN messages m ON r.id = m.reservation_id
      JOIN hotels h   ON r.hotel_id = h.id
      ORDER BY last_message_at DESC
    `));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/chat/:reservationId', async (req, res) => {
  try {
    const db = await getDb();
    res.json(await db.all(
      'SELECT * FROM messages WHERE reservation_id=? ORDER BY created_at ASC',
      [req.params.reservationId]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/chat/:reservationId', requireAuth, async (req, res) => {
  // Admin ou Guest podem enviar, mas aqui estamos focando no admin via requireAuth se for rota protegida
  try {
    const db = await getDb();
    const r  = await db.run(
      'INSERT INTO messages (reservation_id,sender_role,content) VALUES (?,?,?)',
      [req.params.reservationId, req.user.role, req.body.content]);
    res.status(201).json({ id: r.lastID, content: req.body.content,
      senderRole: req.user.role, created_at: new Date() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
 
// ── Stripe ───────────────────────────────────────────────────────────────────

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe inicializado');
  } else {
    console.warn('⚠️  STRIPE_SECRET_KEY inválida — modo mock ativo');
  }
} catch (e) { console.warn('⚠️  stripe não instalado:', e.message); }

router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Stripe não configurado' });

    const {
      hotel_id, room_type_id, guest_name, guest_email, guest_phone,
      guest_document, check_in_date, check_out_date, number_of_guests, special_requests
    } = req.body;

    const db = await getDb();

    // Verificar disponibilidade
    const conflict = await db.get(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND status!='cancelled' AND check_in_date<? AND check_out_date>?",
      [room_type_id, check_out_date, check_in_date]
    );
    if (conflict.c > 0) return res.status(409).json({ error: 'Quarto indisponível para as datas selecionadas' });

    // Buscar preço
    const room = await db.get('SELECT * FROM room_types WHERE id = ?', [room_type_id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });

    const nights = Math.max(1, Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000));
    const totalAmount = room.price_per_night * nights;

    // Criar reserva pendente
    const ins = await db.run(
      'INSERT INTO reservations (hotel_id,room_type_id,guest_name,guest_email,guest_phone,guest_document,check_in_date,check_out_date,number_of_guests,total_amount,special_requests,status,payment_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, room_type_id, guest_name, guest_email, guest_phone, guest_document,
       check_in_date, check_out_date, number_of_guests, totalAmount, special_requests || '', 'pending', 'pending']
    );
    const reservationId = ins.lastID;

    // Criar Checkout Session
    const baseUrl = process.env.FRONTEND_URL || 'https://lightgrey-echidna-641630.hostingersite.com';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: guest_email,
      locale: 'pt-BR',
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: room.name + ' — Center Plaza Hotel',
            description: `Check-in: ${check_in_date} | Check-out: ${check_out_date} | ${nights} noite(s) | ${number_of_guests} hóspede(s)`,
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      }],
      metadata: {
        reservation_id: reservationId.toString(),
        guest_name,
        guest_email,
      },
      success_url: `${baseUrl}/reserva/sucesso?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId}`,
      cancel_url: `${baseUrl}/reserva/cancelado?reservation_id=${reservationId}`,
    });

    // Salvar session_id na reserva
    await db.run(
      'UPDATE reservations SET stripe_payment_intent_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [session.id, reservationId]
    );

    res.json({ url: session.url, reservationId, sessionId: session.id });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (stripe && secret && sig && Buffer.isBuffer(req.body)) {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } else {
      const body = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook parse error:', err.message);
    return res.status(400).json({ error: 'Webhook inválido: ' + err.message });
  }

  try {
    const db = await getDb();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const reservationId = session.metadata?.reservation_id;
      if (reservationId) {
        await db.run(
          "UPDATE reservations SET status='confirmed', payment_status='paid', updated_at=CURRENT_TIMESTAMP WHERE id=?",
          [reservationId]
        );
        console.log('✅ Reserva confirmada via checkout:', reservationId);
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const reservationId = session.metadata?.reservation_id;
      if (reservationId) {
        await db.run(
          "UPDATE reservations SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?",
          [reservationId]
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/reservations/:id/payment-status', async (req, res) => {
  try {
    const db = await getDb();
    const r = await db.get(
      'SELECT id, status, payment_status, stripe_payment_intent_id, total_amount FROM reservations WHERE id=?',
      [req.params.id]
    );
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Error handler ─────────────────────────────────────────────────────────────

router.use((err, req, res, next) => {
  console.error('Erro na API:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ── Iniciar banco ao carregar o módulo ────────────────────────────────────────

initDatabase()
  .then(() => console.log('✅ Banco de dados pronto'))
  .catch((err) => {
    console.error('❌ Falha ao inicializar banco:', err);
    dbInitializationError = err;
  });

module.exports = router;