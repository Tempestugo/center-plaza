import express from 'express';
import multer from 'multer';

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  }
});

const router = express.Router();

// GET /api/hotels - Buscar todos os hotéis
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM hotels ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar hotéis',
      message: error.message 
    });
  }
});

// GET /api/hotels/:id - Buscar hotel por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await req.db.execute(
      'SELECT * FROM hotels WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Hotel não encontrado' 
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar hotel:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar hotel',
      message: error.message 
    });
  }
});

// POST /api/hotels - Criar novo hotel
router.post('/', async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      description,
      amenities
    } = req.body;

    // Validação básica
    if (!name || !address || !city) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: name, address, city' 
      });
    }

    const [result] = await req.db.execute(
      `INSERT INTO hotels (
        name, address, city, state, zip_code, phone, email, 
        website, description, amenities, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        address,
        city,
        state || null,
        zipCode || null,
        phone || null,
        email || null,
        website || null,
        description || null,
        JSON.stringify(amenities || [])
      ]
    );

    const hotelId = result.insertId;
    
    // Buscar o hotel criado para retornar
    const [newHotel] = await req.db.execute(
      'SELECT * FROM hotels WHERE id = ?',
      [hotelId]
    );

    res.status(201).json({
      message: 'Hotel criado com sucesso',
      hotel: newHotel[0]
    });
  } catch (error) {
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({ 
      error: 'Erro ao criar hotel',
      message: error.message 
    });
  }
});

// PUT /api/hotels/:id - Atualizar hotel
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      description,
      amenities
    } = req.body;

    // Verificar se hotel existe
    const [existing] = await req.db.execute(
      'SELECT id FROM hotels WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        error: 'Hotel não encontrado' 
      });
    }

    await req.db.execute(
      `UPDATE hotels SET 
        name = ?, address = ?, city = ?, state = ?, zip_code = ?,
        phone = ?, email = ?, website = ?, description = ?, 
        amenities = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        address,
        city,
        state || null,
        zipCode || null,
        phone || null,
        email || null,
        website || null,
        description || null,
        JSON.stringify(amenities || []),
        id
      ]
    );

    // Buscar o hotel atualizado
    const [updatedHotel] = await req.db.execute(
      'SELECT * FROM hotels WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Hotel atualizado com sucesso',
      hotel: updatedHotel[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar hotel:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar hotel',
      message: error.message 
    });
  }
});

// DELETE /api/hotels/:id - Deletar hotel
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se hotel existe
    const [existing] = await req.db.execute(
      'SELECT id FROM hotels WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        error: 'Hotel não encontrado' 
      });
    }

    // Deletar imagens relacionadas primeiro
    await req.db.execute(
      'DELETE FROM room_images WHERE room_type_id IN (SELECT id FROM room_types WHERE hotel_id = ?)',
      [id]
    );
    
    // Deletar tipos de quartos
    await req.db.execute(
      'DELETE FROM room_types WHERE hotel_id = ?',
      [id]
    );
    
    // Deletar hotel
    await req.db.execute(
      'DELETE FROM hotels WHERE id = ?',
      [id]
    );

    res.json({ 
      message: 'Hotel deletado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao deletar hotel:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar hotel',
      message: error.message 
    });
  }
});

export default router;