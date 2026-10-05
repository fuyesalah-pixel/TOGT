import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public reviews: manually approved OR older than 24 hours (auto-publish).
   *  Reviews hidden by an admin are excluded regardless of age — the
   *  admin's hide decision must stick past the 24h auto-publish window. */
  findVisible() {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.review.findMany({
      where: {
        isHiddenByAdmin: false,
        OR: [{ isVisible: true }, { createdAt: { lte: dayAgo } }],
      },
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
    // isVisible=true  => explicit admin approval; clears any previous hide.
    // isVisible=false => admin hide; isHiddenByAdmin=true keeps the review
    // out of the public listing even after the 24h auto-publish kicks in.
    return this.prisma.review.update({
      where: { id },
      data: { isVisible, isHiddenByAdmin: !isVisible },
    });
  }
}
