'use strict';
const express = require('express');
const router  = express.Router();
const path    = require('path');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY nao configurada');
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

async function getDb() {
  const sqlite  = require('sqlite');
  const sqlite3 = require('sqlite3');
  const fs      = require('fs');
  const dbDir   = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  return sqlite.open({ filename: path.join(dbDir, 'center-plaza.sqlite'), driver: sqlite3.Database });
}

router.post('/webhook-debug', function(req, res) {
  res.json({ bodyType: typeof req.body, isBuffer: Buffer.isBuffer(req.body), hasSig: !!req.headers['stripe-signature'] });
});

router.post('/create-payment-intent', async (req, res) => {
  try {
    const stripe = getStripe();
    const { hotel_id, room_type_id, guest_name, guest_email, guest_phone,
            guest_document, check_in_date, check_out_date, number_of_guests, special_requests } = req.body;
    const db   = await getDb();
    const room = await db.get('SELECT * FROM room_types WHERE id = ?', [room_type_id]);
    if (!room) return res.status(404).json({ error: 'Quarto nao encontrado' });
    const conflict = await db.get(
      "SELECT COUNT(*) as c FROM reservations WHERE room_type_id=? AND status!='cancelled' AND check_in_date<? AND check_out_date>?",
      [room_type_id, check_out_date, check_in_date]);
    if (conflict.c > 0) return res.status(409).json({ error: 'Quarto indisponivel' });
    const nights      = Math.max(1, Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000));
    const totalAmount = room.price_per_night * nights;
    const ins = await db.run(
      'INSERT INTO reservations (hotel_id,room_type_id,guest_name,guest_email,guest_phone,guest_document,check_in_date,check_out_date,number_of_guests,total_amount,special_requests,status,payment_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [hotel_id, room_type_id, guest_name, guest_email, guest_phone, guest_document,
       check_in_date, check_out_date, number_of_guests, totalAmount, special_requests || '', 'pending', 'pending']);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'brl',
      metadata: { reservation_id: ins.lastID.toString(), guest_name, guest_email },
      receipt_email: guest_email,
      description: 'Reserva #' + ins.lastID + ' - ' + guest_name,
    });
    await db.run('UPDATE reservations SET stripe_payment_intent_id=? WHERE id=?', [paymentIntent.id, ins.lastID]);
    res.json({ clientSecret: paymentIntent.client_secret, reservationId: ins.lastID, totalAmount });
  } catch (err) {
    console.error('create-payment-intent error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/payment-intent-for-reservation', async (req, res) => {
  try {
    const stripe = getStripe();
    const { reservation_id } = req.body;
    const db = await getDb();
    const r  = await db.get('SELECT * FROM reservations WHERE id = ?', [reservation_id]);
    if (!r) return res.status(404).json({ error: 'Reserva nao encontrada' });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(r.total_amount * 100),
      currency: 'brl',
      metadata: { reservation_id: r.id.toString(), guest_name: r.guest_name },
      receipt_email: r.guest_email,
      description: 'Reserva #' + r.id + ' - ' + r.guest_name,
    });
    await db.run('UPDATE reservations SET stripe_payment_intent_id=? WHERE id=?', [paymentIntent.id, r.id]);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('payment-intent-for-reservation error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!event || !event.type) return res.status(400).send('Invalid event');
    console.log('Webhook received:', event.type);
    const db = await getDb();
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      await db.run("UPDATE reservations SET status='confirmed',payment_status='paid',updated_at=CURRENT_TIMESTAMP WHERE stripe_payment_intent_id=?", [pi.id]);
      console.log('Reserva confirmada:', pi.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      await db.run("UPDATE reservations SET status='cancelled',payment_status='failed',updated_at=CURRENT_TIMESTAMP WHERE stripe_payment_intent_id=?", [pi.id]);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send('Webhook Error: ' + err.message);
  }
});

module.exports = router;
