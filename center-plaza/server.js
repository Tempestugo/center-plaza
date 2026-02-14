// Este arquivo é o ponto de entrada para a hospedagem (Vercel, Hostinger, etc)

console.log('🚀 LOADER: Iniciando server.js... (Node ' + process.version + ')');
console.log('📂 CWD (Diretório Atual):', process.cwd(), '(Esperado terminar em /center-plaza)');
console.log('📂 CWD (Diretório Atual):', process.cwd());

// Captura erros síncronos de inicialização
process.on('uncaughtException', (err) => {
  console.error('❌ CRASH NA INICIALIZAÇÃO (Uncaught Exception):', err);
  console.error('👉 Verifique se todas as dependências (express, sqlite3, etc) estão no package.json');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ CRASH NA INICIALIZAÇÃO (Unhandled Rejection):', reason);
});

(async () => {
  try {
    console.log('📦 Carregando módulo da API (sqlite-server.js)...');
    const { startServer } = await import('./api/sqlite-server.js');
    console.log('🔄 Módulo carregado. Executando startServer()...');
    await startServer();
  } catch (err) {
    console.error('❌ FALHA FATAL ao carregar o servidor:', err);
    setTimeout(() => process.exit(1), 1000);
  }
})();