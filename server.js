// Entry point para a Hostinger
// Usamos import() dinâmico porque o sqlite-server.js é um ES Module
import('./api/sqlite-server.js')
  .then(module => {
    console.log('✅ Servidor Express iniciado via server.js');
  })
  .catch(err => {
    console.error('❌ Falha ao iniciar o servidor:', err);
    process.exit(1);
  });