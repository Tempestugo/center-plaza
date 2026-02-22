import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './sqlite-server.js';

describe('🔒 Testes de Segurança e Regras de Negócio', () => {
  // Variáveis para compartilhar as datas entre os testes
  let dynamicCheckIn;
  let dynamicCheckOut;
  
  it('Deve ignorar o preço enviado pelo frontend e calcular o correto no backend', async () => {
    // 1. Preparação: Obter preço real do quarto para cálculo dinâmico
    const roomResponse = await request(app).get('/api/rooms/1');
    const pricePerNight = roomResponse.body.price_per_night;

    // Gerar datas aleatórias no futuro para evitar colisão com execuções anteriores
    const randomDay = Math.floor(Math.random() * 28) + 1;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomYear = 2030 + Math.floor(Math.random() * 70); // Entre 2030 e 2100
    
    dynamicCheckIn = `${randomYear}-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;
    const endDate = new Date(new Date(dynamicCheckIn).getTime() + (5 * 24 * 60 * 60 * 1000));
    dynamicCheckOut = endDate.toISOString().split('T')[0];

    const checkIn = dynamicCheckIn;
    const checkOut = dynamicCheckOut;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const expectedTotal = pricePerNight * nights;

    const dadosMaliciosos = {
      hotel_id: 1,
      room_type_id: 1, 
      guest_name: 'Hacker Teste',
      guest_email: 'hacker@teste.com',
      guest_phone: '11999999999',
      guest_document: '12345678900',
      check_in_date: checkIn,
      check_out_date: checkOut,
      number_of_guests: 1,
      total_amount: 1.00, // 🚨 TENTATIVA DE FRAUDE: Enviando R$ 1,00
      special_requests: 'Teste de segurança'
    };

    // 2. Execução
    const response = await request(app)
      .post('/api/reservations')
      .send(dadosMaliciosos);

    // 3. Avaliação
    expect(response.status).toBe(201);
    // O valor salvo DEVE ser o calculado pelo backend, ignorando o 1.00 enviado
    expect(response.body.total_amount).toBe(expectedTotal);
  });

  it('Deve bloquear reserva em data já ocupada (Overbooking)', async () => {
    // Calcula uma data que cai no meio da reserva criada no teste anterior
    const conflictDate = new Date(new Date(dynamicCheckIn).getTime() + (24 * 60 * 60 * 1000)); // Dia seguinte ao check-in
    
    const reservaConflitante = {
      hotel_id: 1,
      room_type_id: 1,
      guest_name: 'Hóspede Atrasado',
      guest_email: 'atrasado@teste.com',
      check_in_date: conflictDate.toISOString().split('T')[0], // Data conflitante dinâmica
      check_out_date: dynamicCheckOut,
      number_of_guests: 1
    };

    const response = await request(app)
      .post('/api/reservations')
      .send(reservaConflitante);

    expect(response.status).toBe(409); // Conflict
    expect(response.body.error).toContain('indisponível');
  });

  it('Deve prevenir SQL Injection nos campos de texto', async () => {
    const injectionPayload = "'; DROP TABLE reservations; --";
    
    // Usar uma data bem distante e aleatória para evitar conflitos com outros testes
    const randomYear = 2035 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomDay = Math.floor(Math.random() * 25) + 1;
    
    const checkIn = `${randomYear}-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;
    const endDate = new Date(new Date(checkIn).getTime() + (4 * 24 * 60 * 60 * 1000));
    const checkOut = endDate.toISOString().split('T')[0];

    const dadosInjection = {
      hotel_id: 1,
      room_type_id: 1,
      guest_name: 'Hacker SQL',
      guest_email: 'sql@hacker.com',
      check_in_date: checkIn,
      check_out_date: checkOut,
      number_of_guests: 1,
      special_requests: injectionPayload // Tentativa de injeção
    };

    const response = await request(app)
      .post('/api/reservations')
      .send(dadosInjection);

    // Deve criar a reserva normalmente (201) e salvar o texto literal, sem executar o comando
    expect(response.status).toBe(201);
    expect(response.body.special_requests).toBe(injectionPayload);
  });

  it('Deve rejeitar reservas com data no passado (Regra de Negócio)', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkIn = yesterday.toISOString().split('T')[0];
    
    const dadosPassado = {
      hotel_id: 1,
      room_type_id: 1,
      guest_name: 'Viajante do Tempo',
      guest_email: 'marty@future.com',
      check_in_date: checkIn,
      check_out_date: new Date().toISOString().split('T')[0],
      number_of_guests: 1
    };

    const response = await request(app)
      .post('/api/reservations')
      .send(dadosPassado);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/passado/i);
  });

  it('Deve garantir idempotência na criação de reservas (Resiliência)', async () => {
    const randomId = Math.floor(Math.random() * 10000);
    const idempotencyKey = `reserva-unica-${randomId}`;
    
    // Usar datas futuras seguras
    const checkIn = '2040-01-01';
    const checkOut = '2040-01-05';

    const dadosReserva = {
      hotel_id: 1,
      room_type_id: 1,
      guest_name: 'Cliente Ansioso',
      guest_email: 'ansioso@teste.com',
      check_in_date: checkIn,
      check_out_date: checkOut,
      number_of_guests: 1
    };

    // 1. Primeira requisição
    const res1 = await request(app)
      .post('/api/reservations')
      .set('Idempotency-Key', idempotencyKey)
      .send(dadosReserva);
    
    expect(res1.status).toBe(201);

    // 2. Segunda requisição (Simulação de retry de rede)
    const res2 = await request(app)
      .post('/api/reservations')
      .set('Idempotency-Key', idempotencyKey)
      .send(dadosReserva);

    // Deve retornar 201 (sucesso) mas com o MESMO ID da primeira, sem criar duplicata
    expect(res2.status).toBe(201);
    expect(res2.body.id).toBe(res1.body.id);
  });
});