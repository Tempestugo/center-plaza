'use strict';

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Carregar variáveis de ambiente
try { require('dotenv').config(); } catch (e) {}

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Montar rotas da API
const apiRouter = require('./api/sqlite-server.js');
app.use('/api', apiRouter);

// Servir arquivos estáticos do build React
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Todas as demais rotas retornam o index.html (React Router SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Aplicação em construção. Execute npm run build.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📂 Servindo frontend de: ${distPath}`);
});