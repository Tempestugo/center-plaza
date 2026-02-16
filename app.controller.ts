import { 
  Controller, Get, Post, Body, Param, Query, 
  UseInterceptors, UploadedFiles, Res, StreamableFile 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return { status: this.appService.getHello() };
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date() };
  }

  // --- HOTELS ---
  @Get('hotels')
  async getHotels() {
    return this.appService.getHotels();
  }

  @Get('hotels/:id')
  async getHotel(@Param('id') id: string) {
    return this.appService.getHotelById(Number(id));
  }

  // --- ROOMS ---
  @Get('rooms')
  async getRooms(@Query('hotel_id') hotelId?: string) {
    return this.appService.getRooms(hotelId ? Number(hotelId) : undefined);
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') id: string) {
    return this.appService.getRoomById(Number(id));
  }

  @Post('rooms')
  @UseInterceptors(FilesInterceptor('images', 10)) // Limite de 10 imagens
  async createRoom(@Body() body: any, @UploadedFiles() files: Array<Express.Multer.File>) {
    // NestJS converte form-data para objeto, mas amenities vem como string se enviado via form
    if (typeof body.amenities === 'string') {
      try { body.amenities = JSON.parse(body.amenities); } catch(e) {}
    }
    return this.appService.createRoom(body, files);
  }

  // Rota crítica para servir imagens do banco
  @Get('room-images/:id')
  async getRoomImage(@Param('id') id: string, @Res() res: Response) {
    const image = await this.appService.getRoomImage(Number(id));
    
    let base64Data = image.image_data || '';
    if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
    }

    const imgBuffer = Buffer.from(base64Data, 'base64');
    
    res.writeHead(200, {
      'Content-Type': image.image_type,
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(imgBuffer);
  }

  // --- RESERVATIONS ---
  @Get('reservations')
  async getReservations(@Query('guest_email') email?: string) {
    return this.appService.getReservations(email);
  }

  @Post('reservations')
  async createReservation(@Body() body: any) {
    return this.appService.createReservation(body);
  }

  // --- AUTH ---
  @Post('login')
  async login(@Body() body: any) {
    return this.appService.login(body.username, body.password);
  }

  @Post('contact')
  async contact(@Body() body: any) {
    // Implementação simples para contato
    console.log('Contato recebido:', body);
    return { message: 'Mensagem recebida com sucesso!' };
  }
}