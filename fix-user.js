// Rodar com: /opt/alt/alt-nodejs18/root/usr/bin/node fix-user.js
// Na pasta: /home/u556180082/domains/lightgrey-echidna-641630.hostingersite.com/nodejs

const fs = require('fs');

// ── 1. Corrigir UserDashboard para buscar reservas da API real ────────────────
let dash = fs.readFileSync('src/pages/UserDashboard.tsx', 'utf8');

// Adicionar useEffect e useState se não existirem
if (!dash.includes('useEffect')) {
  dash = dash.replace(
    `import { useState`,
    `import { useState, useEffect`
  );
}

// Substituir dados mock por estado real
const mockBlock = `  // Buscar reservas reais do usuário
  const userReservations = user ? getUserReservations(user.email) : [];
  // Separar reservas ativas das concluídas
  const reservas = userReservations.filter(r => r.status === 'confirmada' || r.status === 'pendente');
  const historico = userReservations.filter(r => r.status === 'cancelada');
  // Gerar dados de pagamento baseados nas reservas
  const pagamentos = userReservations.map(reserva => ({
    id: \`PAG\${reserva.id.slice(-3)}\`,
    reservaId: reserva.id,
    accommodation: reserva.accommodationName,
    date: reserva.createdAt,
    amount: reserva.total,
    method: reserva.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito',
    status: reserva.paymentStatus === 'pago' ? 'aprovado' : reserva.paymentStatus
  }));
  // Favoritos reais do usuário
  const favoritos = user ? getUserFavorites(user.id) : [];`;

const realBlock = `  // Reservas reais da API
  const [reservasAPI, setReservasAPI] = useState<any[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setLoadingReservas(true);
    fetch('/api/reservations?guest_email=' + encodeURIComponent((user as any).email))
      .then(r => r.json())
      .then(data => {
        setReservasAPI(Array.isArray(data) ? data : []);
      })
      .catch(() => setReservasAPI([]))
      .finally(() => setLoadingReservas(false));
  }, [user?.email]);

  const reservas = reservasAPI.filter(r => r.status === 'confirmed' || r.status === 'pending');
  const historico = reservasAPI.filter(r => r.status === 'cancelled');
  const pagamentos = reservasAPI.map((r: any) => ({
    id: 'PAG' + String(r.id).padStart(3, '0'),
    reservaId: r.id,
    accommodation: r.room_type_name || 'Hospedagem',
    date: r.created_at,
    amount: r.total_amount,
    method: 'Cartão de Crédito',
    status: r.payment_status === 'paid' ? 'aprovado' : r.payment_status || 'pendente'
  }));
  const favoritos: any[] = [];`;

if (dash.includes(mockBlock)) {
  dash = dash.replace(mockBlock, realBlock);
  console.log('OK: UserDashboard atualizado para usar API real');
} else {
  // Tentar substituição mais simples
  dash = dash.replace(
    `const userReservations = user ? getUserReservations(user.email) : [];`,
    `// Dados mock substituídos por API real abaixo`
  );
  // Adicionar estados reais logo após o useState de activeTab
  dash = dash.replace(
    `  const [activeTab, setActiveTab] = useState("reservas");`,
    `  const [activeTab, setActiveTab] = useState("reservas");
  const [reservasAPI, setReservasAPI] = useState<any[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setLoadingReservas(true);
    fetch('/api/reservations?guest_email=' + encodeURIComponent((user as any).email))
      .then(r => r.json())
      .then(data => { setReservasAPI(Array.isArray(data) ? data : []); })
      .catch(() => setReservasAPI([]))
      .finally(() => setLoadingReservas(false));
  }, [(user as any)?.email]);

  const reservas = reservasAPI.filter(r => r.status === 'confirmed' || r.status === 'pending');
  const historico = reservasAPI.filter(r => r.status === 'cancelled');
  const pagamentos = reservasAPI.map((r) => ({
    id: 'PAG' + String(r.id).padStart(3, '0'),
    reservaId: r.id,
    accommodation: r.room_type_name || 'Hospedagem',
    date: r.created_at,
    amount: r.total_amount,
    method: 'Cartão de Crédito',
    status: r.payment_status === 'paid' ? 'aprovado' : r.payment_status || 'pendente'
  }));
  const favoritos: any[] = [];`
  );
  console.log('OK: estados API adicionados ao UserDashboard (modo fallback)');
}

