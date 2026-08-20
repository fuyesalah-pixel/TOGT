import { Controller, Get, Param, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}
  @Get('search') @Roles(Role.CUSTOMER) search(@Query('query') query: string, @CurrentUser() actor: User) { return this.tracking.search(query ?? '', actor); }
  @Get('member/:memberId') @Roles(Role.CUSTOMER) member(@Param('memberId') memberId: string, @CurrentUser() actor: User) { return this.tracking.getMember(memberId, actor); }
}
