'use strict';

try { require('dotenv').config(); } catch (e) {}

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const mysql    = require('mysql2/promise');

cnuuciottps://centerplazahotel.com.br',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Bloqueado pelo CORS'));
  },
  credentials: true
}));

router.use((req, res, next) => {
  console.log(new Date().toISOString() + ' - ' + req.method + ' /api' + req.path);
  next();
});

// Servir a pasta de uploads estaticamente
router.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// ── Banco de Dados ────────────────────────────────────────────────────────────

let _dbPool = null;
let dbInitializationError = null;

async function getDb() {
  if (_dbPool) return _dbPool;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida no arquivo .env');
  }
  _dbPool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  // Testa a conexão
  const connection = await _dbPool.getConnection();
  connection.release();
  return _dbPool;
}

async function initDatabase() {
  const db = await getDb();

  // A sintaxe foi ajustada para MySQL
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name TEXT NOT NULL,
      address TEXT, city TEXT, state TEXT, zip_code TEXT,
      phone TEXT, email TEXT, website TEXT, description TEXT, amenities JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS room_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hotel_id INT,
      name TEXT NOT NULL, description TEXT,
      size_sqm DECIMAL(10, 2), bed_type TEXT, bed_count INT,
      max_occupancy INT, amenities JSON, bathroom_type TEXT,
      smoking_allowed BOOLEAN, price_per_night DECIMAL(10, 2),
      is_active BOOLEAN DEFAULT 1,
      total_units INT DEFAULT 1,
      stripe_price_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(hotel_id) REFERENCES hotels(id)
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS room_images (
      id INT PRIMARY KEY AUTO_INCREMENT,
      room_type_id INT,
      image_data LONGTEXT, image_type VARCHAR(255), display_order INT,
      url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hotel_id INT, room_type_id INT,
      guest_name TEXT, guest_email TEXT, guest_phone TEXT, guest_document TEXT,
      check_in_date DATE, check_out_date DATE, number_of_guests INT,
      total_amount DECIMAL(10, 2), special_requests TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      payment_status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(hotel_id) REFERENCES hotels(id),
      FOREIGN KEY(room_type_id) REFERENCES room_types(id)
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      \`key\` VARCHAR(255) PRIMARY KEY,
      response TEXT, status_code INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      reservation_id INT,
      sender_role VARCHAR(10) CHECK(sender_role IN ('admin','guest')),
      content TEXT, \`read\` BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name TEXT, email TEXT, message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS refund_requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      reservation_id INT NOT NULL,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      refund_type VARCHAR(20) DEFAULT 'full' CHECK(refund_type IN ('full','partial','none')),
      refund_amount DECIMAL(10, 2),
      approved_by TEXT,
      approved_at DATETIME,
      rejected_reason TEXT,
      stripe_refund_id TEXT,
      stripe_refund_status TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id)
    );`);
  await db.query(`CREATE TABLE IF NOT EXISTS settings (\`key\` VARCHAR(255) PRIMARY KEY, value TEXT)`);

  // Migrações seguras (MySQL ignora se a coluna já existe)
  try { await db.query("ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT"); } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
  try { await db.query("ALTER TABLE room_types ADD COLUMN stripe_price_id TEXT"); } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
  try { await db.query("ALTER TABLE room_images ADD COLUMN url VARCHAR(255)"); } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
  try { await db.query("ALTER TABLE reservations ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'"); } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
  try { await db.query("ALTER TABLE room_types ADD COLUMN is_active BOOLEAN DEFAULT 1"); } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
  try { await db.query("ALTER TABLE room_types ADD COLUMN total_units INT DEFAULT 1"); } catch (e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
  try { await db.query("ALTER TABLE settings MODIFY COLUMN value LONGTEXT"); } catch (e) {}

  // Admin padrão
  const [[admin]] = await db.query("SELECT id FROM users WHERE username = 'admin@centerplaza.com'");
  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'CenterPlaza@2026!';
    const hash = await bcrypt.hash(adminPassword, 12);
    await db.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ['admin@centerplaza.com', hash, 'admin']);
    console.log('✅ Admin criado: admin@centerplaza.com / ' + adminPassword);
  }

  // Seed hotel
  const [[hCount]] = await db.query("SELECT COUNT(*) as c FROM hotels");
  if (hCount.c === 0) {
    await db.execute(
      "INSERT INTO hotels (name, address, city, state, description, amenities) VALUES (?, ?, ?, ?, ?, ?)",
      ['Center Plaza Hotel','Av. Central, 100','São Paulo','SP',
       'O melhor hotel da região.',
       JSON.stringify(['Wi-Fi','Café da manhã','Estacionamento','Piscina'])]
    );
    console.log('✅ Hotel seed criado');
  }

  // Seed quarto
  const [[rCount]] = await db.query("SELECT COUNT(*) as c FROM room_types");
  if (rCount.c === 0) {
    const [[hotel]] = await db.query("SELECT id FROM hotels LIMIT 1");
    if (hotel) {
      await db.execute(
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

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN;
if (!ADMIN_TOKEN) { console.error('URGENTE: ADMIN_SECRET_TOKEN nao configurado!'); process.exit(1); }

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
    const [[user]] = await db.query('SELECT * FROM users WHERE role = ?', ['admin']);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
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
    await db.execute('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params);
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
    const [[user]] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    let valid = false;
    const isHashed = user.password.startsWith('$2');
    if (isHashed) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      valid = user.password === password;
      if (valid) {
        const hash = await bcrypt.hash(password, 12);
        await db.execute("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
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
    await db.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, hash]);
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) { 
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    res.status(400).json({ error: 'Dados inválidos' }); 
  }
});

// ── Health & Debug ────────────────────────────────────────────────────────────

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const db = await getDb();
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }
  res.json({ status: 'ok', db: dbStatus,
    message: 'API do Center Plaza funcionando com MySQL' });
});

