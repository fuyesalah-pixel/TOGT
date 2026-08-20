import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public reviews: manually approved OR older than 24 hours (auto-publish). */
  findVisible() {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.review.findMany({
      where: { OR: [{ isVisible: true }, { createdAt: { lte: dayAgo } }] },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  findAll() {
    return this.prisma.review.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateReviewDto, user: User) {
    if (dto.serviceRequestId) {
      const request = await this.prisma.serviceRequest.findUnique({
        where: { id: dto.serviceRequestId },
      });
      if (!request || request.userId !== user.id) {
        throw new BadRequestException('Invalid service request');
      }
      if (request.status !== 'COMPLETED') {
        throw new BadRequestException('Only completed services can be reviewed');
      }
    }

    return this.prisma.review.create({
      data: {
        userId: user.id,
        serviceRequestId: dto.serviceRequestId,
        rating: dto.rating,
        reviewText: dto.reviewText,
        imageUrls: dto.imageUrls ?? [],
        isVisible: false, // appears publicly 24h after submission (or when approved)
      },
    });
  }

  async setVisibility(id: string, isVisible: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id }, data: { isVisible } });
  }
}
