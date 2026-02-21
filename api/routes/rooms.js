const express = require('express');
const multer = require('multer');

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Máximo 10 arquivos
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos JPEG, PNG e WebP são permitidos!'), false);
    }
  }
});

const router = express.Router();

// Middleware para tratar erros de upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 5MB' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Muitos arquivos. Máximo: 10 imagens' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Campo de arquivo inesperado' 
      });
    }
  }
  
  if (err.message.includes('Apenas arquivos')) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  
  next(err);
};

// GET /api/rooms - Buscar todos os tipos de quartos
router.get('/', async (req, res) => {
  try {
    const { hotel_id } = req.query;
    
    let query = `
      SELECT rt.*, h.name as hotel_name 
      FROM room_types rt 
      LEFT JOIN hotels h ON rt.hotel_id = h.id
    `;
    let params = [];
    
    if (hotel_id) {
      query += ' WHERE rt.hotel_id = ?';
      params.push(hotel_id);
    }
    
    query += ' ORDER BY rt.created_at DESC';
    
    const [rows] = await req.db.execute(query, params);
    
    // Buscar imagens para cada tipo de quarto
    for (let room of rows) {
      const [images] = await req.db.execute(
        'SELECT * FROM room_images WHERE room_type_id = ? ORDER BY display_order',
        [room.id]
      );
      room.images = images;
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar quartos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar quartos',
      message: error.message 
    });
  }
});