router.get('/debug', async (req, res) => {
  const info = { cwd: process.cwd(), node: process.version, timestamp: new Date().toISOString() };
  try {
    const db     = await getDb();
    const dbName = db.pool.config.connectionConfig.database;
    const [tables] = await db.query("SELECT table_name as name FROM information_schema.tables WHERE table_schema = ?", [dbName]);
    const counts = {};
    for (const t of tables) {
      const [[r]] = await db.query('SELECT COUNT(*) as c FROM ' + t.name);
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
    const [[img]] = await db.query('SELECT image_data, image_type, url FROM room_images WHERE id = ?', [req.params.id]);
    if (!img) return res.status(404).send('Imagem não encontrada');
    
    if (img.url) {
      const filename = img.url.split('/').pop();
      const filepath = path.join(__dirname, '..', 'public', 'uploads', filename);
      if (require('fs').existsSync(filepath)) {
        return res.sendFile(filepath);
      }
    }
    
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

    const [r] = await db.execute(
      'INSERT INTO room_images (room_type_id,image_data,image_type,url,display_order) VALUES (?,?,?,?,0)',
      [req.params.roomId, image_data, image_type, null]
    );
    const finalUrl = `/api/room-images/${r.insertId}`;
    res.status(201).json({gU
es.json({ url: imageUrl });
});

router.get('/settings/:keyeq, re
    const db = await getDb();
    const [[setting] query('SELECT value FROM settings WHERE `key` = ?', [req.params.key]);
    eva tn(err) { res.status(500).json({ error: err.message }); }
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function roomsWithImages(db, rows) {
  return Promise.all(rows.map(async (room) => {
    const [imgs] = await db.query(
      'SELECT id FROM room_images WHERE room_type_id = ? ORDER BY display_order', [room.id]);
    return {
      ...room,
      amenities: room.amenities, // JSON is handled automatically by mysql2
      images: imgs.map(i => ({ id: i.id, url: '/api/room-images/' + i.id }))
    };
  }));
}
  

router.post('/hotels', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { name, address, city, state, zip_code, phone, email, website, description, amenities } = req.body;
    const db = await getDb();
    const [r]  = await db.execute(
      'INSERT INTO hotels (name,address,city,state,zip_code,phone,email,website,description,amenities) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [name, address, city, state, zip_code, phone, email, website, description, JSON.stringify(amenities || [])]
    );
    const [[hotel]] = await db.query('SELECT * FROM hotels WHERE id = ?', [r.insertId]);
    res.status(201).json({ ...hotel, amenities: hotel.amenities || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hotels/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { name, address, city, state, zip_code, phone, email, website, description, amenities } = req.body;
    const db = await getDb();
    await db.execute(
      'UPDATE hotels SET name=?,address=?,city=?,state=?,zip_code=?,phone=?,email=?,website=?,description=?,amenities=? WHERE id=?',
      [name, address, city, state, zip_code, phone, email, website, description,
       JSON.stringify(amenities || []), req.params.id]
    );
    const [[hotel]] = await db.query('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (!hotel) return res.status(404).json({ error: 'Hotel não encontrado' });
    res.json({ ...hotel, amenities: hotel.amenities || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/hotels/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const db    = await getDb();
    const [[rooms]] = await db.query('SELECT COUNT(*) as c FROM room_types WHERE hotel_id = ?', [req.params.id]);
    if (rooms.c > 0) return res.status(400).json({ error: 'Exclua os quartos antes de excluir o hotel' });
    const [[resv]]  = await db.query('SELECT COUNT(*) as c FROM reservations WHERE hotel_id = ?', [req.params.id]);
    if (resv.c  > 0) return res.status(400).json({ error: 'Cancele as reservas antes de excluir o hotel' });
    await db.execute('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    res.json({ message: 'Hotel excluído com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Quartos ───────────────────────────────────────────────────────────────────

router.get('/rooms', async (req, res) => {
  try {
    const db   = await getDb();
    const [rows] = await db.query(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id ORDER BY rt.created_at DESC');
    res.json(await roomsWithImages(db, rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});


router.get('/rooms/all', requireAuth, async (req, res) => {
  try {
    const db   = await getDb();
    const [rows] = await db.query(
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
    await db.execute('UPDATE room_types SET is_active=? WHERE id=?', [Number(is_active), req.params.id]);
    const [[room]] = await db.query('SELECT rt.*, h.name as hotel_name FROM room_types rt LEFT JOIN hotels h ON rt.hotel_id = h.id WHERE rt.id=?', [req.params.id]);
    res.json(room);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const db   = await getDb();
    const [rows] = await db.query(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id WHERE rt.hotel_id = ?',
      [req.params.hotelId]);
    res.json(await roomsWithImages(db, rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/rooms/:id/availability', async (req, res) => {
  try {
    const { check_in, check_out } = req.query;
    const db = await getDb();
    const [[room]] = await db.query('SELECT total_units, max_occupancy, is_active FROM room_types WHERE id = ?', [req.params.id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
    
    if (!check_in || !check_out) {
      return res.json({ total_units: room.total_units || 1, available_units: room.total_units || 1 });
    }
    
    const [[booked]] = await db.query(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > NOW() - INTERVAL 30 MINUTE)) AND check_in_date < ? AND check_out_date > ?",
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
    const [reservations] = await db.query(
      "SELECT check_in_date, check_out_date FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > NOW() - INTERVAL 30 MINUTE)) AND check_out_date >= CURDATE()",
      [req.params.id]
    );
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
    const [[room]] = await db.query(
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
    const [r]  = await db.execute(
      'INSERT INTO room_types (hotel_id,name,description,size_sqm,bed_type,bed_count,max_occupancy,amenities,bathroom_type,smoking_allowed,price_per_night,is_active,stripe_price_id,total_units) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, name, description, size_sqm, bed_type, bed_count, max_occupancy,
       JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active !== undefined ? is_active : 1, req.body.stripe_price_id || null, total_units || 1]
    );
    const [[room]] = await db.query(
      'SELECT rt.*, h.name as hotel_name FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id WHERE rt.id = ?',
      [r.insertId]);
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
    
    const [[current]] = await db.query('SELECT * FROM room_types WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Quarto não encontrado' });
    
    await db.execute(
      'UPDATE room_types SET hotel_id=?,name=?,description=?,size_sqm=?,bed_type=?,bed_count=?,max_occupancy=?,amenities=?,bathroom_type=?,smoking_allowed=?,price_per_night=?,is_active=?,stripe_price_id=?,total_units=? WHERE id=?',
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
    const [[room]] = await db.query(
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
    const [[resv]] = await db.query('SELECT COUNT(*) as c FROM reservations WHERE room_type_id = ?', [req.params.id]);
    if (resv.c > 0) return res.status(400).json({ error: 'Cancele as reservas antes de excluir o quarto' });
    await db.execute('DELETE FROM room_types WHERE id = ?', [req.params.id]);
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
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const isAdmin = token && token === process.env.ADMIN_SECRET_TOKEN;
  if (!isAdmin && !req.query.guest_email) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
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
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-reservations', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.query(reservationJoin + ' ORDER BY r.created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reservations/:id', async (req, res) => {
  try {
    const db = await getDb();
    const [[r]]  = await db.query(reservationJoin + ' WHERE r.id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    
    const token = req.headers['authorization']?.replace('Bearer ', '');
    const isAdmin = token && token === process.env.ADMIN_SECRET_TOKEN;
    if (!isAdmin) {
      const guestEmail = req.query.email || req.query.guest_email || req.headers['x-guest-email'];
      const sessionId = req.query.session_id;
      const validSession = sessionId && r.stripe_payment_intent_id;
      if (!validSession && (!guestEmail || r.guest_email.toLowerCase() !== String(guestEmail).toLowerCase())) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reservations/:id/request-cancellation', async (req, res) => {
  try {
    const { reason, guest_email } = req.body;
    if (!guest_email) return res.status(400).json({ error: 'Email obrigatório para validação' });

    const db = await getDb();
    const [[reservation]] = await db.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);

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

    const [[existing]] = await db.query("SELECT id FROM refund_requests WHERE reservation_id=? AND status='pending'", [req.params.id]);
    if (existing) {
      return res.status(400).json({ error: 'Já existe uma solicitação de cancelamento pendente para esta reserva' });
    }

    const checkIn = new Date(reservation.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    const freeCancellation = hoursUntilCheckIn >= 24;

    const [ins] = await db.execute(
      'INSERT INTO refund_requests (reservation_id, reason, status, refund_type, refund_amount) VALUES (?,?,?,?,?)',
      [req.params.id, reason || 'Solicitação de cancelamento pelo hóspede', 'pending', freeCancellation ? 'full' : 'none', freeCancellation ? reservation.total_amount : 0]
    );

    res.status(201).json({
      ok: true, request_id: ins.insertId, free_cancellation: freeCancellation, hours_until_checkin: Math.round(hoursUntilCheckIn),
      message: freeCancellation ? 'Solicitação registrada. Você está dentro do prazo de cancelamento gratuito. Nossa equipe processará em breve.' : 'Solicitação registrada. Você está fora do prazo de cancelamento gratuito (24h). Nossa equipe analisará sua solicitação.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reservations/:id/cancel', async (req, res) => {
  try {
    const db = await getDb();
    const [[reservation]] = await db.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    
    if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reserva já cancelada' });
    }
    
    const checkIn = new Date(reservation.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const FREE_CANCEL_HOURS = 24;
    const canCancelFree = hoursUntilCheckIn >= FREE_CANCEL_HOURS;
    
    await db.execute("UPDATE reservations SET status='cancelled' WHERE id=?", [req.params.id]);
    
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
    const [[reservation]] = await db.query('SELECT id, check_in_date, status FROM reservations WHERE id = ?', [req.params.id]);
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
  const { hotel_id, room_type_id, guest_name, guest_email, guest_phone,
          guest_document, check_in_date, check_out_date, number_of_guests,
          special_requests, status = 'pending' } = req.body;
  const iKey = req.headers['idempotency-key'];
  
  let connection;
  try {
    const db = await getDb();

    if (iKey) {
      const [[cached]] = await db.query('SELECT * FROM idempotency_keys WHERE `key` = ?', [iKey]);
      if (cached) return res.status(cached.status_code).json(JSON.parse(cached.response));
    }

    const today = new Date().toISOString().split('T')[0];
    if (check_in_date < today) return res.status(400).json({ error: 'Data de check-in não pode ser no passado' });

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[room]] = await connection.query('SELECT price_per_night, total_units, max_occupancy FROM room_types WHERE id = ?', [room_type_id]);
    if (!room) { await connection.rollback(); return res.status(404).json({ error: 'Quarto não encontrado' }); }

    const totalUnits = room.total_units || 1;
    const [[conflict]] = await connection.query(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > NOW() - INTERVAL 30 MINUTE)) AND check_in_date < ? AND check_out_date > ? FOR UPDATE",
      [room_type_id, check_out_date, check_in_date]);
    if (conflict.c >= totalUnits) { await connection.rollback(); return res.status(409).json({ error: 'Não há unidades disponíveis para as datas selecionadas' }); }

    const nights = Math.max(1, Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000));
    const total  = room.price_per_night * nights;

    const [ins] = await connection.execute(
      'INSERT INTO reservations (hotel_id,room_type_id,guest_name,guest_email,guest_phone,guest_document,check_in_date,check_out_date,number_of_guests,total_amount,special_requests,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, room_type_id, guest_name, guest_email, guest_phone,
        guest_document, check_in_date, check_out_date, number_of_guests, total, special_requests, status]
    );

    const [[newRes]] = await connection.query(reservationJoin + ' WHERE r.id = ?', [ins.insertId]);

    if (iKey) await connection.execute(
      'INSERT INTO idempotency_keys (`key`,response,status_code) VALUES (?,?,?)',
      [iKey, JSON.stringify(newRes), 201]);

    await connection.commit();
    res.status(201).json(newRes);
  } catch (err) { 
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message }); 
  } finally {
    if (connection) connection.release();
  }
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
    await db.execute(
      'UPDATE reservations SET hotel_id=COALESCE(?,hotel_id),room_type_id=COALESCE(?,room_type_id),guest_name=COALESCE(?,guest_name),guest_email=COALESCE(?,guest_email),guest_phone=COALESCE(?,guest_phone),guest_document=COALESCE(?,guest_document),check_in_date=COALESCE(?,check_in_date),check_out_date=COALESCE(?,check_out_date),number_of_guests=COALESCE(?,number_of_guests),total_amount=COALESCE(?,total_amount),special_requests=COALESCE(?,special_requests),status=COALESCE(?,status) WHERE id=?',
      [hotel_id, room_type_id, guest_name, guest_email, guest_phone,
       guest_document, check_in_date, check_out_date, number_of_guests,
       total_amount, special_requests, status, req.params.id]
    );
    const [[r]] = await db.query(reservationJoin + ' WHERE r.id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


router.patch('/reservations/:id/cancel-pending', async (req, res) => {
  try {
    const db = await getDb();
    const [[r]] = await db.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Nao encontrada' });
    if (r.status !== 'pending') return res.json({ message: 'Reserva nao esta pendente', status: r.status });
    await db.execute("UPDATE reservations SET status='cancelled' WHERE id=?", [req.params.id]);
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
    await db.execute('UPDATE reservations SET status=? WHERE id=?', [status, req.params.id]);
    const [[r]] = await db.query(reservationJoin + ' WHERE r.id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/reservations/:id', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const db = await getDb();
    await db.execute('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reserva excluída com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contato ───────────────────────────────────────────────────────────────────

router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const db = await getDb();
    await db.execute("INSERT INTO contacts (name,email,message) VALUES (?,?,?)", [name, email, message]);
    res.json({ message: 'Mensagem recebida com sucesso!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/contacts', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Chat ──────────────────────────────────────────────────────────────────────

router.get('/admin/chat-threads', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.query(`
      SELECT DISTINCT r.id as reservation_id, r.guest_name, r.guest_email, h.name as hotel_name,
        (SELECT content    FROM messages m2 WHERE m2.reservation_id=r.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m2 WHERE m2.reservation_id=r.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*)   FROM messages m2 WHERE m2.reservation_id=r.id AND m2.read=0 AND m2.sender_role='guest') as unread_count
      FROM reservations r
      JOIN messages m ON r.id = m.reservation_id
      JOIN hotels h   ON r.hotel_id = h.id
      ORDER BY last_message_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/chat/:reservationId', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.query(
      'SELECT * FROM messages WHERE reservation_id=? ORDER BY created_at ASC',
      [req.params.reservationId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/chat/:reservationId', async (req, res) => {
  try {
    const { content, sender_role } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Mensagem vazia' });
    const role = ['admin', 'guest'].includes(sender_role) ? sender_role : 'guest';
    const db = await getDb();
    const [r]  = await db.execute(
      'INSERT INTO messages (reservation_id,sender_role,content) VALUES (?,?,?)',
      [req.params.reservationId, role, content.trim()]
    );
    res.status(201).json({
      id: r.insertId,
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
    await db.execute(
      "UPDATE messages SET `read`=1 WHERE reservation_id=? AND sender_role='guest'",
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

    const [[room]] = await db.query('SELECT * FROM room_types WHERE id = ?', [room_type_id]);
    if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });

    const totalUnits = room.total_units || 1;
    const [[conflict]] = await db.query(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND (status='confirmed' OR (status='pending' AND created_at > NOW() - INTERVAL 30 MINUTE)) AND check_in_date < ? AND check_out_date > ?",
      [room_type_id, check_out_date, check_in_date]
    );
    if (conflict.c >= totalUnits) return res.status(409).json({ error: 'Não há unidades disponíveis para as datas selecionadas' });

    const nights = Math.max(1, Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000));
    const totalAmount = room.price_per_night * nights;

    const [ins] = await db.execute(
      'INSERT INTO reservations (hotel_id,room_type_id,guest_name,guest_email,guest_phone,guest_document,check_in_date,check_out_date,number_of_guests,total_amount,special_requests,status,payment_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, room_type_id, guest_name, guest_email, guest_phone, guest_document,
       check_in_date, check_out_date, number_of_guests, totalAmount, special_requests || '', 'pending', 'pending']
    );
    const reservationId = ins.insertId;

    const baseUrl = (process.env.FRONTEND_URL || 'https://centerplazahotel.com.br').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
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

    await db.execute(
      'UPDATE reservations SET stripe_payment_intent_id=? WHERE id=?',
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
        await db.execute(
          "UPDATE reservations SET status='confirmed', payment_status='paid' WHERE id=?",
          [reservationId]
        );
        console.log('✅ Reserva confirmada via checkout:', reservationId);
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const reservationId = session.metadata?.reservation_id;
      if (reservationId) {
        await db.execute(
          "UPDATE reservations SET status='cancelled' WHERE id=?",
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
    const [[r]] = await db.query(
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
    const [requests] = await db.query(`
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
  let connection;
  try {
    const { refund_type, custom_amount } = req.body;
    const db = await getDb();

    const [[request]] = await db.query('SELECT * FROM refund_requests WHERE id = ?', [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Solicitação já processada' });

    const [[reservation]] = await db.query('SELECT * FROM reservations WHERE id = ?', [request.reservation_id]);
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

    connection = await db.getConnection();
    await connection.beginTransaction();
    
    await connection.execute(
      `UPDATE refund_requests SET status='approved', refund_type=?, refund_amount=?, approved_by='admin', approved_at=CURRENT_TIMESTAMP, stripe_refund_id=?, stripe_refund_status=? WHERE id=?`,
      [finalRefundType, refundAmount, stripeRefundId, stripeRefundStatus, req.params.id]
    );
    const newPaymentStatus = finalRefundType === 'none' ? 'paid' : finalRefundType === 'partial' ? 'partially_refunded' : 'refunded';
    await connection.execute("UPDATE reservations SET status='cancelled', payment_status=? WHERE id=?", [newPaymentStatus, request.reservation_id]);
    await connection.commit();
    
    res.json({ ok: true, refund_type: finalRefundType, refund_amount: refundAmount, stripe_refund_id: stripeRefundId, stripe_refund_status: stripeRefundStatus, message: finalRefundType === 'none' ? 'Reserva cancelada sem reembolso.' : `Reembolso de R$ ${refundAmount.toFixed(2)} processado com sucesso.` });
  } catch (err) { 
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message }); 
  } finally {
    if (connection) connection.release();
  }
});

router.post('/refund-requests/:id/reject', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { reason } = req.body;
    const db = await getDb();
    const [[request]] = await db.query('SELECT * FROM refund_requests WHERE id = ?', [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Solicitação já processada' });

    await db.execute("UPDATE refund_requests SET status='rejected', rejected_reason=?, approved_at=CURRENT_TIMESTAMP WHERE id=?", [reason || 'Rejeitado pelo administrador', req.params.id]);
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
  .then(() => console.log('✅ Banco de dados MySQL pronto'))
  .catch((err) => {
    console.error('❌ Falha ao inicializar banco MySQL:', err);
    dbInitializationError = err;
  });

module.exports = router;