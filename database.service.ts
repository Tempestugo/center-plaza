import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Database, open } from 'sqlite';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database;

  async onModuleInit() {
    await this.initializeDatabase();
  }

  async onModuleDestroy() {
    if (this.db) {
      await this.db.close();
    }
  }

  private async initializeDatabase() {
    const dbDir = path.join(process.cwd(), 'api', 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'centerplaza.db');

    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await this.db.exec('PRAGMA foreign_keys = ON');
    await this.initInfraTables();
    console.log('✅ Banco de dados SQLite inicializado.');
  }

  // Métodos auxiliares para executar queries
  async run(sql: string, params: any[] = []) {
    return this.db.run(sql, params);
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T> {
    return this.db.get(sql, params);
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.all(sql, params);
  }

  private async initInfraTables() {
    // Migração da lógica de criação de tabelas do sqlite-server.js
    await this.db.run(`
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

    await this.db.run(`
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

    await this.db.run(`
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

    await this.db.run(`
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

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        response TEXT,
        status_code INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.run(`
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

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
      )
    `);

    // Seed inicial se necessário (Admin)
    const adminUser = await this.db.get("SELECT * FROM users WHERE username = 'admin@centerplaza.com'");
    if (!adminUser) {
      await this.db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin@centerplaza.com', 'admin', 'admin']);
    }
  }
}