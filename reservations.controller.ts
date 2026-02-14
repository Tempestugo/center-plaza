import { Controller, Get, Post, Body, Param, Query, Headers, ConflictException, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

@Controller('api/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(@Query('guest_email') email?: string, @Query('code') code?: string, @Query('guest_name') name?: string) {
    return this.reservationsService.findAll(email, code, name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: any, @Headers('idempotency-key') idempotencyKey?: string) {
    try {
      return await this.reservationsService.create(createDto, idempotencyKey);
    } catch (error) {
      if (error.message.includes('indisponível')) {
        throw new ConflictException(error.message);
      }
      if (error.message.includes('passado')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('create-payment-intent')
  createPaymentIntent(@Body() body: { amount: number; reservation_id: number }) {
    return this.reservationsService.createPaymentIntent(body.amount, body.reservation_id);
  }
}