// GET /api/rooms/:id - Buscar tipo de quarto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await req.db.execute(
      `SELECT rt.*, h.name as hotel_name 
       FROM room_types rt 
       LEFT JOIN hotels h ON rt.hotel_id = h.id 
       WHERE rt.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Tipo de quarto não encontrado' 
      });
    }
    
    const room = rows[0];
    
    // Buscar imagens
    const [images] = await req.db.execute(
      'SELECT * FROM room_images WHERE room_type_id = ? ORDER BY display_order',
      [id]
    );
    room.images = images;
    
    res.json(room);
  } catch (error) {
    console.error('Erro ao buscar quarto:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar quarto',
      message: error.message 
    });
  }
});

// POST /api/rooms - Criar novo tipo de quarto
router.post('/', upload.array('images', 10), handleUploadError, async (req, res) => {
  const connection = await req.db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      hotel_id,
      name,
      description,
      size_sqm,
      bed_type,
      bed_count,
      max_occupancy,
      amenities,
      bathroom_type,
      smoking_allowed,
      price_per_night
    } = req.body;

    // Validação básica
    if (!hotel_id || !name) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Campos obrigatórios: hotel_id, name' 
      });
    }

    // Validar tipos de dados
    if (size_sqm && (isNaN(size_sqm) || size_sqm <= 0)) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Tamanho deve ser um número positivo' 
      });
    }

    if (bed_count && (isNaN(bed_count) || bed_count <= 0)) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Número de camas deve ser um número positivo' 
      });
    }

    if (max_occupancy && (isNaN(max_occupancy) || max_occupancy <= 0)) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Ocupação máxima deve ser um número positivo' 
      });
    }

    if (price_per_night && (isNaN(price_per_night) || price_per_night < 0)) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Preço deve ser um número não negativo' 
      });
    }

    // Verificar se hotel existe
    const [hotelExists] = await connection.execute(
      'SELECT id FROM hotels WHERE id = ?',
      [hotel_id]
    );
    
    if (hotelExists.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Hotel não encontrado' 
      });
    }

    // Inserir tipo de quarto
    const [result] = await connection.execute(
      `INSERT INTO room_types (
        hotel_id, name, description, size_sqm, bed_type, bed_count,
        max_occupancy, amenities, bathroom_type, smoking_allowed,
        price_per_night, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        hotel_id,
        name,
        description || null,
        size_sqm || null,
        bed_type || null,
        bed_count || 1,
        max_occupancy || 2,
        JSON.stringify(amenities || []),
        bathroom_type || null,
        smoking_allowed === 'true' || smoking_allowed === true ? 1 : 0,
        price_per_night || null
      ]
    );

    const roomTypeId = result.insertId;
    
    // Processar imagens se enviadas
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageData = file.buffer.toString('base64');
        
        await connection.execute(
          `INSERT INTO room_images (
            room_type_id, image_data, image_type, display_order, created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
          [roomTypeId, imageData, file.mimetype, i + 1]
        );
      }
    }
    
    await connection.commit();
    
    // Buscar o quarto criado com imagens
    const [newRoom] = await req.db.execute(
      `SELECT rt.*, h.name as hotel_name 
       FROM room_types rt 
       LEFT JOIN hotels h ON rt.hotel_id = h.id 
       WHERE rt.id = ?`,
      [roomTypeId]
    );
    
    const [images] = await req.db.execute(
      'SELECT * FROM room_images WHERE room_type_id = ? ORDER BY display_order',
      [roomTypeId]
    );
    newRoom[0].images = images;

    res.status(201).json({
      message: 'Tipo de quarto criado com sucesso',
      room: newRoom[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar quarto:', error);
    res.status(500).json({ 
      error: 'Erro ao criar quarto',
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

// PUT /api/rooms/:id - Atualizar tipo de quarto
router.put('/:id', upload.array('images', 10), handleUploadError, async (req, res) => {
  const connection = await req.db.getConnection();
  
  try {
    console.log(`🔄 PUT /api/rooms/${req.params.id} - Iniciando atualização`);
    console.log('📝 Body recebido:', req.body);
    console.log('📁 Arquivos recebidos:', req.files ? req.files.length : 0);
    
    await connection.beginTransaction();
    
    const { id } = req.params;
    const {
      name,
      description,
      size_sqm,
      bed_type,
      bed_count,
      max_occupancy,
      amenities,
      bathroom_type,
      smoking_allowed,
      price_per_night,
      remove_images
    } = req.body;
    
    // Validar campos obrigatórios
    if (!name || name.trim() === '') {
      console.log('❌ Erro de validação: nome é obrigatório');
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Nome do quarto é obrigatório' 
      });
    }

    // Verificar se quarto existe
    const [existing] = await connection.execute(
      'SELECT id FROM room_types WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      console.log(`❌ Quarto ${id} não encontrado`);
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Tipo de quarto não encontrado' 
      });
    }
    
    console.log(`✅ Quarto ${id} encontrado, prosseguindo com atualização`);

    // Validar dados numéricos
    if (size_sqm && (isNaN(parseFloat(size_sqm)) || parseFloat(size_sqm) <= 0)) {
      console.log('❌ Erro de validação: size_sqm inválido:', size_sqm);
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Tamanho deve ser um número positivo' 
      });
    }

    if (bed_count && (isNaN(parseInt(bed_count)) || parseInt(bed_count) <= 0)) {
      console.log('❌ Erro de validação: bed_count inválido:', bed_count);
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Número de camas deve ser um número positivo' 
      });
    }

    if (max_occupancy && (isNaN(parseInt(max_occupancy)) || parseInt(max_occupancy) <= 0)) {
      console.log('❌ Erro de validação: max_occupancy inválido:', max_occupancy);
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Ocupação máxima deve ser um número positivo' 
      });
    }

    if (price_per_night && (isNaN(parseFloat(price_per_night)) || parseFloat(price_per_night) < 0)) {
      console.log('❌ Erro de validação: price_per_night inválido:', price_per_night);
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Preço deve ser um número não negativo' 
      });
    }

    // Atualizar tipo de quarto
    console.log('🔄 Executando UPDATE na tabela room_types...');
    const updateResult = await connection.execute(
      `UPDATE room_types SET 
        name = ?, description = ?, size_sqm = ?, bed_type = ?, bed_count = ?,
        max_occupancy = ?, amenities = ?, bathroom_type = ?, smoking_allowed = ?,
        price_per_night = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        description || null,
        size_sqm || null,
        bed_type || null,
        bed_count || 1,
        max_occupancy || 2,
        JSON.stringify(amenities || []),
        bathroom_type || null,
        smoking_allowed === 'true' || smoking_allowed === true ? 1 : 0,
        price_per_night || null,
        id
      ]
    );
    console.log('✅ UPDATE executado, linhas afetadas:', updateResult[0].affectedRows);
    
    // Remover imagens específicas se solicitado
    if (remove_images) {
      console.log('🗑️ Processando remoção de imagens:', remove_images);
      let imagesToRemove = [];
      
      if (typeof remove_images === 'string') {
        try {
          imagesToRemove = JSON.parse(remove_images);
        } catch (e) {
          console.log('❌ Erro ao fazer parse do remove_images:', e);
        }
      } else if (Array.isArray(remove_images)) {
        imagesToRemove = remove_images;
      }
      
      if (imagesToRemove.length > 0) {
        console.log('🗑️ Removendo imagens:', imagesToRemove);
        for (const imageId of imagesToRemove) {
          await connection.execute(
            'DELETE FROM room_images WHERE id = ? AND room_type_id = ?',
            [imageId, id]
          );
        }
      }
    }
    
    // Adicionar novas imagens se enviadas
    if (req.files && req.files.length > 0) {
      // Buscar próximo display_order
      const [maxOrder] = await connection.execute(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM room_images WHERE room_type_id = ?',
        [id]
      );
      
      let nextOrder = maxOrder[0].max_order + 1;
      
      for (const file of req.files) {
        const imageData = file.buffer.toString('base64');
        
        await connection.execute(
          `INSERT INTO room_images (
            room_type_id, image_data, image_type, display_order, created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
          [id, imageData, file.mimetype, nextOrder++]
        );
      }
    }
    
    console.log('💾 Fazendo commit da transação...');
    await connection.commit();
    console.log('✅ Commit realizado com sucesso');
    
    // Buscar o quarto atualizado com imagens
    console.log('🔍 Buscando dados atualizados do quarto...');
    const [updatedRoom] = await req.db.execute(
      `SELECT rt.*, h.name as hotel_name 
       FROM room_types rt 
       LEFT JOIN hotels h ON rt.hotel_id = h.id 
       WHERE rt.id = ?`,
      [id]
    );
    
    const [images] = await req.db.execute(
      'SELECT * FROM room_images WHERE room_type_id = ? ORDER BY display_order',
      [id]
    );
    updatedRoom[0].images = images;
    
    console.log('📤 Enviando resposta de sucesso');
    res.json({
      message: 'Tipo de quarto atualizado com sucesso',
      room: updatedRoom[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar quarto:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar quarto',
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/rooms/:id - Deletar tipo de quarto
router.delete('/:id', async (req, res) => {
  const connection = await req.db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Verificar se quarto existe
    const [existing] = await connection.execute(
      'SELECT id FROM room_types WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Tipo de quarto não encontrado' 
      });
    }

    // Deletar imagens primeiro
    await connection.execute(
      'DELETE FROM room_images WHERE room_type_id = ?',
      [id]
    );
    
    // Deletar tipo de quarto
    await connection.execute(
      'DELETE FROM room_types WHERE id = ?',
      [id]
    );
    
    await connection.commit();

    res.json({ 
      message: 'Tipo de quarto deletado com sucesso' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao deletar quarto:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar quarto',
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/rooms/:id/images/:imageId - Deletar imagem específica
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Verificar se imagem existe e pertence ao quarto
    const [existing] = await req.db.execute(
      'SELECT id FROM room_images WHERE id = ? AND room_type_id = ?',
      [imageId, id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        error: 'Imagem não encontrada' 
      });
    }

    await req.db.execute(
      'DELETE FROM room_images WHERE id = ? AND room_type_id = ?',
      [imageId, id]
    );

    res.json({ 
      message: 'Imagem deletada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar imagem',
      message: error.message 
    });
  }
});

module.exports = router;