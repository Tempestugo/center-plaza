'use strict';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

try { require('dotenv').config(); } catch (e) {}

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas da API
const apiRouter = require('./api/sqlite-server.js');
app.use('/api', apiRouter);

// Arquivos estáticos do React
const distPath = path.join(__dirname, 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ Pasta dist/ não encontrada. Execute: npm run build');
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

// Se pedir /assets/* e não achar, retorna 404 (não cai no catch-all)
app.get('/assets/*', (req, res) => {
  res.status(404).send('Asset não encontrado');
});

// Tudo mais → index.html (React Router)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('Build não encontrado. Execute: npm run build');
  }
});

app.listen(PORT, () => {
  console.log('✅ Servidor rodando na porta ' + PORT);
});