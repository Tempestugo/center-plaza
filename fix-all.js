// Rodar com: /opt/alt/alt-nodejs18/root/usr/bin/node fix-all.js
// Na pasta: /home/u556180082/domains/lightgrey-echidna-641630.hostingersite.com/nodejs

const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. useRooms.ts — usar imagens reais do banco em vez de assets locais
// ═══════════════════════════════════════════════════════════════════════════════
const useRoomsContent = `import { useState, useEffect } from 'react';
import { roomService, RoomType } from '@/services/api';

export interface AccommodationData {
  id: number;
  name: string;
  image: string;
  images: string[];
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  maxGuests: number;
  amenities: string[];
  description: string;
  featured?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80';

function mapRoomToAccommodation(
  room: RoomType & { hotel_name?: string; max_occupancy?: number; is_active?: number; images?: any[] },
  index: number
): AccommodationData {
  let amenities: string[] = [];
  if (room.amenities) {
    if (Array.isArray(room.amenities)) {
      amenities = room.amenities;
    } else {
      try { amenities = JSON.parse(room.amenities as unknown as string); }
      catch { amenities = (room.amenities as unknown as string).split(',').map(a => a.trim()); }
    }
  }

  // Usar imagens reais do banco se existirem
  const images: string[] = [];
  if (room.images && Array.isArray(room.images) && room.images.length > 0) {
    room.images.forEach((img: any) => {
      if (img.url) images.push(img.url);
      else if (img.image_data) images.push('data:' + (img.image_type || 'image/jpeg') + ';base64,' + img.image_data);
    });
  }
  const primaryImage = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  return {
    id:          room.id,
    name:        room.name,
    image:       primaryImage,
    images:      images.length > 0 ? images : [FALLBACK_IMAGE],
    location:    (room as any).hotel_name || 'Center Plaza',
    rating:      4.8,
    reviewCount: 45,
    price:       room.price_per_night,
    maxGuests:   (room as any).max_occupancy ?? (room as any).capacity ?? 2,
    amenities:   amenities.length > 0 ? amenities : ['Wi-Fi', 'Estacionamento'],
    description: room.description || '',
    featured:    index < 3,
  };
}

export function useRooms() {
  const [rooms,   setRooms]   = useState<AccommodationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const roomTypes = await roomService.getAll();
      const activeRooms = roomTypes.filter(
        (r: any) => r.is_active === undefined || r.is_active === 1 || r.is_active === true
      );
      setRooms(activeRooms.map((room, index) => mapRoomToAccommodation(room as any, index)));
    } catch (err) {
      console.error('Erro ao buscar quartos:', err);
      setError('Erro ao carregar as acomodacoes');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  return { rooms, loading, error, refetch: fetchRooms };
}

export function useFeaturedRooms() {
  const { rooms, loading, error } = useRooms();
  const featuredRooms = rooms.filter(room => room.featured).slice(0, 3);
  return { rooms: featuredRooms, loading, error };
}
`;

fs.writeFileSync('src/hooks/useRooms.ts', useRoomsContent);
console.log('OK: useRooms.ts atualizado para usar imagens reais do banco');

// ═══════════════════════════════════════════════════════════════════════════════
// 2. backend/sqlite-server.js — adicionar stripe_price_id na tabela room_types
// ═══════════════════════════════════════════════════════════════════════════════
let backend = fs.readFileSync('backend/sqlite-server.js', 'utf8');

// Adicionar migração para stripe_price_id
const migrationAnchor = "try { await db.run(\"ALTER TABLE room_types ADD COLUMN room_number TEXT\"); } catch (e) {}";
const newMigration = migrationAnchor + "\n  try { await db.run(\"ALTER TABLE room_types ADD COLUMN stripe_price_id TEXT\"); } catch (e) {}";

if (!backend.includes('stripe_price_id')) {
  if (backend.includes(migrationAnchor)) {
    backend = backend.replace(migrationAnchor, newMigration);
    console.log('OK: migracao stripe_price_id adicionada');
  } else {
    // Tentar ancora alternativa
    const alt = "try { await db.run(\"ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT\"); } catch (e) {}";
    if (backend.includes(alt)) {
      backend = backend.replace(alt, alt + "\n  try { await db.run(\"ALTER TABLE room_types ADD COLUMN stripe_price_id TEXT\"); } catch (e) {}");
      console.log('OK: migracao stripe_price_id adicionada (ancora alternativa)');
    } else {
      console.log('AVISO: adicione manualmente: try { await db.run("ALTER TABLE room_types ADD COLUMN stripe_price_id TEXT"); } catch (e) {}');
    }
  }
} else {
  console.log('OK: stripe_price_id ja existe no backend');
}

// Incluir stripe_price_id no INSERT de rooms
const oldInsert = "'INSERT INTO room_types (hotel_id,name,description,size_sqm,bed_type,bed_count,max_occupancy,amenities,bathroom_type,smoking_allowed,price_per_night,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'";
const newInsert = "'INSERT INTO room_types (hotel_id,name,description,size_sqm,bed_type,bed_count,max_occupancy,amenities,bathroom_type,smoking_allowed,price_per_night,is_active,stripe_price_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'";

