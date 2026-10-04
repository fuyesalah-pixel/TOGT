import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  // ── Consent flow (customers) ──────────────────────────────────────────────

  /** Search people to track + the current consent state with each. */
  @Get('people')
  @Roles(Role.CUSTOMER)
  people(@Query('query') query: string, @CurrentUser() actor: User) {
    return this.tracking.searchPeople(query ?? '', actor);
  }

  /** Requests I sent / pending requests addressed to me. */
  @Get('requests')
  @Roles(Role.CUSTOMER)
  requests(@CurrentUser() actor: User) {
    return this.tracking.listRequests(actor);
  }

  /** Mister A sends a tracking request to mister B. */
  @Post('requests')
  @Roles(Role.CUSTOMER)
  send(@Body('targetId') targetId: string, @CurrentUser() actor: User) {
    return this.tracking.sendRequest(targetId, actor);
  }

  /** Mister B accepts the request. */
  @Post('requests/:id/accept')
  @Roles(Role.CUSTOMER)
  accept(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.tracking.respond(id, true, actor);
  }

  /** Mister B declines the request (A is told it was declined). */
  @Post('requests/:id/decline')
  @Roles(Role.CUSTOMER)
  decline(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.tracking.respond(id, false, actor);
  }

  /** A withdraws a still-pending request. */
  @Delete('requests/:id')
  @Roles(Role.CUSTOMER)
  cancel(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.tracking.cancel(id, actor);
  }

  // ── Live tracking ─────────────────────────────────────────────────────────

  /**
   * Customers: everyone who accepted a tracking request and is traveling now.
   * (Staff use the group location endpoints; /tracking/member below also
   * accepts staff so they can look up any member without a request.)
   */
  @Get('search')
  @Roles(Role.CUSTOMER)
  search(@Query('query') query: string, @CurrentUser() actor: User) {
    return this.tracking.search(query ?? '', actor);
  }

  /** Live position of one member. Staff bypass the consent check. */
  @Get('member/:memberId')
  @Roles(Role.CUSTOMER, Role.WORKER, Role.GUIDE, Role.ADMIN, Role.TECH)
  member(@Param('memberId') memberId: string, @CurrentUser() actor: User) {
    return this.tracking.getMember(memberId, actor);
  }
}
