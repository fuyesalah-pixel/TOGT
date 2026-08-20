import { Controller, Get, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { destinationCountry, originCountry } from '../../common/country';

@Controller('stats')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  async overview(@CurrentUser() user: User) {
    const [
      totalUsers,
      activeUsers,
      totalPackages,
      activePackages,
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews,
      unreadNotifications,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.package.count(),
      this.prisma.package.count({ where: { isActive: true } }),
      this.prisma.serviceRequest.count(),
      this.prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.serviceRequest.count({
        where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } },
      }),
      this.prisma.serviceRequest.count({ where: { status: 'COMPLETED' } }),
      this.prisma.review.count(),
      this.prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalPackages,
      activePackages,
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalReviews,
      unreadNotifications,
    };
  }

  @Get('reports')
  @Roles(Role.ADMIN)
  async reports(@Query('from') from: string | undefined, @Query('to') to: string | undefined) {
    const start = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const end = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
    const [users, tickets, requests, packages, groups] = await Promise.all([
      this.prisma.user.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { id: true, fullName: true, email: true, role: true, createdAt: true, _count: { select: { serviceRequests: true, tickets: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.ticket.findMany({ where: { bookedAt: { gte: start, lte: end } }, include: { user: { select: { fullName: true, email: true } } }, orderBy: { bookedAt: 'desc' } }),
      this.prisma.serviceRequest.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { id: true, serviceType: true, status: true, createdAt: true, formData: true, user: { select: { fullName: true, email: true, nationality: true, phone: true, passportNumber: true } } } }),
      this.prisma.package.findMany({ select: { id: true, title: true, type: true, price: true } }),
      this.prisma.group.findMany({ where: { createdAt: { gte: start, lte: end } }, include: { members: { include: { user: { select: { fullName: true } } } }, planSteps: { select: { status: true } } } }),
    ]);
    const by = (items: string[]) => items.reduce<Record<string, number>>((result, key) => { result[key] = (result[key] ?? 0) + 1; return result; }, {});
    const sumBy = (items: Array<{ key: string; value: number }>) => items.reduce<Record<string, number>>((result, item) => { result[item.key] = (result[item.key] ?? 0) + item.value; return result; }, {});
    const revenueByMonth = sumBy(tickets.map((ticket) => ({ key: ticket.bookedAt.toISOString().slice(0, 7), value: ticket.totalAmount })));
    const airlineRevenue = sumBy(tickets.map((ticket) => ({ key: ticket.airline, value: ticket.totalAmount })));
    const packageCounts = by(requests.filter((request) => request.serviceType !== 'TICKET').map((request) => request.serviceType));
    const requestStatusCounts = by(requests.map((request) => request.status));
    const statusByService = Object.entries(requests.reduce<Record<string, Record<string, number>>>((result, request) => { result[request.serviceType] ??= {}; result[request.serviceType][request.status] = (result[request.serviceType][request.status] ?? 0) + 1; return result; }, {})).map(([service, statuses]) => ({ service, ...statuses }));
    const originCountries = by(requests.map((request) => originCountry(request.user)));
    const destinationCountries = by(requests.map((request) => destinationCountry(request.formData as Record<string, unknown>, request.serviceType)));
    const routes = by(requests.map((request) => `${originCountry(request.user)} -> ${destinationCountry(request.formData as Record<string, unknown>, request.serviceType)}`));
    const packagePopularity = packages.map((pkg) => ({ name: pkg.title, bookings: requests.filter((request) => request.formData && typeof request.formData === 'object' && (request.formData as Record<string, unknown>).packageId === pkg.id).length }));
    const totalRevenue = tickets.reduce((total, ticket) => total + ticket.totalAmount, 0);
    return { range: { from: start, to: end }, summary: { revenue: totalRevenue, users: users.length, tickets: tickets.length, packages: packages.length, activeGroups: groups.filter((group) => group.status === 'IN_PROGRESS').length, requests: requests.length }, revenueByMonth: Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue })), usersByRole: Object.entries(by(users.map((user) => user.role))).map(([name, value]) => ({ name, value })), requestsByType: Object.entries(packageCounts).map(([name, value]) => ({ name, value })), requestsByStatus: Object.entries(requestStatusCounts).map(([name, value]) => ({ name, value })), statusByService, revenueByService: [{ name: 'Ticket', revenue: totalRevenue }], originCountries: Object.entries(originCountries).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value), destinationCountries: Object.entries(destinationCountries).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value), routes: Object.entries(routes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10), packagePopularity: packagePopularity.sort((a, b) => b.bookings - a.bookings), userGrowth: Object.entries(by(users.map((user) => user.createdAt.toISOString().slice(0, 7)))).map(([name, users]) => ({ name, users })), airlineRevenue: Object.entries(airlineRevenue).map(([name, revenue]) => ({ name, revenue })), revenueRows: tickets.map((ticket) => ({ date: ticket.bookedAt, service: 'Ticket', customer: ticket.user.fullName, amount: ticket.totalAmount, status: ticket.status })), userRows: users.map((user) => ({ ...user, requests: user._count.serviceRequests, tickets: user._count.tickets })), ticketRows: tickets, groupRows: groups.map((group) => ({ id: group.id, name: group.name, members: group.members.length, guide: group.members.find((member) => member.role === 'GUIDE')?.user.fullName ?? 'Unassigned', status: group.status, progress: group.planSteps.length ? Math.round(group.planSteps.filter((step) => step.status === 'COMPLETED').length / group.planSteps.length * 100) : 0 })) };
  }
}
