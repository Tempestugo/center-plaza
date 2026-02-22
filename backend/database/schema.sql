-- Script SQL para criar as tabelas do sistema Center Plaza
-- Banco de dados: centerplaza

-- Tabela de hotéis
CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  amenities JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tipos de quartos
CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  size_sqm DECIMAL(8,2),
  bed_type VARCHAR(100),
  bed_count INT DEFAULT 1,
  max_occupancy INT DEFAULT 2,
  total_rooms INT DEFAULT 5,
  amenities JSON,
  bathroom_type VARCHAR(100),
  smoking_allowed BOOLEAN DEFAULT 0,
  price_per_night DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Tabela de imagens dos quartos
CREATE TABLE IF NOT EXISTS room_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_type_id INT NOT NULL,
  image_data LONGTEXT NOT NULL, -- Base64 encoded image
  image_type VARCHAR(50) NOT NULL, -- MIME type (image/jpeg, image/png, etc.)
  display_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- Inserir dados iniciais do Center Plaza Hotel
INSERT INTO hotels (
  name, 
  address, 
  city, 
  state, 
  zip_code, 
  phone, 
  email, 
  website, 
  description, 
  amenities
) VALUES (
  'Center Plaza Hotel',
  'Rua das Flores, 123 - Centro',
  'São Paulo',
  'SP',
  '01234-567',
  '(11) 1234-5678',
  'contato@centerplaza.com.br',
  'https://centerplaza.com.br',
  'Hotel moderno e confortável localizado no centro da cidade, oferecendo excelente localização e serviços de qualidade.',
  JSON_ARRAY(
    'Wi-Fi gratuito',
    'Ar-condicionado',
    'TV a cabo',
    'Frigobar',
    'Cofre',
    'Serviço de quarto 24h',
    'Estacionamento',
    'Academia',
    'Piscina',
    'Restaurante',
    'Bar',
    'Lavanderia',
    'Concierge',
    'Transfer aeroporto'
  )
);

-- Inserir tipos de quartos padrão do Center Plaza
INSERT INTO room_types (
  hotel_id,
  name,
  description,
  size_sqm,
  bed_type,
  bed_count,
  max_occupancy,
  total_rooms,
  amenities,
  bathroom_type,
  smoking_allowed,
  price_per_night
) 
SELECT 
  h.id,
  'Quarto Individual',
  'Quarto confortável ideal para uma pessoa, com cama de solteiro e todas as comodidades necessárias.',
  15.00,
  'Cama de Solteiro',
  1,
  1,
  10,
  JSON_ARRAY(
    'Wi-Fi gratuito',
    'Ar-condicionado',
    'TV LCD 32"',
    'Frigobar',
    'Cofre digital',
    'Mesa de trabalho',
    'Telefone',
    'Secador de cabelo'
  ),
  'Banheiro privativo com chuveiro',
  0,
  120.00
FROM hotels h WHERE h.name = 'Center Plaza Hotel';

INSERT INTO room_types (
  hotel_id,
  name,
  description,
  size_sqm,
  bed_type,
  bed_count,
  max_occupancy,
  total_rooms,
  amenities,
  bathroom_type,
  smoking_allowed,
  price_per_night
) 
SELECT 
  h.id,
  'Quarto Duplo',
  'Quarto espaçoso com cama de casal, perfeito para casais ou pessoas que preferem mais espaço.',
  20.00,
  'Cama de Casal',
  1,
  2,
  15,
  JSON_ARRAY(
    'Wi-Fi gratuito',
    'Ar-condicionado',
    'TV LCD 42"',
    'Frigobar',
    'Cofre digital',
    'Mesa de trabalho',
    'Telefone',
    'Secador de cabelo',
    'Poltrona',
    'Varanda'
  ),
  'Banheiro privativo com chuveiro e banheira',
  0,
  180.00
FROM hotels h WHERE h.name = 'Center Plaza Hotel';

INSERT INTO room_types (
  hotel_id,
  name,
  description,
  size_sqm,
  bed_type,
  bed_count,
  max_occupancy,
  total_rooms,
  amenities,
  bathroom_type,
  smoking_allowed,
  price_per_night
) 
SELECT 
  h.id,
  'Quarto com 2 Camas de Solteiro',
  'Quarto com duas camas de solteiro, ideal para amigos ou familiares.',
  22.00,
  'Cama de Solteiro',
  2,
  2,
  8,
  JSON_ARRAY(
    'Wi-Fi gratuito',
    'Ar-condicionado',
    'TV LCD 42"',
    'Frigobar',
    'Cofre digital',
    'Mesa de trabalho',
    'Telefone',
    'Secador de cabelo',
    'Armário amplo'
  ),
  'Banheiro privativo com chuveiro',
  0,
  160.00
FROM hotels h WHERE h.name = 'Center Plaza Hotel';

INSERT INTO room_types (
  hotel_id,
  name,
  description,
  size_sqm,
  bed_type,
  bed_count,
  max_occupancy,
  total_rooms,
  amenities,
  bathroom_type,
  smoking_allowed,
  price_per_night
) 
SELECT 
  h.id,
  'Quarto Triplo',
  'Quarto amplo com cama de casal e uma cama de solteiro, ideal para famílias pequenas.',
  25.00,
  'Cama de Casal + Cama de Solteiro',
  2,
  3,
  5,
  JSON_ARRAY(
    'Wi-Fi gratuito',
    'Ar-condicionado',
    'TV LCD 42"',
    'Frigobar',
    'Cofre digital',
    'Mesa de trabalho',
    'Telefone',
    'Secador de cabelo',
    'Poltrona',
    'Varanda',
    'Armário amplo'
  ),
  'Banheiro privativo com chuveiro e banheira',
  0,
  220.00
FROM hotels h WHERE h.name = 'Center Plaza Hotel';

INSERT INTO room_types (
  hotel_id,
  name,
  description,
  size_sqm,
  bed_type,
  bed_count,
  max_occupancy,
  total_rooms,
  amenities,
  bathroom_type,
  smoking_allowed,
  price_per_night
) 
SELECT 
  h.id,
  'Quarto Triplo Standard',
  'Quarto econômico com três camas de solteiro, perfeito para grupos de amigos ou famílias.',
  24.00,
  'Cama de Solteiro',
  3,
  3,
  5,
  JSON_ARRAY(
    'Wi-Fi gratuito',
    'Ar-condicionado',
    'TV LCD 32"',
    'Frigobar',
    'Cofre digital',
    'Mesa de trabalho',
    'Telefone',
    'Secador de cabelo'
  ),
  'Banheiro privativo com chuveiro',
  0,
  200.00
FROM hotels h WHERE h.name = 'Center Plaza Hotel';

-- Criar tabela de reservas
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotel_id INT NOT NULL,
    room_type_id INT NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    guest_document VARCHAR(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_guests INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);
-- Verificar se as tabelas foram criadas corretamente
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT COUNT(*) as total_hotels FROM hotels;
SELECT COUNT(*) as total_room_types FROM room_types;
SELECT COUNT(*) as total_room_images FROM room_images;
SHOW TABLES;