if (backend.includes(oldInsert)) {
  backend = backend.replace(oldInsert, newInsert);
  // Adicionar o valor do stripe_price_id nos parâmetros do INSERT
  const oldParams = "JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active !== undefined ? is_active : 1]";
  const newParams = "JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active !== undefined ? is_active : 1, req.body.stripe_price_id || null]";
  if (backend.includes(oldParams)) {
    backend = backend.replace(oldParams, newParams);
    console.log('OK: INSERT de rooms inclui stripe_price_id');
  }
}

// Incluir stripe_price_id no UPDATE de rooms
const oldUpdate = "'UPDATE room_types SET hotel_id=?,name=?,description=?,size_sqm=?,bed_type=?,bed_count=?,max_occupancy=?,amenities=?,bathroom_type=?,smoking_allowed=?,price_per_night=?,is_active=COALESCE(?,is_active),updated_at=CURRENT_TIMESTAMP WHERE id=?'";
const newUpdate = "'UPDATE room_types SET hotel_id=?,name=?,description=?,size_sqm=?,bed_type=?,bed_count=?,max_occupancy=?,amenities=?,bathroom_type=?,smoking_allowed=?,price_per_night=?,is_active=COALESCE(?,is_active),stripe_price_id=COALESCE(?,stripe_price_id),updated_at=CURRENT_TIMESTAMP WHERE id=?'";

if (backend.includes(oldUpdate)) {
  backend = backend.replace(oldUpdate, newUpdate);
  const oldUpdateParams = "JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active, req.params.id]";
  const newUpdateParams = "JSON.stringify(amenities || []), bathroom_type, smoking_allowed ? 1 : 0, price_per_night, is_active, req.body.stripe_price_id || null, req.params.id]";
  if (backend.includes(oldUpdateParams)) {
    backend = backend.replace(oldUpdateParams, newUpdateParams);
    console.log('OK: UPDATE de rooms inclui stripe_price_id');
  }
}

// Adicionar rota PATCH para status de reservas (para o admin aprovar/cancelar)
const webhookAnchor = "router.get('/reservations/:id/payment-status'";
const statusRoute = `
router.patch('/reservations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Status invalido' });
    const db = await getDb();
    await db.run(
      "UPDATE reservations SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [status, req.params.id]
    );
    const r = await db.get('SELECT * FROM reservations WHERE id=?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reserva nao encontrada' });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

`;

if (!backend.includes("router.patch('/reservations/:id/status'")) {
  if (backend.includes(webhookAnchor)) {
    backend = backend.replace(webhookAnchor, statusRoute + webhookAnchor);
    console.log('OK: rota PATCH /reservations/:id/status adicionada');
  } else {
    console.log('AVISO: rota de status de reserva nao adicionada automaticamente');
  }
} else {
  console.log('OK: rota PATCH /reservations/:id/status ja existe');
}

fs.writeFileSync('backend/sqlite-server.js', backend);
console.log('OK: backend/sqlite-server.js salvo');

// ═══════════════════════════════════════════════════════════════════════════════
// 3. AdminHospedagens.tsx — adicionar campo stripe_price_id no formulario
// ═══════════════════════════════════════════════════════════════════════════════
let admin = fs.readFileSync('src/pages/AdminHospedagens.tsx', 'utf8');

// Adicionar stripe_price_id no EMPTY_ROOM
const oldEmpty = `const EMPTY_ROOM = {
  hotel_id: "", name: "", description: "", size_sqm: "",
  bed_type: "", bed_count: 1, max_occupancy: 2,
  bathroom_type: "", smoking_allowed: false, price_per_night: "", room_number: "",
  amenities: [] as string[],
};`;
const newEmpty = `const EMPTY_ROOM = {
  hotel_id: "", name: "", description: "", size_sqm: "",
  bed_type: "", bed_count: 1, max_occupancy: 2,
  bathroom_type: "", smoking_allowed: false, price_per_night: "", room_number: "",
  stripe_price_id: "",
  amenities: [] as string[],
};`;

if (admin.includes(oldEmpty)) {
  admin = admin.replace(oldEmpty, newEmpty);
  console.log('OK: stripe_price_id adicionado ao EMPTY_ROOM');
} else {
  console.log('AVISO: EMPTY_ROOM nao encontrado exato — verifique manualmente');
}

// Adicionar stripe_price_id no payload do handleSaveRoom
const oldPayload = `        amenities: roomForm.amenities,`;
const newPayload = `        amenities: roomForm.amenities,
        stripe_price_id: roomForm.stripe_price_id || undefined,`;

if (admin.includes(oldPayload) && !admin.includes('stripe_price_id: roomForm')) {
  admin = admin.replace(oldPayload, newPayload);
  console.log('OK: stripe_price_id adicionado ao payload de save');
}

