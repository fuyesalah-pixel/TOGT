import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ValkeyService } from '../../valkey/valkey.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
import { UploadsService } from '../uploads/uploads.service';

/** User fields safe to expose via the API (never expose googleId). */
export const safeUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  address: true,
  birthday: true,
  nationality: true,
  passportIssueDate: true,
  avatarUrl: true,
  passportNumber: true,
  passportExpiry: true,
  role: true,
  status: true,
  languagePref: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly valkey: ValkeyService,
    private readonly notifications: NotificationsService,
    private readonly chatGateway: ChatGateway,
    private readonly uploads: UploadsService,
  ) {}

  async findAll(query: QueryUsersDto) {
    const { search, role, status, serviceType, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (serviceType) {
      where.serviceRequests = { some: { serviceType } };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
         select: { ...safeUserSelect, _count: { select: { serviceRequests: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async registerDeviceToken(userId: string, token: string, platform?: string) {
    return this.prisma.deviceToken.upsert({ where: { token }, update: { userId, platform }, create: { userId, token, platform } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
         _count: { select: { serviceRequests: true, reviews: true, tickets: true, groupMembers: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, actor: User) {
    if (actor.role === Role.WORKER && dto.role && dto.role !== Role.CUSTOMER && dto.role !== Role.GUIDE) {
      throw new ForbiddenException('Workers can only assign Customer or Guide roles');
    }
    if (dto.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create admin users');
    }
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('A user with this email already exists');

    const created = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role ?? Role.CUSTOMER,
        languagePref: dto.languagePref ?? 'en',
        // Placeholder — upgraded to a real Google account on first login (email match)
        googleId: `manual:${randomUUID()}`,
      },
      select: safeUserSelect,
    });
    await this.prisma.profileChangeLog.create({ data: { userId: created.id, fieldName: 'profile', oldValue: null, newValue: 'created' } });
    return created;
  }

  /**
   * Mirror a call-tracker record into a real User (Customers tab) if it does
   * not already exist. Idempotent: matched by phone first, then email.
   * When a real email is provided on the call record it is used for the
   * mirrored account (instead of the placeholder tracker-…@call-tracker.local
   * address), so the user can later sign in / be reached by email.
   * Imported from CallRecordsService so tracker additions automatically show
   * up in the worker/admin Users tabs.
   */
  async mirrorCustomerFromCallRecord(input: {
    name: string;
    phone: string;
    email?: string | null;
    fatherName?: string | null;
    idImageUrl?: string | null;
    source: string;
  }) {
    const realEmail = input.email?.trim().toLowerCase() || null;
    const trackerEmail = `tracker-${input.phone.replace(/[^0-9]/g, '') || 'unknown'}@call-tracker.local`;
    const existing =
      (input.phone &&
        (await this.prisma.user.findFirst({
          where: { OR: [{ phone: input.phone }, { email: { in: realEmail ? [realEmail, trackerEmail] : [trackerEmail] } }] },
          select: { id: true, email: true },
        }))) ||
      null;
    if (existing) {
      // Upgrade the placeholder tracker address to the real email when one is
      // now provided (ignore failures — e.g. the email is already taken).
      if (realEmail && existing.email === trackerEmail) {
        try {
          return await this.prisma.user.update({ where: { id: existing.id }, data: { email: realEmail }, select: { id: true } });
        } catch {
          return existing;
        }
      }
      return existing;
    }

    return this.prisma.user.create({
      data: {
        email: realEmail ?? trackerEmail,
        fullName: input.name,
        phone: input.phone || null,
        avatarUrl: input.idImageUrl || null,
        role: Role.CUSTOMER,
        status: 'ACTIVE',
        // Placeholder — upgraded to a real Google account on first login (email match)
        googleId: `mirror:${randomUUID()}`,
      },
      select: { id: true },
    });
  }

  /**
   * Replace the placeholder tracker-…@call-tracker.local address of the user
   * mirrored for a call record with a real email address (set/changed on the
   * call tracker form). No-op when the account already uses a real address.
   */
  async upgradeTrackerEmail(phone: string, realEmail: string) {
    const email = realEmail.trim().toLowerCase();
    const trackerEmail = `tracker-${(phone ?? '').replace(/[^0-9]/g, '') || 'unknown'}@call-tracker.local`;
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, { email: trackerEmail }] },
      select: { id: true, email: true },
    });
    if (!user || !user.email.endsWith('@call-tracker.local')) return null;
    try {
      return await this.prisma.user.update({ where: { id: user.id }, data: { email }, select: { id: true, email: true } });
    } catch {
      return null; // email already taken by another account — keep the placeholder
    }
  }

  async update(id: string, dto: UpdateUserDto, actor: User) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');

    const isSelf = actor.id === id;
    const isPrivileged = actor.role === Role.ADMIN || actor.role === Role.WORKER;
    if (!isSelf && !isPrivileged) throw new ForbiddenException('Not allowed');
    // Workers can never edit ADMIN users
    if (target.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin users cannot be modified');
    }

    const data: Prisma.UserUpdateInput = {
         ...(dto.fullName !== undefined && { fullName: dto.fullName }),
         ...(dto.phone !== undefined && { phone: dto.phone }),
         ...(dto.address !== undefined && { address: dto.address }),
         ...(dto.birthday !== undefined && { birthday: dto.birthday ? new Date(dto.birthday) : null }),
         ...(dto.nationality !== undefined && { nationality: dto.nationality }),
         ...(dto.passportIssueDate !== undefined && { passportIssueDate: dto.passportIssueDate ? new Date(dto.passportIssueDate) : null }),
        ...(dto.passportNumber !== undefined && { passportNumber: dto.passportNumber }),
        ...(dto.passportExpiry !== undefined && {
          passportExpiry: dto.passportExpiry ? new Date(dto.passportExpiry) : null,
        }),
         ...(dto.languagePref !== undefined && { languagePref: dto.languagePref }),
    };
    const changes = (['fullName', 'phone', 'address', 'birthday', 'nationality', 'passportIssueDate', 'passportNumber', 'passportExpiry', 'languagePref'] as const)
      .filter((field) => dto[field] !== undefined)
      .map((field) => ({
        userId: id,
        fieldName: field,
        oldValue: target[field] instanceof Date ? target[field]?.toISOString() : target[field]?.toString() ?? null,
        newValue: data[field] instanceof Date ? data[field]?.toISOString() : data[field]?.toString() ?? null,
      }))
      .filter((change) => change.oldValue !== change.newValue);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id }, data, select: safeUserSelect });
      if (changes.length) await tx.profileChangeLog.createMany({ data: changes });
      return result;
    });
    return updated;
  }

  async getChanges(id: string, actor: User) {
    if (actor.role !== Role.ADMIN && actor.role !== Role.WORKER && actor.id !== id) {
      throw new ForbiddenException('Not allowed');
    }
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.profileChangeLog.findMany({ where: { userId: id }, orderBy: { changedAt: 'desc' } });
  }

  /**
   * Self-service account deletion (the signed-in user only).
   *
   * The user row is kept as an anonymous tombstone because paid tickets,
   * invoices and flight orders must survive for the 7-year financial-records
   * retention period. Everything personal is removed or anonymised:
   * profile fields, passport/ID scans and other R2 objects, reviews, chat
   * messages and attachments, notifications, device tokens, known-device
   * fingerprints, location history, tracking requests, group membership and
   * profile-change logs. Requests are kept for their payment ledger fields
   * but their `formData` (which holds personal details and document keys) is
   * erased. Sessions are revoked and the account can no longer authenticate.
   */
  async deleteMe(actor: User) {
    const user = await this.prisma.user.findUnique({ where: { id: actor.id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Administrator accounts cannot be deleted in the app. Contact info@togttrading.com.',
      );
    }

    const [requests, reviews, messages] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { userId: user.id },
        select: { id: true, formData: true },
      }),
      this.prisma.review.findMany({ where: { userId: user.id }, select: { imageUrls: true } }),
      this.prisma.chatMessage.findMany({
        where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
        select: { fileUrl: true },
      }),
    ]);

    // Uploaded documents live either as public-bucket URLs or as
    // `r2-private://<key>` values inside a request's formData.
    const documentKeys = requests.flatMap((request) => {
      const formData =
        request.formData && typeof request.formData === 'object' && !Array.isArray(request.formData)
          ? (request.formData as Record<string, unknown>)
          : {};
      return Array.isArray(formData.documents)
        ? formData.documents.filter((value): value is string => typeof value === 'string')
        : [];
    });
    const fileUrls = [
      user.avatarUrl,
      ...reviews.flatMap((review) => review.imageUrls),
      ...messages.map((message) => message.fileUrl),
      ...documentKeys,
    ];

    let filesDeleted = 0;
    try {
      filesDeleted = await this.uploads.deleteFiles(fileUrls);
    } catch (error) {
      // Storage cleanup is retried manually if needed; erasing the database
      // records must not be blocked by an R2 outage.
      this.logger.warn(`R2 cleanup failed for deleted user ${user.id}: ${String(error)}`);
    }

    await this.valkey.delPattern(`refresh:${user.id}:*`);

    const anonymousId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({
        where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      });
      await tx.conversation.deleteMany({
        where: { OR: [{ customerId: user.id }, { workerId: user.id }] },
      });
      await tx.review.deleteMany({ where: { userId: user.id } });
      await tx.notification.deleteMany({ where: { userId: user.id } });
      await tx.deviceToken.deleteMany({ where: { userId: user.id } });
      await tx.knownDevice.deleteMany({ where: { userId: user.id } });
      await tx.profileChangeLog.deleteMany({ where: { userId: user.id } });
      await tx.locationTracking.deleteMany({ where: { userId: user.id } });
      await tx.geofenceAlert.deleteMany({ where: { memberId: user.id } });
      await tx.trackingRequest.deleteMany({
        where: { OR: [{ requesterId: user.id }, { targetId: user.id }] },
      });
      await tx.groupMember.deleteMany({ where: { userId: user.id } });
      await tx.tourPlanStep.updateMany({
        where: { confirmedById: user.id },
        data: { confirmedById: null },
      });
      // Staff accounts: drop any request assignment so the tombstone is not
      // shown as an active handler.
      await tx.serviceRequest.updateMany({
        where: { assignedToId: user.id },
        data: { assignedToId: null },
      });
      // Keep the payment ledger fields (amount, paymentId, status, dates)
      // for financial retention; erase personal form answers and file keys.
      await tx.serviceRequest.updateMany({
        where: { userId: user.id },
        data: { formData: {} },
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: `deleted+${anonymousId}@deleted.togt.local`,
          googleId: `deleted:${anonymousId}`,
          fullName: 'Deleted account',
          phone: null,
          address: null,
          birthday: null,
          nationality: null,
          passportIssueDate: null,
          passportNumber: null,
          passportExpiry: null,
          avatarUrl: null,
          languagePref: 'en',
          role: Role.CUSTOMER,
          status: 'TERMINATED',
        },
      });
    });

    this.logger.log(
      `Account ${user.id} deleted (anonymised, ${filesDeleted} stored file(s) removed)`,
    );
    return { deleted: true, filesDeleted };
  }

  /** Soft-terminate a user (admin only). Also revokes all sessions. */
  async terminate(id: string, actor: User) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.ADMIN) throw new ForbiddenException('Admin users cannot be terminated');
    if (target.id === actor.id) throw new ForbiddenException('You cannot terminate yourself');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: 'TERMINATED' },
      select: safeUserSelect,
    });
    await this.prisma.profileChangeLog.create({ data: { userId: id, fieldName: 'status', oldValue: target.status, newValue: 'TERMINATED' } });
    // Force logout: drop all refresh tokens for this user
    await this.valkey.delPattern(`refresh:${id}:*`);
    return updated;
  }

  async setStatus(id: string, status: 'ACTIVE' | 'TERMINATED', actor: User) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.ADMIN && target.id !== actor.id) {
      throw new ForbiddenException('Admin users cannot be changed here');
    }
    if (target.id === actor.id && status === 'TERMINATED') {
      throw new ForbiddenException('You cannot terminate yourself');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: safeUserSelect,
    });

    if (target.status !== status) {
      await this.prisma.profileChangeLog.create({ data: { userId: id, fieldName: 'status', oldValue: target.status, newValue: status } });
    }

    if (status === 'TERMINATED') {
      await this.valkey.delPattern(`refresh:${id}:*`);
    }
    return updated;
  }

  async changeRole(id: string, role: Role, actor: User) {
    if (id === actor.id) throw new ForbiddenException('You cannot change your own role');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    if (actor.role === Role.WORKER && role !== Role.CUSTOMER && role !== Role.GUIDE) {
      throw new ForbiddenException('Workers cannot assign Worker, Admin, or Tech roles');
    }

    const effectiveRole = target.email.trim().toLowerCase() === 'fuadnesredinhiyar@gmail.com' ? Role.ADMIN : role;
    await this.prisma.$transaction(async (tx) => {
      if (target.role === Role.WORKER) {
        await tx.serviceRequest.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
      }
      if (target.role === Role.GUIDE) {
        await tx.groupMember.deleteMany({ where: { userId: id, role: 'GUIDE' } });
      }
      await tx.user.update({ where: { id }, data: { role: effectiveRole } });
      await tx.profileChangeLog.create({ data: { userId: id, fieldName: 'role', oldValue: target.role, newValue: effectiveRole } });
    });

    // Role change takes effect on next access token; revoke refresh sessions to be safe
    await this.valkey.delPattern(`refresh:${id}:*`);
    this.chatGateway.emitToUser(id, 'roleChanged', { userId: id, newRole: effectiveRole });
    this.chatGateway.emitToUser(actor.id, 'roleChangedConfirmation', { userId: id, newRole: effectiveRole });
    await this.notifications.notifyUser(id, { type: 'SYSTEM', title: 'Role Updated', message: `Your role has been changed to ${effectiveRole}. Please sign in again to access your new dashboard.`, channel: 'IN_APP' });
    const updated = await this.prisma.user.findUnique({ where: { id }, select: safeUserSelect });
    return updated;
  }
}
