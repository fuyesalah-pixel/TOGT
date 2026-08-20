import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('visible')
  @Public()
  findVisible() {
    return this.reviews.findVisible();
  }

  @Get('all')
  @Roles(Role.ADMIN)
  findAll() {
    return this.reviews.findAll();
  }

  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: User) {
    return this.reviews.create(dto, user);
  }

  @Patch(':id/visibility')
  @Roles(Role.ADMIN)
  setVisibility(@Param('id') id: string, @Body() dto: SetVisibilityDto) {
    return this.reviews.setVisibility(id, dto.isVisible);
  }
}
