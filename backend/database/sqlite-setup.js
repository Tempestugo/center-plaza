import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco SQLite
const dbPath = path.join(__dirname, 'centerplaza.db');

async function setupSQLiteDatabase() {
  try {
    console.log('🔄 Configurando banco de dados SQLite local...');
    
    // Abrir conexão com SQLite
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Configurar encoding UTF-8
    await db.exec('PRAGMA encoding = "UTF-8"');
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    
    console.log('✅ Conectado ao banco SQLite com encoding UTF-8!');
    
    // Criar tabela de hotéis
    await db.exec(`
      CREATE TABLE IF NOT EXISTS hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
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
    
    // Criar tabela de tipos de quartos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        size_sqm REAL,
        bed_type TEXT,
        bed_count INTEGER DEFAULT 1,
        max_occupancy INTEGER DEFAULT 2,
        amenities TEXT,
        bathroom_type TEXT,
        smoking_allowed BOOLEAN DEFAULT 0,
        price_per_night REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id)
      )
    `);
    
    // Criar tabela de imagens dos quartos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS room_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_type_id INTEGER NOT NULL,
        image_data TEXT NOT NULL,
        image_type TEXT NOT NULL,
        display_order INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
      )
    `);
    
    // Criar tabela de reservas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        room_type_id INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT,
        guest_document TEXT,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        number_of_guests INTEGER NOT NULL DEFAULT 1,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        special_requests TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id),
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
      )
    `);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
    // Inserir dados iniciais
    const hotelExists = await db.get('SELECT id FROM hotels WHERE name = ?', ['Center Plaza Hotel']);
    
    if (!hotelExists) {
      console.log('🔄 Inserindo dados iniciais...');
      
      // Inserir hotel
      const hotelResult = await db.run(`
        INSERT INTO hotels (
          name, address, city, state, zip_code, phone, email, website, description, amenities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Center Plaza Hotel',
        'Rua das Flores, 123 - Centro',
        'São Paulo',
        'SP',
        '01234-567',
        '(11) 1234-5678',
        'contato@centerplaza.com.br',
        'https://centerplaza.com.br',
        'Hotel moderno e confortável localizado no centro da cidade, oferecendo excelente localização e serviços de qualidade.',
        JSON.stringify([
          'Wi-Fi gratuito', 'Ar-condicionado', 'TV a cabo', 'Frigobar', 'Cofre',
          'Serviço de quarto 24h', 'Estacionamento', 'Academia', 'Piscina',
          'Restaurante', 'Bar', 'Lavanderia', 'Concierge', 'Transfer aeroporto'
        ])
      ]);
      
      const hotelId = hotelResult.lastID;
      
      // Inserir tipos de quartos
      const roomTypes = [
        {
          name: 'Quarto Individual',
          description: 'Quarto confortável ideal para uma pessoa, com cama de solteiro e todas as comodidades necessárias.',
          size_sqm: 15.00,
          bed_type: 'Cama de Solteiro',
          bed_count: 1,
          max_occupancy: 1,
          price_per_night: 120.00
        },
        {
          name: 'Quarto Duplo',
          description: 'Quarto espaçoso com cama de casal, perfeito para casais ou pessoas que preferem mais espaço.',
          size_sqm: 20.00,
          bed_type: 'Cama de Casal',
          bed_count: 1,
          max_occupancy: 2,
          price_per_night: 180.00
        },
        {
          name: 'Quarto com 2 Camas de Solteiro',
          description: 'Quarto com duas camas de solteiro, ideal para amigos ou familiares.',
          size_sqm: 22.00,
          bed_type: 'Cama de Solteiro',
          bed_count: 2,
          max_occupancy: 2,
          price_per_night: 160.00
        },
        {
          name: 'Quarto Triplo',
          description: 'Quarto amplo com cama de casal e uma cama de solteiro, ideal para famílias pequenas.',
          size_sqm: 25.00,
          bed_type: 'Cama de Casal + Cama de Solteiro',
          bed_count: 2,
          max_occupancy: 3,
          price_per_night: 220.00
        },
        {
          name: 'Quarto Triplo Standard',
          description: 'Quarto econômico com três camas de solteiro, perfeito para grupos de amigos ou famílias.',
          size_sqm: 24.00,
          bed_type: 'Cama de Solteiro',
          bed_count: 3,
          max_occupancy: 3,
          price_per_night: 200.00
        }
      ];
      
      for (const room of roomTypes) {
        await db.run(`
          INSERT INTO room_types (
            hotel_id, name, description, size_sqm, bed_type, bed_count, 
            max_occupancy, bathroom_type, smoking_allowed, price_per_night, amenities
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          hotelId,
          room.name,
          room.description,
          room.size_sqm,
          room.bed_type,
          room.bed_count,
          room.max_occupancy,
          'Banheiro privativo com chuveiro',
          0,
          room.price_per_night,
          JSON.stringify([
            'Wi-Fi gratuito', 'Ar-condicionado', 'TV LCD', 'Frigobar',
            'Cofre digital', 'Mesa de trabalho', 'Telefone', 'Secador de cabelo'
          ])
        ]);
      }
      
      console.log('✅ Dados iniciais inseridos com sucesso!');
    } else {
      console.log('ℹ️  Dados já existem no banco');
    }
    
    // Verificar dados
    const hotelCount = await db.get('SELECT COUNT(*) as count FROM hotels');
    const roomCount = await db.get('SELECT COUNT(*) as count FROM room_types');
    
    console.log(`📊 Total de hotéis: ${hotelCount.count}`);
    console.log(`📊 Total de tipos de quartos: ${roomCount.count}`);
    
    await db.close();
    console.log('🎉 Configuração do banco SQLite concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
    process.exit(1);
  }
}

// Executar setup
setupSQLiteDatabase();