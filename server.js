'use strict';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

try { require('dotenv').config(); } catch (e) {}

const express  = require('express');
const path     = require('path');
const fs       = require('fs');

const app      = express();
const PORT     = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── API ───────────────────────────────────────────────────────────────────────
try {
  const apiRouter = require('./api/sqlite-server.js');
  app.use('/api', apiRouter);
  console.log('✅ API router carregado');
} catch (err) {
  console.error('❌ Falha ao carregar API router:', err.message);
}

// ── Frontend estático ─────────────────────────────────────────────────────────
if (!fs.existsSync(distPath)) {
  console.error('❌ Pasta dist/ não encontrada em: ' + distPath);
} else {
  const assets = fs.existsSync(path.join(distPath, 'assets'))
    ? fs.readdirSync(path.join(distPath, 'assets'))
    : [];
  console.log('📂 dist/ encontrada. Assets: ' + assets.join(', '));
}

// IMPORTANTE: express.static ANTES de qualquer app.get que possa interceptar
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js'))   res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    if (filePath.endsWith('.mjs'))  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    if (filePath.endsWith('.css'))  res.setHeader('Content-Type', 'text/css; charset=utf-8');
    if (filePath.endsWith('.svg'))  res.setHeader('Content-Type', 'image/svg+xml');
    if (filePath.endsWith('.png'))  res.setHeader('Content-Type', 'image/png');
    if (filePath.endsWith('.jpg'))  res.setHeader('Content-Type', 'image/jpeg');
    if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
  }
}));

// ── SPA catch-all (React Router) ─────────────────────────────────────────────
// Apenas para rotas sem extensão (não intercepta .js, .css, .png, etc.)
app.get('*', (req, res) => {
  // Se a rota tem extensão de arquivo, retorna 404 (o static já deveria ter servido)
  if (path.extname(req.path) !== '') {
    console.log('⚠️ Arquivo não encontrado: ' + req.path);
    return res.status(404).send('Arquivo não encontrado: ' + req.path);
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('❌ dist/index.html não encontrado. A dist/ está commitada no repositório?');
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('✅ Servidor rodando na porta ' + PORT);
  console.log('📊 Health: http://localhost:' + PORT + '/api/health');
  console.log('🌐 Frontend: http://localhost:' + PORT);
});