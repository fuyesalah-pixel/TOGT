import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, TicketStatus, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const staff = [Role.WORKER, Role.ADMIN, Role.TECH];

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService, private readonly gateway: ChatGateway) {}

  async findAll(query: QueryTicketsDto, actor: User) {
    const where: Prisma.TicketWhereInput = actor.role === Role.CUSTOMER ? { userId: actor.id } : {};
    if (query.status) where.status = query.status;
    if (query.search) where.OR = [
      { ticketNumber: { contains: query.search, mode: 'insensitive' } },
      { user: { email: { contains: query.search, mode: 'insensitive' } } },
      { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
    ];
    const [data, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({ where, include: { user: { select: { id: true, email: true, fullName: true } }, history: { orderBy: { createdAt: 'asc' } } }, orderBy: { departureAt: 'asc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async analytics(actor: User) {
    if (actor.role === Role.CUSTOMER || actor.role === Role.GUIDE) throw new ForbiddenException('Only staff can view ticket analytics');
    const tickets = await this.prisma.ticket.findMany({ where: { status: { not: TicketStatus.CANCELLED } }, select: { airline: true, origin: true, destination: true, totalAmount: true, bookedAt: true } });
    const airlineMap = new Map<string, number>();
    const routeMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    for (const ticket of tickets) {
      airlineMap.set(ticket.airline, (airlineMap.get(ticket.airline) ?? 0) + ticket.totalAmount);
      const route = `${ticket.origin} -> ${ticket.destination}`;
      routeMap.set(route, (routeMap.get(route) ?? 0) + 1);
      const month = ticket.bookedAt.toISOString().slice(0, 7);
      monthMap.set(month, (monthMap.get(month) ?? 0) + ticket.totalAmount);
    }
    const sort = <T extends [string, number]>(entries: T[]) => entries.sort((a, b) => b[1] - a[1]);
    return { revenueByAirline: sort([...airlineMap]), popularRoutes: sort([...routeMap]), monthlyRevenue: sort([...monthMap]) };
  }

  async create(dto: CreateTicketDto, actor: User) {
    if (actor.role !== Role.CUSTOMER) throw new ForbiddenException('Staff accounts cannot book tickets');
    const ticketNumber = `TOGT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return this.prisma.ticket.create({ data: { ticketNumber, userId: actor.id, airline: dto.airline, flightNumber: dto.flightNumber, origin: dto.origin, destination: dto.destination, departureAt: new Date(dto.departureAt), arrivalAt: dto.arrivalAt ? new Date(dto.arrivalAt) : undefined, passengerName: dto.passengerName, passengerDetails: dto.passengerDetails as Prisma.InputJsonValue, seat: dto.seat, cabinClass: dto.cabinClass, paymentMethod: dto.paymentMethod, totalAmount: dto.totalAmount, currency: dto.currency ?? 'ETB', status: TicketStatus.CONFIRMED, history: { create: { statusTo: TicketStatus.CONFIRMED, changedById: actor.id, changedByName: actor.fullName, note: 'Ticket booked by customer', reason: 'Booking created' } } } });
  }

  async update(id: string, dto: UpdateTicketDto, actor: User) {
    if (actor.role !== Role.WORKER && actor.role !== Role.ADMIN && actor.role !== Role.TECH) {
      throw new ForbiddenException('Only staff can update tickets');
    }
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.ticket.update({ where: { id }, data: { status: dto.status, completedAt: dto.status === TicketStatus.COMPLETED ? new Date() : undefined, ...(dto.status === TicketStatus.REFUND_REQUESTED ? { refundRequestedAt: new Date() } : {}) } });
      await tx.ticketHistory.create({ data: { ticketId: id, statusFrom: ticket.status, statusTo: dto.status, changedById: actor.id, changedByName: actor.fullName, note: dto.note, reason: dto.note } });
      return result;
    });
    await this.notifications.notifyUser(ticket.userId, { title: 'Ticket status updated', message: `Ticket ${ticket.ticketNumber} is now ${dto.status.replace('_', ' ')}`, type: 'STATUS_UPDATE' });
    this.gateway.emitToRole('WORKER', 'ticketStatusChanged', { ticket: updated, changedBy: actor.fullName, reason: dto.note });
    this.gateway.emitToRole('ADMIN', 'ticketStatusChanged', { ticket: updated, changedBy: actor.fullName, reason: dto.note });
    this.gateway.emitToUser(ticket.userId, 'ticketStatusChanged', { ticket: updated, changedBy: actor.fullName, reason: dto.note });
    return updated;
  }

  async requestRefund(id: string, reason: string | undefined, actor: User) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== actor.id || actor.role !== Role.CUSTOMER) throw new ForbiddenException('Not allowed');
    return this.update(id, { status: TicketStatus.REFUND_REQUESTED, note: reason || 'Customer requested a refund' }, { ...actor, role: Role.WORKER });
  }
}
