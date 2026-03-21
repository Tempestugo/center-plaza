'use strict';

process.on('uncaughtException', (err) => {
  console.error('CRASH:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('REJECTION:', reason);
});

try { require('dotenv').config(); } catch (e) {}

const express  = require('express');
const path     = require('path');
const fs       = require('fs');

const app      = express();
const PORT     = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.js':    'application/javascript; charset=utf-8',
  '.mjs':   'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.html':  'text/html; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.ico':   'image/x-icon',
  '.json':  'application/json',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
};

console.log('=== SERVER STARTING ===');
console.log('Node:', process.version);
console.log('CWD:', process.cwd());
console.log('distPath:', distPath);
console.log('dist exists:', fs.existsSync(distPath));

// CRÍTICO: raw para webhook do Stripe ANTES do express.json()
// Deve bater com a rota definida no sqlite-server.js: /webhooks/stripe
// Montado em /api → caminho final: /api/webhooks/stripe
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API principal
try {
  const apiRouter = require('./backend/sqlite-server.js');
  app.use('/api', apiRouter);
  console.log('✅ API router carregado');
} catch (err) {
  console.error('❌ API router falhou:', err.message);
}

// Frontend estático
app.use((req, res, next) => {
  const filePath = path.join(distPath, req.path);
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext      = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      return res.sendFile(filePath);
    }
  } catch (e) {
    console.error('STATIC ERR:', e.message);
  }
  next();
});

// SPA fallback
app.get('*', (req, res) => {
  const ext = path.extname(req.path);
  if (ext !== '') return res.status(404).send('Not found: ' + req.path);
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(indexPath);
  }
  res.status(503).send('index.html não encontrado. Execute npm run build.');
});

app.listen(PORT, () => {
  console.log('=== SERVER UP on port', PORT, '===');
});