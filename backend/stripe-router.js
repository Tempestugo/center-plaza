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

// POST /api/stripe/create-payment-intent
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
    if (conflict.c > 0) return res.status(409).json({ error: 'Quarto indisponivel para as datas selecionadas' });

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

// POST /api/stripe/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const sig    = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook sig error:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  const db = await getDb();
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await db.run("UPDATE reservations SET status='confirmed',payment_status='paid',updated_at=CURRENT_TIMESTAMP WHERE stripe_payment_intent_id=?", [pi.id]);
    console.log('Reserva confirmada via webhook:', pi.id);
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await db.run("UPDATE reservations SET status='cancelled',payment_status='failed',updated_at=CURRENT_TIMESTAMP WHERE stripe_payment_intent_id=?", [pi.id]);
  }
  res.json({ received: true });
});

module.exports = router;