'use strict';

try { require('dotenv').config(); } catch (e) {}

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');

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
  await _db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;');
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
    CREATE TABLE IF NOT EXISTS refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      refund_type TEXT DEFAULT 'full' CHECK(refund_type IN ('full','partial','none')),
      refund_amount REAL,
      approved_by TEXT,
      approved_at DATETIME,
      rejected_reason TEXT,
      stripe_refund_id TEXT,
      stripe_refund_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    );
  `);

  // Migrações seguras
  try { await db.run("ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT"); } catch (e) {}
  try { await db.run("ALTER TABLE room_types ADD COLUMN stripe_price_id TEXT"); } catch (e) {}
  try { await db.run("ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'pending'"); } catch (e) {}
  try { await db.run("ALTER TABLE room_types ADD COLUMN is_active BOOLEAN DEFAULT 1"); } catch (e) {}
  try { await db.run("ALTER TABLE room_types ADD COLUMN total_units INTEGER DEFAULT 1"); } catch (e) {}

  // Admin padrão
  const admin = await db.get("SELECT id FROM users WHERE username = 'admin@centerplaza.com'");
  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'CenterPlaza@2026!';
    const hash = await bcrypt.hash(adminPassword, 12);
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ['admin@centerplaza.com', hash, 'admin']);
    console.log('✅ Admin criado: admin@centerplaza.com / ' + adminPassword);
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
  const secret = process.env.ADMIN_SECRET_TOKEN;
  req.user = (auth === secret)
    ? { role: 'admin', id: 1 }
    : { role: 'guest', id: 0 };
  next();
};

const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  // auth check
  if (token === ADMIN_TOKEN) {
    req.user = { role: 'admin', id: 1 };
    next();
  } else {
    return res.status(401).json({ error: 'Não autorizado' });
  }
};
router.use(authMiddleware);


router.patch('/auth/change-credentials', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password, new_username } = req.body;
    if (!current_password) return res.status(400).json({ error: 'Senha atual obrigatória' });
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE role = ?', ['admin']);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    const bcrypt = require('bcryptjs');
    const isHashed = user.password.startsWith('$2');
    const valid = isHashed 
      ? await bcrypt.compare(current_password, user.password)
      : user.password === current_password;
    
    if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });
    
    const updates = [];
    const params = [];
    if (new_password) {
      const hash = await bcrypt.hash(new_password, 12);
      updates.push('password = ?');
      params.push(hash);
    }
    if (new_username) {
      updates.push('username = ?');
      params.push(new_username);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada para atualizar' });
    params.push(user.id);
    await db.run('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ message: 'Credenciais atualizadas com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/auth/me', (req, res) => {
  res.json({ role: req.user.role,
    permissions: req.user.role === 'admin' ? ['view_admin','manage_reservations'] : ['view_public'] });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
    const db   = await getDb();
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    // Suporte a senhas em texto plano legadas (migração automática)
    let valid = false;
    const isHashed = user.password.startsWith('$2');
    if (isHashed) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      // Senha ainda em texto plano — valida e migra para hash automaticamente
      valid = user.password === password;
      if (valid) {
        const hash = await bcrypt.hash(password, 12);
        await db.run("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
        console.log('🔐 Senha migrada para hash:', username);
      }
    }

    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    res.json({
      token: user.role === 'admin' ? ADMIN_TOKEN : 'user-token',
      role: user.role,
      username: user.username
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
      return res.status(400).json({ error: 'Dados inválidos. Senha deve ter no mínimo 6 caracteres.' });
    }
    const db = await getDb();
    const hash = await bcrypt.hash(password, 12);
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, hash]);
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


router.get('/rooms/all', async (req, res) => {
  try {
    const db   = await getDb();
    const rows = await db.all(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id ORDER BY rt.id ASC'
    );
    res.json(await roomsWithImages(db, rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/rooms/:id/availability', async (req, res) => {
  try {
    const { is_active } = req.body;
    if (![0,1].includes(Number(is_active))) return res.status(400).json({ error: 'is_active deve ser 0 ou 1' });
    const db = await getDb();
    await db.run('UPDATE room_types SET is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [Number(is_active), req.params.id]);
    const room = await db.get('SELECT rt.*, h.name as hotel_name FROM room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id WHERE rt.id=?', [req.params.id]);
    res.json(room);
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

// GET /api/rooms/:id/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
router.get('/rooms/:id/availability', async (req, res) => {
  try {
    const { check_in, check_out } = req.query;
    const db = await getDb();
    const room = await db.get('SELECT total_units, max_occupancy, is_active FROM room_types WHERE id = ?', [req.params.id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
    
    if (!check_in || !check_out) {
      return res.json({ total_units: room.total_units || 1, available_units: room.total_units || 1 });
    }
    
    const booked = await db.get(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > datetime('now','-30 minutes'))) AND check_in_date<? AND check_out_date>?",
      [req.params.id, check_out, check_in]
    );
    
    const totalUnits = room.total_units || 1;
    const availableUnits = Math.max(0, totalUnits - booked.c);
    
    res.json({
      total_units: totalUnits,
      booked_units: booked.c,
      available_units: availableUnits,
      is_available: availableUnits > 0 && room.is_active !== 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rooms/:id/blocked-dates', async (req, res) => {
  try {
    const db = await getDb();
    const reservations = await db.all(
      "SELECT check_in_date, check_out_date FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > datetime('now','-30 minutes'))) AND check_out_date >= date('now')",
      [req.params.id]
    );
    // Expandir cada reserva em array de datas bloqueadas
    const blocked = [];
    reservations.forEach(r => {
      const start = new Date(r.check_in_date);
      const end   = new Date(r.check_out_date);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        blocked.push(d.toISOString().split('T')[0]);
      }
    });
    res.json({ blocked_dates: blocked });
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
            max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night, is_active, total_units } = req.body;
    const db = await getDb();
    const r  = await db.run(
      'INSERT INTO room_types (hotel_id,name,description,size_sqm,bed_type,bed_count,max_occupancy,amenities,bathroom_type,smoking_allowed,price_per_night,is_active,stripe_price_id,total_units) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, name, description, size_sqm, bed_type, bed_count, max_occupancy,
       JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active !== undefined ? is_active : 1, req.body.stripe_price_id || null, total_units || 1]
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
            max_occupancy, amenities, bathroom_type, smoking_allowed, price_per_night, is_active, total_units } = req.body;
    const db = await getDb();
    
    // Buscar valores atuais para não sobrescrever com null
    const current = await db.get('SELECT * FROM room_types WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Quarto não encontrado' });
    
    await db.run(
      'UPDATE room_types SET hotel_id=?,name=?,description=?,size_sqm=?,bed_type=?,bed_count=?,max_occupancy=?,amenities=?,bathroom_type=?,smoking_allowed=?,price_per_night=?,is_active=?,stripe_price_id=?,total_units=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [
        hotel_id ?? current.hotel_id,
        name ?? current.name,
        description ?? current.description,
        size_sqm ?? current.size_sqm,
        bed_type ?? current.bed_type,
        bed_count ?? current.bed_count,
        max_occupancy ?? current.max_occupancy,
        amenities !== undefined ? JSON.stringify(Array.isArray(amenities) ? amenities : []) : current.amenities,
        bathroom_type ?? current.bathroom_type,
        smoking_allowed !== undefined ? (smoking_allowed ? 1 : 0) : current.smoking_allowed,
        price_per_night ?? current.price_per_night,
        is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
        req.body.stripe_price_id !== undefined ? req.body.stripe_price_id : current.stripe_price_id,
        total_units ?? current.total_units ?? 1,
        req.params.id
      ]
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
  SELECT r.*,
    h.name as hotel_name,
    rt.name as room_type_name,
    (SELECT COUNT(*) FROM messages m WHERE m.reservation_id=r.id AND m.read=0 AND m.sender_role='guest') as unread_count
  FROM reservations r
  JOIN hotels h ON r.hotel_id = h.id
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

// POST /api/reservations/:id/request-cancellation
router.post('/reservations/:id/request-cancellation', async (req, res) => {
  try {
    const { reason, guest_email } = req.body;
    if (!guest_email) return res.status(400).json({ error: 'Email obrigatório para validação' });

    const db = await getDb();
    const reservation = await db.get(
      'SELECT * FROM reservations WHERE id = ?',
      [req.params.id]
    );

    if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
    if (reservation.guest_email.toLowerCase() !== guest_email.toLowerCase()) {
      return res.status(403).json({ error: 'Email não corresponde à reserva' });
    }
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reserva já cancelada' });
    }
    if (reservation.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Reserva sem pagamento confirmado' });
    }

    const existing = await db.get(
      "SELECT id FROM refund_requests WHERE reservation_id=? AND status='pending'",
      [req.params.id]
    );
    if (existing) {
      return res.status(400).json({ error: 'Já existe uma solicitação de cancelamento pendente para esta reserva' });
    }

    const checkIn = new Date(reservation.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    const freeCancellation = hoursUntilCheckIn >= 24;

    const ins = await db.run(
      'INSERT INTO refund_requests (reservation_id, reason, status, refund_type, refund_amount) VALUES (?,?,?,?,?)',
      [req.params.id, reason || 'Solicitação de cancelamento pelo hóspede', 'pending', freeCancellation ? 'full' : 'none', freeCancellation ? reservation.total_amount : 0]
    );

    res.status(201).json({
      ok: true, request_id: ins.lastID, free_cancellation: freeCancellation, hours_until_checkin: Math.round(hoursUntilCheckIn),
      message: freeCancellation ? 'Solicitação registrada. Você está dentro do prazo de cancelamento gratuito. Nossa equipe processará em breve.' : 'Solicitação registrada. Você está fora do prazo de cancelamento gratuito (24h). Nossa equipe analisará sua solicitação.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reservations/:id/cancel', async (req, res) => {
  try {
    const db = await getDb();
    const reservation = await db.get(
      'SELECT * FROM reservations WHERE id = ?',
      [req.params.id]
    );
    
    if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reserva já cancelada' });
    }
    
    const checkIn = new Date(reservation.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const FREE_CANCEL_HOURS = 24;
    const canCancelFree = hoursUntilCheckIn >= FREE_CANCEL_HOURS;
    
    await db.run(
      "UPDATE reservations SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [req.params.id]
    );
    
    res.json({
      ok: true,
      free_cancellation: canCancelFree,
      message: canCancelFree
        ? 'Reserva cancelada sem custo.'
        : 'Reserva cancelada. Por estar dentro do prazo de 24h antes do check-in, pode haver cobrança de taxa.',
      hours_until_checkin: Math.round(hoursUntilCheckIn),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reservations/:id/cancellation-policy', async (req, res) => {
  try {
    const db = await getDb();
    const reservation = await db.get(
      'SELECT id, check_in_date, status FROM reservations WHERE id = ?',
      [req.params.id]
    );
    if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
    
    const checkIn = new Date(reservation.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    const FREE_CANCEL_HOURS = 24;
    const canCancelFree = hoursUntilCheckIn >= FREE_CANCEL_HOURS;
    const deadline = new Date(checkIn.getTime() - FREE_CANCEL_HOURS * 60 * 60 * 1000);
    
    res.json({
      can_cancel: reservation.status !== 'cancelled',
      free_cancellation: canCancelFree,
      hours_until_checkin: Math.round(hoursUntilCheckIn),
      deadline: deadline.toISOString(),
      deadline_formatted: deadline.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      policy: `Cancelamento gratuito até ${FREE_CANCEL_HOURS}h antes do check-in.`,
    });
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
      const room = await db.get('SELECT price_per_night, total_units, max_occupancy FROM room_types WHERE id = ?', [room_type_id]);
      if (!room) { await db.run('ROLLBACK'); return res.status(404).json({ error: 'Quarto não encontrado' }); }

      const totalUnits = room.total_units || 1;
      const conflict = await db.get(
        "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > datetime('now','-30 minutes'))) AND check_in_date<? AND check_out_date>?",
        [room_type_id, check_out_date, check_in_date]);
      if (conflict.c >= totalUnits) { await db.run('ROLLBACK'); return res.status(409).json({ error: 'Não há unidades disponíveis para as datas selecionadas' }); }

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


router.patch('/reservations/:id/cancel-pending', async (req, res) => {
  try {
    const db = await getDb();
    const r = await db.get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Nao encontrada' });
    if (r.status !== 'pending') return res.json({ message: 'Reserva nao esta pendente', status: r.status });
    await db.run("UPDATE reservations SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?", [req.params.id]);
    res.json({ message: 'Reserva cancelada', id: req.params.id });
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

router.post('/chat/:reservationId', async (req, res) => {
  try {
    const { content, sender_role } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Mensagem vazia' });
    const role = ['admin', 'guest'].includes(sender_role) ? sender_role : 'guest';
    const db = await getDb();
    const r  = await db.run(
      'INSERT INTO messages (reservation_id,sender_role,content) VALUES (?,?,?)',
      [req.params.reservationId, role, content.trim()]
    );
    res.status(201).json({
      id: r.lastID,
      reservation_id: parseInt(req.params.reservationId),
      sender_role: role,
      content: content.trim(),
      read: 0,
      created_at: new Date().toISOString()
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/chat/:reservationId/read', async (req, res) => {
  try {
    const db = await getDb();
    await db.run(
      "UPDATE messages SET read=1 WHERE reservation_id=? AND sender_role='guest'",
      [req.params.reservationId]
    );
    res.json({ ok: true });
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

    // Buscar preço e unidades
    const room = await db.get('SELECT * FROM room_types WHERE id = ?', [room_type_id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });

    const totalUnits = room.total_units || 1;
    const conflict = await db.get(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > datetime('now','-30 minutes'))) AND check_in_date<? AND check_out_date>?",
      [room_type_id, check_out_date, check_in_date]
    );
    if (conflict.c >= totalUnits) return res.status(409).json({ error: 'Não há unidades disponíveis para as datas selecionadas' });

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
    const baseUrl = process.env.FRONTEND_URL || 'https://centerplazahotel.com.br';
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

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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

// ── Reembolsos (Refund Requests) ──────────────────────────────────────────────

router.get('/refund-requests', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const db = await getDb();
    const requests = await db.all(`
      SELECT rr.*,
        r.guest_name, r.guest_email, r.guest_phone,
        r.check_in_date, r.check_out_date, r.total_amount,
        r.status as reservation_status, r.payment_status,
        r.stripe_payment_intent_id,
        h.name as hotel_name, rt.name as room_type_name
      FROM refund_requests rr
      JOIN reservations r ON rr.reservation_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY rr.created_at DESC
    `);
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/refund-requests/:id/approve', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { refund_type, custom_amount } = req.body;
    const db = await getDb();

    const request = await db.get('SELECT * FROM refund_requests WHERE id = ?', [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Solicitação já processada' });

    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [request.reservation_id]);
    if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });

    if (reservation.payment_status === 'refunded') return res.status(400).json({ error: 'Esta reserva já foi reembolsada' });
    if (!reservation.stripe_payment_intent_id && refund_type !== 'none') return res.status(400).json({ error: 'Reserva sem payment_intent do Stripe — reembolso manual necessário' });
    if (reservation.payment_status !== 'paid') return res.status(400).json({ error: 'Reserva não possui pagamento confirmado' });

    let stripeRefundId = null;
    let stripeRefundStatus = null;
    let finalRefundType = refund_type || request.refund_type;
    let refundAmount = 0;

    if (finalRefundType === 'full' || finalRefundType === 'partial') {
      if (!stripe) return res.status(503).json({ error: 'Stripe não configurado no backend' });
      try {
        let paymentIntentId = reservation.stripe_payment_intent_id;
        if (paymentIntentId && paymentIntentId.startsWith('cs_')) {
          const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
          paymentIntentId = session.payment_intent;
        }
        if (!paymentIntentId) return res.status(400).json({ error: 'Sessão do Stripe não gerou um Payment Intent' });

        const existingRefunds = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 1 });
        if (existingRefunds.data.length > 0 && existingRefunds.data[0].status === 'succeeded') {
          return res.status(400).json({ error: 'Já existe um reembolso processado para este pagamento no Stripe' });
        }

        const refundParams = { payment_intent: paymentIntentId, reason: 'requested_by_customer' };
        if (finalRefundType === 'partial' && custom_amount) {
          refundAmount = parseFloat(custom_amount);
          if (refundAmount <= 0 || refundAmount > reservation.total_amount) return res.status(400).json({ error: 'Valor de reembolso inválido' });
          refundParams.amount = Math.round(refundAmount * 100);
        } else {
          refundAmount = reservation.total_amount;
        }

        const refund = await stripe.refunds.create(refundParams);
        stripeRefundId = refund.id;
        stripeRefundStatus = refund.status;
      } catch (stripeErr) {
        return res.status(502).json({ error: 'Erro ao processar reembolso no Stripe: ' + stripeErr.message });
      }
    }

    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(
        `UPDATE refund_requests SET status='approved', refund_type=?, refund_amount=?, approved_by='admin', approved_at=CURRENT_TIMESTAMP, stripe_refund_id=?, stripe_refund_status=? WHERE id=?`,
        [finalRefundType, refundAmount, stripeRefundId, stripeRefundStatus, req.params.id]
      );
      const newPaymentStatus = finalRefundType === 'none' ? 'paid' : finalRefundType === 'partial' ? 'partially_refunded' : 'refunded';
      await db.run("UPDATE reservations SET status='cancelled', payment_status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", [newPaymentStatus, request.reservation_id]);
      await db.run('COMMIT');
    } catch (dbErr) {
      await db.run('ROLLBACK');
      throw dbErr;
    }
    res.json({ ok: true, refund_type: finalRefundType, refund_amount: refundAmount, stripe_refund_id: stripeRefundId, stripe_refund_status: stripeRefundStatus, message: finalRefundType === 'none' ? 'Reserva cancelada sem reembolso.' : `Reembolso de R$ ${refundAmount.toFixed(2)} processado com sucesso.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/refund-requests/:id/reject', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { reason } = req.body;
    const db = await getDb();
    const request = await db.get('SELECT * FROM refund_requests WHERE id = ?', [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Solicitação já processada' });

    await db.run("UPDATE refund_requests SET status='rejected', rejected_reason=?, approved_at=CURRENT_TIMESTAMP WHERE id=?", [reason || 'Rejeitado pelo administrador', req.params.id]);
    res.json({ ok: true, message: 'Solicitação rejeitada.' });
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