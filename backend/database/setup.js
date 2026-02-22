const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  filename: path.join(__dirname, '../../centerplaza.db'),
  driver: sqlite3.Database
};

async function setupDatabase() {
  let db;
  
  try {
    console.log('🔄 Conectando ao banco de dados SQLite...');
    db = await open(dbConfig);
    console.log('✅ Conectado ao banco de dados!');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('🔄 Executando script SQL...');
    
    // SQLite executa o script completo
    await db.exec(sqlContent);
    console.log('✅ Script SQL executado com sucesso');
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas:');
    
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND (name='hotels' OR name='room_types' OR name='room_images')"
    );
    
    console.log('📋 Tabelas encontradas:', tables.map(t => t.name));
    
    // Verificar dados inseridos
    const hotelCount = await db.get('SELECT COUNT(*) as count FROM hotels');
    const roomCount = await db.get('SELECT COUNT(*) as count FROM room_types');
    const imageCount = await db.get('SELECT COUNT(*) as count FROM room_images');
    
    console.log('\n📊 Dados inseridos:');
    console.log(`   Hotéis: ${hotelCount.count}`);
    console.log(`   Tipos de quartos: ${roomCount.count}`);
    console.log(`   Imagens: ${imageCount.count}`);
    
    console.log('\n🎉 Banco de dados configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
      console.log('🔌 Conexão fechada.');
    }
  }
}

// Executar setup se chamado diretamente
setupDatabase();