import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}
  @Get() findAll(@Query() query: QueryTicketsDto, @CurrentUser() actor: User) { return this.tickets.findAll(query, actor); }
  @Get('analytics') analytics(@CurrentUser() actor: User) { return this.tickets.analytics(actor); }
  @Post() create(@Body() dto: CreateTicketDto, @CurrentUser() actor: User) { return this.tickets.create(dto, actor); }
  @Patch(':id') @Roles(Role.WORKER, Role.ADMIN, Role.TECH) update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() actor: User) { return this.tickets.update(id, dto, actor); }
  @Post(':id/refund') requestRefund(@Param('id') id: string, @Body('reason') reason: string | undefined, @CurrentUser() actor: User) { return this.tickets.requestRefund(id, reason, actor); }
}
