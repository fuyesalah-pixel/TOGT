import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { CreateFaqDto } from './dto/create-faq.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('faq')
  @Public()
  async getFaq() {
    return this.prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  }

  @Get('faq/all')
  @Roles(Role.WORKER, Role.ADMIN)
  getAllFaq() {
    return this.prisma.fAQItem.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  }

  @Post('faq')
  @Roles(Role.WORKER, Role.ADMIN)
  createFaq(@Body() dto: CreateFaqDto, @CurrentUser() user: User) {
    return this.prisma.fAQItem.create({ data: { ...dto, createdById: user.id } });
  }

  @Patch('faq/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  updateFaq(@Param('id') id: string, @Body() dto: Partial<CreateFaqDto>) {
    return this.prisma.fAQItem.update({ where: { id }, data: dto });
  }

  @Delete('faq/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  deleteFaq(@Param('id') id: string) {
    return this.prisma.fAQItem.delete({ where: { id } });
  }

  @Get('gallery')
  @Public()
  async getGallery() {
    const items = await this.prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
    return items.map((item) => ({
      ...item,
      image: item.images[0] ?? '/images/gallery/iata-2026.jpg',
      date: item.date ?? '',
      location: item.location ?? '',
      videos: item.videoUrl ? [{ url: item.videoUrl, title: `${item.title} video` }] : [],
    }));
  }

  @Get('gallery/all')
  @Roles(Role.WORKER, Role.ADMIN)
  getAllGallery() {
    return this.prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('gallery')
  @Roles(Role.WORKER, Role.ADMIN)
  createGallery(@Body() dto: CreateGalleryDto, @CurrentUser() user: User) {
    return this.prisma.galleryItem.create({ data: { ...dto, createdById: user.id } });
  }

  @Patch('gallery/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  updateGallery(@Param('id') id: string, @Body() dto: Partial<CreateGalleryDto>) {
    return this.prisma.galleryItem.update({ where: { id }, data: dto });
  }

  @Delete('gallery/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  deleteGallery(@Param('id') id: string) {
    return this.prisma.galleryItem.delete({ where: { id } });
  }
}
