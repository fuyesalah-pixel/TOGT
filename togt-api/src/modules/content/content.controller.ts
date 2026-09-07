import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { TranslationService } from '../packages/translation.service';

@Controller('content')
export class ContentController {
  constructor(private readonly prisma: PrismaService, private readonly translations: TranslationService) {}

  @Get('faq')
  @Public()
  async getFaq(@Query('locale') locale?: string) {
    const items = await this.prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
    return items.map((item) => ({ ...item, question: locale === 'ar' ? item.questionAr || item.question : locale === 'am' ? item.questionAm || item.question : item.question, answer: locale === 'ar' ? item.answerAr || item.answer : locale === 'am' ? item.answerAm || item.answer : item.answer }));
  }

  @Get('faq/all')
  @Roles(Role.WORKER, Role.ADMIN)
  getAllFaq() {
    return this.prisma.fAQItem.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  }

  @Post('faq')
  @Roles(Role.WORKER, Role.ADMIN)
  createFaq(@Body() dto: CreateFaqDto, @CurrentUser() user: User) {
    return this.prisma.fAQItem.create({ data: { ...dto, createdById: user.id } }).then((item) => { void this.translations.translateFaq(item.id); return item; });
  }

  @Patch('faq/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  updateFaq(@Param('id') id: string, @Body() dto: Partial<CreateFaqDto>) {
    return this.prisma.fAQItem.update({ where: { id }, data: dto }).then((item) => { void this.translations.translateFaq(item.id); return item; });
  }

  @Delete('faq/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  deleteFaq(@Param('id') id: string) {
    return this.prisma.fAQItem.delete({ where: { id } });
  }

  @Get('gallery')
  @Public()
  async getGallery(@Query('locale') locale?: string) {
    const items = await this.prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
    return items.map((item) => ({
      ...item,
      title: locale === 'ar' ? item.titleAr || item.title : locale === 'am' ? item.titleAm || item.title : item.title,
      category: locale === 'ar' ? item.categoryAr || item.category : locale === 'am' ? item.categoryAm || item.category : item.category,
      location: locale === 'ar' ? item.locationAr || item.location : locale === 'am' ? item.locationAm || item.location : item.location,
      description: locale === 'ar' ? item.descriptionAr || item.description : locale === 'am' ? item.descriptionAm || item.description : item.description,
      image: item.images[0] ?? '/images/gallery/iata-2026.jpg',
      date: item.date ?? '',
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
    return this.prisma.galleryItem.create({ data: { ...dto, createdById: user.id } }).then((item) => { void this.translations.translateGallery(item.id); return item; });
  }

  @Patch('gallery/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  updateGallery(@Param('id') id: string, @Body() dto: Partial<CreateGalleryDto>) {
    return this.prisma.galleryItem.update({ where: { id }, data: dto }).then((item) => { void this.translations.translateGallery(item.id); return item; });
  }

  @Delete('gallery/:id')
  @Roles(Role.WORKER, Role.ADMIN)
  deleteGallery(@Param('id') id: string) {
    return this.prisma.galleryItem.delete({ where: { id } });
  }

  @Get('faq/:id')
  @Public()
  async getFaqOne(@Param('id') id: string, @Query('locale') locale?: string) {
    const item = await this.prisma.fAQItem.findFirst({ where: { id, isActive: true } });
    if (!item) return null;
    return { ...item, question: locale === 'ar' ? item.questionAr || item.question : locale === 'am' ? item.questionAm || item.question : item.question, answer: locale === 'ar' ? item.answerAr || item.answer : locale === 'am' ? item.answerAm || item.answer : item.answer };
  }

  @Get('gallery/:id')
  @Public()
  async getGalleryOne(@Param('id') id: string, @Query('locale') locale?: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) return null;
    return { ...item, title: locale === 'ar' ? item.titleAr || item.title : locale === 'am' ? item.titleAm || item.title : item.title, category: locale === 'ar' ? item.categoryAr || item.category : locale === 'am' ? item.categoryAm || item.category : item.category, location: locale === 'ar' ? item.locationAr || item.location : locale === 'am' ? item.locationAm || item.location : item.location, description: locale === 'ar' ? item.descriptionAr || item.description : locale === 'am' ? item.descriptionAm || item.description : item.description, image: item.images[0] ?? '/images/gallery/iata-2026.jpg' };
  }
}
