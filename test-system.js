
const BASE = 'http://localhost:3000/api';
const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN || '093671e1a705ce5179d7ebf4e58c00611631b25bda701584af80c749e3819974';
let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log('✅', name);
    passed++;
  } catch(e) {
    console.log('❌', name, '->', e.message);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function req(method, path, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function adminReq(method, path, body) {
  return req(method, path, body, { Authorization: 'Bearer ' + ADMIN_TOKEN });
}

async function run() {
  console.log('\n=== CENTER PLAZA — TESTE DE SISTEMA ===\n');

  // ── SAÚDE ─────────────────────────────────────────────────────────────────
  await test('Health check', async () => {
    const { status } = await req('GET', '/health');
    assert(status === 200, 'Health retornou ' + status);
  });

  // ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────
  await test('Login com credenciais erradas retorna 401', async () => {
    const { status } = await req('POST', '/login', { username: 'hacker@evil.com', password: 'senha123' });
    assert(status === 401, 'Esperava 401, recebeu ' + status);
  });

  await test('Login admin valido retorna token', async () => {
    const { status, data } = await req('POST', '/login', { username: 'admin@centerplaza.com', password: 'admin123' });
    assert(status === 200, 'Login falhou: ' + status);
    assert(data.token, 'Token não retornado');
    assert(data.role === 'admin', 'Role não é admin');
  });

  // ── SEGURANÇA ─────────────────────────────────────────────────────────────
  await test('Criar quarto sem auth retorna 401', async () => {
    const { status } = await req('POST', '/rooms', { name: 'Teste', price_per_night: 100 });
    assert(status === 401, 'Esperava 401, recebeu ' + status);
  });

  await test('Rota admin sem token retorna 401', async () => {
    const { status } = await req('GET', '/rooms/all');
    assert(status === 401, 'Esperava 401, recebeu ' + status);
  });

  await test('IDOR: GET /reservations/:id sem email retorna 403', async () => {
    const { status } = await req('GET', '/reservations/1');
    assert(status === 403 || status === 404, 'Esperava 403/404, recebeu ' + status);
  });

  await test('GET /reservations sem guest_email retorna 403', async () => {
    const { status } = await req('GET', '/reservations');
    assert(status === 403, 'Esperava 403, recebeu ' + status);
  });

  await test('Backdoor dev-token nao funciona', async () => {
    const { status } = await req('POST', '/rooms', { name: 'Hack' }, { Authorization: 'Bearer dev-token' });
    assert(status === 401, 'dev-token ainda funciona! Status: ' + status);
  });

  await test('Backdoor admin-token nao funciona', async () => {
    const { status } = await req('POST', '/rooms', { name: 'Hack' }, { Authorization: 'Bearer admin-token' });
    assert(status === 401, 'admin-token ainda funciona! Status: ' + status);
  });

  // ── QUARTOS ───────────────────────────────────────────────────────────────
  await test('GET /rooms retorna lista publica', async () => {
    const { status, data } = await req('GET', '/rooms');
    assert(status === 200, 'Status ' + status);
    assert(Array.isArray(data), 'Nao retornou array');
  });

  await test('GET /rooms/all com admin retorna todos', async () => {
    const { status, data } = await adminReq('GET', '/rooms/all');
    assert(status === 200, 'Status ' + status);
    assert(Array.isArray(data), 'Nao retornou array');
  });

  // ── FLUXO DE RESERVA ──────────────────────────────────────────────────────
  let reservationId = null;
  await test('POST /reservations cria reserva pendente', async () => {
    const { status, data } = await req('POST', '/reservations', {
      hotel_id: 1,
      room_type_id: 1,
      guest_name: 'Teste Automatico',
      guest_email: 'teste@centerplaza.com',
      guest_phone: '11999999999',
      guest_document: '000.000.000-00',
      check_in_date: '2026-12-01',
      check_out_date: '2026-12-03',
      number_of_guests: 2,
      total_amount: 500,
      status: 'pending'
    });
    assert(status === 201 || status === 200, 'Status ' + status + ' ' + JSON.stringify(data));
    assert(data.id, 'ID nao retornado');
    reservationId = data.id;
  });

  await test('GET /reservations com email correto retorna reserva', async () => {
    if (!reservationId) throw new Error('Sem reservationId do teste anterior');
    const { status, data } = await req('GET', '/reservations?guest_email=teste@centerplaza.com');
    assert(status === 200, 'Status ' + status);
    assert(Array.isArray(data), 'Nao retornou array');
  });

  await test('PATCH cancel-pending cancela reserva', async () => {
    if (!reservationId) throw new Error('Sem reservationId');
    const { status } = await req('PATCH', '/reservations/' + reservationId + '/cancel-pending');
    assert(status === 200, 'Status ' + status);
  });

  // ── CHAT ─────────────────────────────────────────────────────────────────
  await test('POST /chat envia mensagem como guest', async () => {
    if (!reservationId) throw new Error('Sem reservationId');
    const { status, data } = await req('POST', '/chat/' + reservationId, {
      content: 'Mensagem de teste automatizado',
      sender_role: 'guest'
    });
    assert(status === 200 || status === 201, 'Status ' + status);
    assert(data.id || data.content, 'Resposta invalida: ' + JSON.stringify(data));
  });

  await test('GET /chat retorna mensagens', async () => {
    if (!reservationId) throw new Error('Sem reservationId');
    const { status, data } = await req('GET', '/chat/' + reservationId);
    assert(status === 200, 'Status ' + status);
    assert(Array.isArray(data), 'Nao retornou array');
  });

  // ── DATAS BLOQUEADAS ──────────────────────────────────────────────────────
  await test('GET /rooms/:id/blocked-dates retorna array', async () => {
    const { status, data } = await req('GET', '/rooms/2/blocked-dates');
    assert(status === 200, 'Status ' + status);
    assert(Array.isArray(data.blocked_dates), 'blocked_dates nao e array');
  });

  // ── RESUMO ────────────────────────────────────────────────────────────────
  console.log('\n=== RESULTADO ===');
  console.log('✅ Passou:', passed);
  console.log('❌ Falhou:', failed);
  console.log('Total:', passed + failed);
  if (failed === 0) console.log('\n🎉 Sistema 100% operacional!');
  else console.log('\n⚠️  Corrija os itens marcados com ❌');
}

run().catch(console.error);
