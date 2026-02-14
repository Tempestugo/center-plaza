import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do banco SQLite
const dbPath = path.join(__dirname, 'centerplaza.db');

let db = null;

// Função para obter conexão com SQLite
export async function getConnection() {
  if (!db) {
    try {
      // Carregamento preguiçoso (lazy load) do sqlite3 para evitar crash na inicialização
      // se o binário não for compatível com o sistema (comum em deploys)
      let sqlite3;
      try {
        sqlite3 = require('sqlite3');
      } catch (e) {
        throw new Error(`Falha ao carregar módulo sqlite3: ${e.message}. Tente rodar 'npm rebuild sqlite3'.`);
      }

      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      
      // Configurar encoding UTF-8
      await db.exec('PRAGMA encoding = "UTF-8"');
      await db.exec('PRAGMA journal_mode = WAL');
      await db.exec('PRAGMA synchronous = NORMAL');
      
      console.log(`✅ Conectado ao banco SQLite em: ${dbPath} (Driver carregado)`);
    } catch (error) {
      console.error('❌ Erro ao conectar com SQLite:', error);
      throw error;
    }
  }
  return db;
}

// Função para testar conexão
export async function testConnection() {
  try {
    const connection = await getConnection();
    await connection.get('SELECT 1');
    console.log('✅ Conexão SQLite testada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão SQLite:', error);
    return false;
  }
}

// Função para executar queries
export async function executeQuery(sql, params = []) {
  try {
    const connection = await getConnection();
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return await connection.all(sql, params);
    } else {
      return await connection.run(sql, params);
    }
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    throw error;
  }
}

// Função para fechar conexão
export async function closeConnection() {
  if (db) {
    await db.close();
    db = null;
    console.log('✅ Conexão SQLite fechada');
  }
}

// Exportar como default para compatibilidade
export default {
  getConnection,
  testConnection,
  executeQuery,
  closeConnection
};