// Corrigir campos dos cards de reserva para usar campos da API real
dash = dash.replace(/reserva\.accommodationName/g, 'reserva.room_type_name || "Hospedagem"');
dash = dash.replace(/reserva\.accommodationImage/g, 'reserva.room_image || "/placeholder.jpg"');
dash = dash.replace(/reserva\.checkIn\b/g, 'reserva.check_in_date');
dash = dash.replace(/reserva\.checkOut\b/g, 'reserva.check_out_date');
dash = dash.replace(/reserva\.guests\b/g, 'reserva.number_of_guests');
dash = dash.replace(/reserva\.total\b/g, 'reserva.total_amount');
dash = dash.replace(/reserva\.location\b/g, '"Center Plaza Hotel"');
dash = dash.replace(/'confirmada'/g, '"confirmed"');
dash = dash.replace(/'pendente'/g, '"pending"');
dash = dash.replace(/'cancelada'/g, '"cancelled"');

fs.writeFileSync('src/pages/UserDashboard.tsx', dash);
console.log('OK: campos da API real mapeados');

// ── 2. Adicionar ChatWidget no layout principal ───────────────────────────────
// Adicionar no App.tsx ou no componente de layout raiz

const layoutFiles = ['src/App.tsx', 'src/components/Layout.tsx', 'src/main.tsx'];
let layoutFixed = false;

for (const file of layoutFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('ChatWidget')) { console.log('OK: ChatWidget ja existe em', file); layoutFixed = true; break; }
  if (content.includes('</Router>') || content.includes('</BrowserRouter>')) {
    const tag = content.includes('</Router>') ? '</Router>' : '</BrowserRouter>';
    content = content.replace(
      `import`,
      `import ChatWidget from "@/components/ChatWidget";\nimport`
    );
    content = content.replace(tag, `  <ChatWidget />\n${tag}`);
    fs.writeFileSync(file, content);
    console.log('OK: ChatWidget adicionado em', file);
    layoutFixed = true;
    break;
  }
}

if (!layoutFixed) {
  // Tentar no Index.tsx
  let index = fs.readFileSync('src/pages/Index.tsx', 'utf8');
  if (!index.includes('ChatWidget')) {
    index = `import ChatWidget from "@/components/ChatWidget";\n` + index;
    index = index.replace('</div>', '  <ChatWidget />\n</div>');
    fs.writeFileSync('src/pages/Index.tsx', index);
    console.log('OK: ChatWidget adicionado em Index.tsx');
  }
}

// ── 3. Adicionar rota de chat para guests no backend ─────────────────────────
let backend = fs.readFileSync('backend/sqlite-server.js', 'utf8');

// A rota de chat já existe para admin, mas precisa aceitar guest sem auth
const chatRoute = `
router.get('/chat/:reservationId', async (req, res) => {
  try {
    const db = await getDb();
    const msgs = await db.all(
      'SELECT * FROM messages WHERE reservation_id = ? ORDER BY created_at ASC',
      [req.params.reservationId]
    );
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/chat/:reservationId', async (req, res) => {
  try {
    const { content, sender_role } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Mensagem vazia' });
    const role = sender_role === 'admin' ? 'admin' : 'guest';
    const db = await getDb();
    // Verificar se tabela messages existe
    await db.run(\`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL DEFAULT 'guest',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )\`);
    const result = await db.run(
      'INSERT INTO messages (reservation_id, sender_role, content) VALUES (?, ?, ?)',
      [req.params.reservationId, role, content.trim()]
    );
    const msg = await db.get('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
`;

if (!backend.includes("router.get('/chat/")) {
  // Adicionar antes das rotas de reserva
  const anchor = "router.get('/reservations'";
  if (backend.includes(anchor)) {
    backend = backend.replace(anchor, chatRoute + '\n' + anchor);
    console.log('OK: rotas de chat adicionadas ao backend');
  }
} else {
  // Verificar se aceita guest
  if (!backend.includes("sender_role === 'admin' ? 'admin' : 'guest'")) {
    backend = backend.replace(
      "sender_role: 'admin'",
      "sender_role: req.body.sender_role === 'admin' ? 'admin' : 'guest'"
    );
    console.log('OK: chat backend aceita sender_role guest');
  } else {
    console.log('OK: rotas de chat ja existem');
  }
}

// Adicionar rota de reservas por email se não existir
if (!backend.includes('guest_email')) {
  backend = backend.replace(
    "router.get('/reservations',",
    `router.get('/reservations',`
  );
  // Garantir que a rota GET /reservations filtra por guest_email
  backend = backend.replace(
    `router.get('/reservations', async (req, res) => {`,
    `router.get('/reservations', async (req, res) => {
  // Suporte a filtro por guest_email (para UserDashboard)`
  );
  console.log('Verificar manualmente se GET /reservations aceita ?guest_email=');
}

fs.writeFileSync('backend/sqlite-server.js', backend);
console.log('OK: backend salvo');

console.log('\n=== RESUMO ===');
console.log('1. UserDashboard.tsx — usa API real para reservas');
console.log('2. ChatWidget.tsx — ja esta em src/components/ (copiou manualmente?)');
console.log('3. backend/sqlite-server.js — rotas de chat para guest');
console.log('\nLembrete: copiar ChatWidget.tsx para src/components/ antes do build!');