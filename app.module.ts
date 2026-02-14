import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AuthGuard } from './common/guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseService } from './database/database.service';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';

// Controller simples para servir imagens do banco (legado)
@Controller('api/room-images')
class ImagesController {
  constructor(private db: DatabaseService) {}

  @Get(':id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const image = await this.db.get('SELECT image_data, image_type FROM room_images WHERE id = ?', [id]);
    if (!image) return res.status(404).send('Not found');

    let base64Data = image.image_data || '';
    if (base64Data.includes('base64,')) base64Data = base64Data.split('base64,')[1];

    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.writeHead(200, {
      'Content-Type': image.image_type,
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(imgBuffer);
  }
}

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'dist'), // Aponta para o build do React
      exclude: ['/api/(.*)'],
    }),
    DatabaseModule,
    RoomsModule,
    ReservationsModule,
  ],
  controllers: [ImagesController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard }
  ],
})
export class AppModule {}