// Adicionar campo no formulário — inserir após o campo price_per_night
const oldPriceField = `                <Input type="number" step="0.01" min="0" value={roomForm.price_per_night} onChange={e => setRoomForm(p => ({ ...p, price_per_night: e.target.value }))} required />`;
const newPriceField = `                <Input type="number" step="0.01" min="0" value={roomForm.price_per_night} onChange={e => setRoomForm(p => ({ ...p, price_per_night: e.target.value }))} required />`;

// Adicionar campo Stripe após o bloco de preço — procurar pelo Label de preço
const stripeFieldBlock = `
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2">
                  Stripe Price ID
                  <span className="text-xs font-normal text-muted-foreground">(obter no dashboard.stripe.com → Products)</span>
                </Label>
                <Input
                  value={roomForm.stripe_price_id}
                  onChange={e => setRoomForm(p => ({ ...p, stripe_price_id: e.target.value }))}
                  placeholder="price_1ABC123..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Crie o produto no Stripe, copie o Price ID e cole aqui para processar pagamentos reais.
                </p>
              </div>`;

// Inserir antes do fechamento do grid de campos (antes do bloco de amenities ou description)
const insertAnchor = `              <div className="md:col-span-2">
                <Label className="flex items-center gap-2">
                  Stripe Price ID`;

if (!admin.includes(insertAnchor)) {
  // Procurar o campo size_sqm para inserir depois dele
  const sizeField = `                <Input type="number" step="0.1" min="0" value={roomForm.size_sqm}`;
  if (admin.includes(sizeField)) {
    // Encontrar o fechamento do div após size_sqm
    const afterSize = admin.indexOf(sizeField);
    const closingDiv = admin.indexOf('              </div>', afterSize) + '              </div>'.length;
    admin = admin.slice(0, closingDiv) + '\n' + stripeFieldBlock + admin.slice(closingDiv);
    console.log('OK: campo Stripe Price ID adicionado ao formulario');
  } else {
    console.log('AVISO: nao foi possivel inserir campo Stripe automaticamente');
  }
} else {
  console.log('OK: campo Stripe Price ID ja existe no formulario');
}

// Preencher stripe_price_id no setRoomForm do edit
const oldSetForm = `    setRoomForm({
112:        hotel_id: parseInt(roomForm.hotel_id) || 1, name: roomForm.name,`;
// Tentativa mais simples — adicionar stripe_price_id onde o form é populado no edit
admin = admin.replace(
  /setRoomForm\(\{(\s+)hotel_id:/,
  `setRoomForm({$1stripe_price_id: r.stripe_price_id || "",$1hotel_id:`
);

fs.writeFileSync('src/pages/AdminHospedagens.tsx', admin);
console.log('OK: AdminHospedagens.tsx atualizado com campo Stripe Price ID');

// ═══════════════════════════════════════════════════════════════════════════════
// 4. AdminReservas.tsx — adicionar botões confirmar/cancelar
// ═══════════════════════════════════════════════════════════════════════════════
let reservas = fs.readFileSync('src/pages/AdminReservas.tsx', 'utf8');

// Verificar se já tem updateStatus
if (!reservas.includes('updateStatus') && !reservas.includes('handleUpdateStatus')) {
  // Adicionar função handleUpdateStatus após os imports/estado
  const anchorFn = "const { toast } = useToast();";
  const newFn = `const { toast } = useToast();

  const handleUpdateStatus = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      await reservationService.updateStatus(id, status);
      toast({ title: status === 'confirmed' ? 'Reserva confirmada!' : 'Reserva cancelada!' });
      loadReservations();
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };`;

  if (reservas.includes(anchorFn)) {
    reservas = reservas.replace(anchorFn, newFn);
    console.log('OK: handleUpdateStatus adicionado ao AdminReservas');
  }

  // Adicionar botões de ação na listagem — procurar onde aparece o badge de status
  // e adicionar botões depois do Eye button
  const eyeButton = `<Eye className="h-4 w-4" />`;
  const actionsAfterEye = `<Eye className="h-4 w-4" /></Button>
              {r.status === 'pending' && (
                <>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                    onClick={() => handleUpdateStatus(r.id, 'confirmed')}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleUpdateStatus(r.id, 'cancelled')}>
                    <XCircle className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                </>
              )}`;

  if (reservas.includes(eyeButton)) {
    reservas = reservas.replace(eyeButton, actionsAfterEye);
    console.log('OK: botoes Confirmar/Cancelar adicionados ao AdminReservas');
  } else {
    console.log('AVISO: botao Eye nao encontrado para inserir acoes');
  }

  fs.writeFileSync('src/pages/AdminReservas.tsx', reservas);
  console.log('OK: AdminReservas.tsx atualizado');
} else {
  console.log('OK: AdminReservas ja tem updateStatus');
}

console.log('\n=== RESUMO ===');
console.log('1. useRooms.ts — imagens reais do banco');
console.log('2. sqlite-server.js — stripe_price_id + PATCH /reservations/:id/status');
console.log('3. AdminHospedagens.tsx — campo Stripe Price ID no formulario');
console.log('4. AdminReservas.tsx — botoes Confirmar/Cancelar');
console.log('\nProximo passo: buildar e reiniciar Node.js no painel Hostinger');
