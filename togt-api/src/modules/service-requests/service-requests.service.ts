import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryServiceRequestsDto } from './dto/query-service-requests.dto';
import { safeUserSelect } from '../users/users.service';
import { UploadsService } from '../uploads/uploads.service';
import { ChatGateway } from '../chat/chat.gateway';
import { destinationCountry, originCountry } from '../../common/country';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly uploads: UploadsService,
    private readonly gateway: ChatGateway,
  ) {}

  async findAll(query: QueryServiceRequestsDto, actor: User) {
    const { status, serviceType, search, page = 1, limit = 20 } = query;

    const where: Prisma.ServiceRequestWhereInput = {};
    // Customers only ever see their own requests
    if (actor.role === Role.CUSTOMER) where.userId = actor.id;
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;
    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        include: {
          user: { select: safeUserSelect },
          assignedTo: { select: safeUserSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async create(dto: CreateServiceRequestDto, user: User) {
    if (user.role !== Role.CUSTOMER) throw new ForbiddenException('Staff accounts cannot submit public booking forms');
    const rawForm = dto.formData as Record<string, unknown>;
    const formData = { ...rawForm, originCountry: originCountry(user), destinationCountry: destinationCountry(rawForm, dto.serviceType) };
    const submittedAmount = typeof rawForm.amount === 'number' ? rawForm.amount : typeof rawForm.price === 'number' ? rawForm.price : undefined;
    const request = await this.prisma.serviceRequest.create({
      data: {
        userId: user.id,
        serviceType: dto.serviceType,
         formData: formData as Prisma.InputJsonValue,
         packageId: dto.packageId,
         amount: submittedAmount,
        progressHistory: {
          create: {
            statusFrom: 'CREATED',
            statusTo: 'PENDING',
            changedById: user.id,
            notes: 'Request created by customer',
          },
        },
      },
    });

    if (dto.packageId) {
      const attachedPackage = await this.prisma.package.findUnique({ where: { id: dto.packageId }, select: { groupId: true } });
      if (attachedPackage?.groupId) {
        const existingMember = await this.prisma.groupMember.findFirst({ where: { groupId: attachedPackage.groupId, userId: user.id } });
        if (!existingMember) {
          await this.prisma.groupMember.create({ data: { groupId: attachedPackage.groupId, userId: user.id, role: 'MEMBER' } });
          this.gateway.emitToRole('GUIDE', 'memberAdded', { groupId: attachedPackage.groupId, userId: user.id });
          this.gateway.emitToRole('WORKER', 'memberAdded', { groupId: attachedPackage.groupId, userId: user.id });
          this.gateway.emitToRole('ADMIN', 'memberAdded', { groupId: attachedPackage.groupId, userId: user.id });
          const guides = await this.prisma.groupMember.findMany({ where: { groupId: attachedPackage.groupId, role: 'GUIDE' }, select: { userId: true } });
          for (const guide of guides) {
            await this.notifications.notifyUser(guide.userId, { type: 'SYSTEM', title: 'New group member', message: `${user.fullName} was added to your group through a package booking.`, channel: 'IN_APP' });
          }
        }
      }
    }

    await this.notifications.notifyUser(user.id, {
      title: 'Request received',
      message: `Your ${dto.serviceType} request has been received and is pending review.`,
      type: 'SYSTEM',
    });
    this.gateway.emitToRole('WORKER', 'newServiceRequest', request);
    this.gateway.emitToRole('WORKER', 'requestCreated', request);
    this.gateway.emitToRole('ADMIN', 'requestReceived', request);

    return request;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, actor: User) {
    const existing = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { user: { select: safeUserSelect } },
    });
    if (!existing) throw new NotFoundException('Service request not found');

    const assignToMe = dto.assignToMe || !existing.assignedToId;

    const [updated] = await this.prisma.$transaction([
      this.prisma.serviceRequest.update({
        where: { id },
        data: {
          status: dto.status,
          ...(assignToMe && { assignedToId: actor.id }),
          completedAt: dto.status === 'COMPLETED' ? new Date() : null,
        },
      }),
      this.prisma.progressHistory.create({
        data: {
          serviceRequestId: id,
          statusFrom: existing.status,
          statusTo: dto.status,
          changedById: actor.id,
          notes: dto.notes,
        },
      }),
    ]);

    // Notify the request owner (in-app + best-effort email/SMS)
    await this.notifications.notifyUser(existing.userId, {
      title: 'Request status updated',
      message: `Your ${existing.serviceType} request is now ${dto.status.replace('_', ' ')}.${dto.notes ? ` Note: ${dto.notes}` : ''}`,
      type: 'STATUS_UPDATE',
    });
    this.gateway.emitToRole('WORKER', 'requestStatusUpdated', { request: updated, changedBy: actor.fullName, notes: dto.notes });
    this.gateway.emitToRole('ADMIN', 'requestStatusUpdated', { request: updated, changedBy: actor.fullName, notes: dto.notes });
    this.gateway.emitToUser(existing.userId, 'requestStatusUpdated', { request: updated, changedBy: actor.fullName, notes: dto.notes });
    if (existing.user?.email) {
      await this.notifications.sendEmail(
        existing.user.email,
        `TOGT request update: ${dto.status.replace('_', ' ')}`,
        `<p>Hello ${existing.user.fullName},</p><p>Your ${existing.serviceType} request status changed from <b>${existing.status}</b> to <b>${dto.status}</b>.</p>${dto.notes ? `<p>Note: ${dto.notes}</p>` : ''}<p>— TOGT Tour & Travel</p>`,
      );
    }
    if (existing.user?.phone) {
      await this.notifications.sendSms(
        existing.user.phone,
        `TOGT: your ${existing.serviceType} request is now ${dto.status.replace('_', ' ')}.`,
      );
    }

    return updated;
  }

  async findOne(id: string, actor: User) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { user: { select: safeUserSelect }, assignedTo: { select: safeUserSelect } },
    });
    if (!request) throw new NotFoundException('Service request not found');
    if (actor.role === Role.CUSTOMER && request.userId !== actor.id) throw new ForbiddenException('Not allowed');
    return request;
  }

  async getHistory(id: string, actor: User) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Service request not found');
    const privileged = actor.role !== Role.CUSTOMER;
    if (!privileged && request.userId !== actor.id) throw new ForbiddenException('Not allowed');

    return this.prisma.progressHistory.findMany({
      where: { serviceRequestId: id },
      include: { changedBy: { select: safeUserSelect } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addDocument(id: string, file: Express.Multer.File, actor: User) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Service request not found');
    if (actor.role === Role.CUSTOMER && request.userId !== actor.id) {
      throw new ForbiddenException('Not allowed');
    }
    const url = await this.uploads.upload(file, 'service-requests');
    const current = request.formData && typeof request.formData === 'object' && !Array.isArray(request.formData)
      ? request.formData as Record<string, unknown>
      : {};
    const documents = Array.isArray(current.documents) ? current.documents : [];
    return this.prisma.serviceRequest.update({
      where: { id },
      data: { formData: { ...current, documents: [...documents, url] } as Prisma.InputJsonValue },
    });
  }
}
