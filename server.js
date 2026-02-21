'use strict';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

try { require('dotenv').config(); } catch (e) {}

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app     = express();
const PORT    = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API
const apiRouter = require('./api/sqlite-server.js');
app.use('/api', apiRouter);

// Frontend estático
if (!fs.existsSync(distPath)) {
  console.error('❌ Pasta dist/ não encontrada.');
} else {
  console.log('📂 Servindo frontend de: ' + distPath);
}

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js'))  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
    if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
  }
}));

app.get('/assets/*', (req, res) => res.status(404).send('Asset não encontrado'));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('dist/index.html não encontrado. Rode npm run build.');
  }
});

app.listen(PORT, () => {
  console.log('✅ Servidor rodando na porta ' + PORT);
  console.log('📊 Health: http://localhost:' + PORT + '/api/health');
});