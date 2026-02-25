#!/bin/bash

# Script para aplicar migrações no backend (Node.js + SQLite)
# Uso: bash patch-backend.sh

echo ">>> Iniciando patch do backend..."

# 1. Criar script de migração temporário
cat << 'EOF' > backend-migration.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Tenta localizar o banco de dados
const dbPath = path.resolve(__dirname, 'centerplaza.db');

if (!fs.existsSync(dbPath)) {
  console.error(`[Erro] Banco de dados não encontrado em: ${dbPath}`);
  process.exit(1);
}

console.log(`[Info] Conectando ao banco: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Adicionar coluna is_active
  db.run("ALTER TABLE room_types ADD COLUMN is_active INTEGER DEFAULT 1", (err) => {
    if (err && err.message.includes('duplicate column')) {
      console.log("[Info] Coluna 'is_active' já existe.");
    } else if (err) {
      console.error("[Erro] Falha ao adicionar 'is_active':", err.message);
    } else {
      console.log("[Sucesso] Coluna 'is_active' adicionada.");
    }
  });

  // Adicionar coluna room_number
  db.run("ALTER TABLE room_types ADD COLUMN room_number TEXT", (err) => {
    if (err && err.message.includes('duplicate column')) {
      console.log("[Info] Coluna 'room_number' já existe.");
    } else if (err) {
      console.error("[Erro] Falha ao adicionar 'room_number':", err.message);
    } else {
      console.log("[Sucesso] Coluna 'room_number' adicionada.");
    }
  });
});

db.close(() => {
  console.log("[Info] Migração de banco de dados concluída.");
});
EOF

# 2. Executar migração
echo ">>> Executando migração do banco de dados..."
if [ -f "/opt/alt/alt-nodejs18/root/usr/bin/node" ]; then
    /opt/alt/alt-nodejs18/root/usr/bin/node backend-migration.js
else
    node backend-migration.js
fi

# 3. Instruções para rotas (já que não podemos editar server.js cegamente)
echo ""
echo ">>> ATENÇÃO: Para finalizar, adicione as seguintes rotas no seu arquivo de backend (ex: server.js):"
echo ""
echo "app.get('/api/rooms/all', (req, res) => {"
echo "  db.all('SELECT * FROM room_types', [], (err, rows) => {"
echo "    if (err) return res.status(500).json({ error: err.message });"
echo "    res.json(rows);"
echo "  });"
echo "});"
echo ""
echo "app.patch('/api/rooms/:id/availability', (req, res) => {"
echo "  const { is_active } = req.body;"
echo "  db.run('UPDATE room_types SET is_active = ? WHERE id = ?', [is_active, req.params.id], function(err) {"
echo "    if (err) return res.status(500).json({ error: err.message });"
echo "    res.json({ updated: this.changes });"
echo "  });"
echo "});"
echo ""
echo "app.patch('/api/rooms/:id/room-number', (req, res) => {"
echo "  const { room_number } = req.body;"
echo "  db.run('UPDATE room_types SET room_number = ? WHERE id = ?', [room_number, req.params.id], function(err) {"
echo "    if (err) return res.status(500).json({ error: err.message });"
echo "    res.json({ updated: this.changes });"
echo "  });"
echo "});"
echo ""
echo ">>> Patch concluído. Remova o arquivo backend-migration.js se desejar."