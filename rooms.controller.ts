import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RoomsService } from './rooms.service';

@Controller('api/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(@Query('hotel_id') hotelId?: string) {
    return this.roomsService.findAll(hotelId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  create(@Body() createRoomDto: any, @UploadedFiles() files: Array<Express.Multer.File>) {
    // Parse manual dos campos que vêm como string no FormData
    const parsedDto = {
      ...createRoomDto,
      amenities: createRoomDto.amenities ? JSON.parse(createRoomDto.amenities) : [],
      smoking_allowed: createRoomDto.smoking_allowed === 'true',
      price_per_night: parseFloat(createRoomDto.price_per_night),
      max_occupancy: parseInt(createRoomDto.max_occupancy),
      bed_count: parseInt(createRoomDto.bed_count),
      size_sqm: parseFloat(createRoomDto.size_sqm),
    };
    return this.roomsService.create(parsedDto, files);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const parsedDto = {
      ...updateRoomDto,
      // Tratamento seguro para JSON
      amenities: typeof updateRoomDto.amenities === 'string' ? JSON.parse(updateRoomDto.amenities) : updateRoomDto.amenities,
      smoking_allowed: String(updateRoomDto.smoking_allowed) === 'true',
      price_per_night: updateRoomDto.price_per_night ? parseFloat(updateRoomDto.price_per_night) : undefined,
      max_occupancy: updateRoomDto.max_occupancy ? parseInt(updateRoomDto.max_occupancy) : undefined,
      bed_count: updateRoomDto.bed_count ? parseInt(updateRoomDto.bed_count) : undefined,
      size_sqm: updateRoomDto.size_sqm ? parseFloat(updateRoomDto.size_sqm) : undefined,
    };
    return this.roomsService.update(+id, parsedDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.roomsService.removeImage(+id, +imageId);
  }
}