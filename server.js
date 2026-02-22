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
// Ajustado para 'public' conforme seu vite.config.ts
const distPath = path.join(__dirname, 'public');

console.log('=== SERVER STARTING ===');
console.log('Node:', process.version);
console.log('CWD:', process.cwd());
console.log('distPath:', distPath);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API
try {
  // Aponta para a nova pasta 'backend' para evitar conflito com rota /api
  const apiRouter = require('./backend/sqlite-server.js');
  app.use('/api', apiRouter);
  console.log('✅ API router carregado');
} catch (err) {
  console.error('❌ API router falhou:', err.message);
}

// Servir arquivos estáticos corretamente usando o middleware nativo
// Isso resolve problemas de MIME type e performance
app.use(express.static(distPath));

// SPA fallback — apenas para rotas sem extensão
app.get('*', (req, res) => {
  const ext = path.extname(req.path);
  if (ext !== '') {
    console.log('404 asset:', req.path);
    return res.status(404).send('Not found: ' + req.path);
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(indexPath);
  }

  res.status(503).send('index.html não encontrado na pasta public. Verifique o build.');
});

app.listen(PORT, () => {
  console.log('=== SERVER UP on port', PORT, '===');
});