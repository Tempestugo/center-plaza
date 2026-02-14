import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Configuração da conexão MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Função para inicializar a conexão com o banco
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Middleware para verificar conexão com banco
const checkDatabase = async (req, res, next) => {
  try {
    if (!pool) {
      throw new Error('Pool de conexão não inicializado');
    }
    req.db = pool;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro de conexão com banco de dados',
      message: error.message 
    });
  }
};

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API do Center Plaza funcionando',
    timestamp: new Date().toISOString()
  });
});

// As rotas serão importadas dinamicamente na função startServer

// Inicializar servidor
async function startServer() {
  const dbConnected = await initializeDatabase();
  
  if (!dbConnected) {
    console.error('❌ Não foi possível conectar ao banco de dados. Servidor não iniciado.');
    process.exit(1);
  }
  
  try {
    // Importar rotas dinamicamente após conexão com banco
    console.log('📦 Importando rotas...');
    
    const hotelRoutes = await import('./routes/hotels.js');
    app.use('/api/hotels', checkDatabase, hotelRoutes.default);
    console.log('✅ Rotas de hotéis carregadas');
    
    const roomRoutes = await import('./routes/rooms.js');
    app.use('/api/rooms', checkDatabase, roomRoutes.default);
    console.log('✅ Rotas de quartos carregadas');
    
    const reservationRoutes = await import('./routes/reservations.js');
    app.use('/api/reservations', checkDatabase, reservationRoutes.default);
    console.log('✅ Rotas de reservas carregadas');
    
    // Middleware de tratamento de erros (após as rotas)
    app.use((error, req, res, next) => {
      console.error('Erro na API:', error);
      
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'Arquivo muito grande',
            message: 'O arquivo deve ter no máximo 5MB'
          });
        }
      }
      
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      });
    });
    
    // Rota 404 (deve ser a última)
    app.use('*', (req, res) => {
      res.status(404).json({ 
        error: 'Rota não encontrada',
        message: `A rota ${req.originalUrl} não existe` 
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao carregar rotas:', error.message);
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', async () => {
  console.log('🔄 Encerrando servidor...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Encerrando servidor...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

startServer();