import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCallRecordDto } from './dto/create-call-record.dto';
import { QueryCallRecordsDto } from './dto/query-call-records.dto';
import { UpdateCallRecordDto } from './dto/update-call-record.dto';

/**
 * Fields editable by WORKER (and ADMIN). name/phone are admin-only and also
 * available on create (a worker can create the record once).
 */
@Injectable()
export class CallRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCallRecordsDto, actor: User) {
    const where: Prisma.CallRecordWhereInput = {};
    if (query.teamNumber) where.teamNumber = query.teamNumber;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { teamNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.callRecord.findMany({
        where,
        include: {
          createdBy: { select: { id: true, email: true, fullName: true } },
          updatedBy: { select: { id: true, email: true, fullName: true } },
          history: {
            include: { changedBy: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.callRecord.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string, actor: User) {
    const record = await this.prisma.callRecord.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, fullName: true } },
        updatedBy: { select: { id: true, email: true, fullName: true } },
        history: {
          include: { changedBy: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!record) throw new NotFoundException('Call record not found');
    return record;
  }

  async create(dto: CreateCallRecordDto, actor: User) {
    const teamNumber = dto.teamNumber;
    return this.prisma.callRecord.create({
      data: {
        teamNumber,
        name: dto.name,
        phone: dto.phone,
        fatherName: dto.fatherName,
        passportNumber: dto.passportNumber,
        passportFileUrl: dto.passportFileUrl,
        otherFileUrl: dto.otherFileUrl,
        idImageUrl: dto.idImageUrl,
        serviceType: dto.serviceType ?? 'CONSULTING',
        packageTitle: dto.packageTitle,
        tripType: dto.tripType,
        destination: dto.destination,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : undefined,
        tripDuration: dto.tripDuration,
        passengerCount: dto.passengerCount,
        totalAmount: dto.totalAmount ?? 0,
        paidAmount: dto.paidAmount,
        remainingAmount: dto.remainingAmount,
        currency: dto.currency ?? 'ETB',
        paymentStatus: dto.paymentStatus,
        flightNumber: dto.flightNumber,
        flightDate: dto.flightDate ? new Date(dto.flightDate) : undefined,
        flightBookingStatus: dto.flightBookingStatus,
        airline: dto.airline,
        additionalInfo: dto.additionalInfo,
        createdById: actor.id,
        updatedById: actor.id,
        history: {
          create: {
            changedById: actor.id,
            changedByName: actor.fullName,
            field: 'created',
            note: `Call record created with team number ${teamNumber}`,
          },
        },
      },
      include: {
        history: { include: { changedBy: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } },
        createdBy: { select: { id: true, email: true, fullName: true } },
        updatedBy: { select: { id: true, email: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCallRecordDto, actor: User) {
    const record = await this.prisma.callRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Call record not found');

    const changes: { field: string; from: string; to: string }[] = [];
    const data: Prisma.CallRecordUpdateManyMutationInput = {};
    const map: Record<string, keyof typeof dto> = {
      teamNumber: 'teamNumber',
      fatherName: 'fatherName',
      passportNumber: 'passportNumber',
      passportFileUrl: 'passportFileUrl',
      otherFileUrl: 'otherFileUrl',
      idImageUrl: 'idImageUrl',
      serviceType: 'serviceType',
      packageTitle: 'packageTitle',
      tripType: 'tripType',
      destination: 'destination',
      departureDate: 'departureDate',
      tripDuration: 'tripDuration',
      passengerCount: 'passengerCount',
      totalAmount: 'totalAmount',
      paidAmount: 'paidAmount',
      remainingAmount: 'remainingAmount',
      currency: 'currency',
      paymentStatus: 'paymentStatus',
      flightNumber: 'flightNumber',
      flightDate: 'flightDate',
      flightBookingStatus: 'flightBookingStatus',
      airline: 'airline',
      additionalInfo: 'additionalInfo',
      name: 'name',
      phone: 'phone',
    };

    for (const field of Object.keys(map) as (keyof typeof map)[]) {
      const dtoKey = map[field];
      const value = dto[dtoKey];
      if (value === undefined) continue;
      const isDateField = field === 'departureDate' || field === 'flightDate';
      const next =
        isDateField && value
          ? new Date(value as string).toISOString()
          : String(value);
      const current =
        record[field as keyof typeof record] == null
          ? ''
          : record[field as keyof typeof record] instanceof Date
            ? (record[field as keyof typeof record] as Date).toISOString()
            : String(record[field as keyof typeof record]);
      (data as Record<string, unknown>)[field] =
        isDateField ? (value ? new Date(value as string) : undefined) : value;
      if (next !== current) {
        changes.push({ field, from: current, to: next });
      }
    }

    if (changes.length === 0) return record;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.callRecord.update({
        where: { id },
        data: { ...data, updatedById: actor.id },
        include: {
          history: {
            include: { changedBy: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      await tx.callRecordHistory.createMany({
        data: changes.map((c) => ({
          callRecordId: id,
          changedById: actor.id,
          changedByName: actor.fullName,
          field: c.field,
          fromValue: c.from,
          toValue: c.to,
        })),
      });
      return updated;
    });
  }

  async remove(id: string, actor: User) {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete call records');
    }
    const record = await this.prisma.callRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Call record not found');
    await this.prisma.callRecord.delete({ where: { id } });
    return { ok: true };
  }

  /** Return list of used team numbers for the dropdown. */
  async usedTeamNumbers(): Promise<{ used: string[] }> {
    const records = await this.prisma.callRecord.findMany({
      select: { teamNumber: true },
    });
    return { used: records.map((r) => r.teamNumber) };
  }

  async verify(id: string) {
    const record = await this.prisma.callRecord.findUnique({
      where: { id },
      select: { name: true, fatherName: true, idImageUrl: true },
    });
    if (!record) throw new NotFoundException('Call record not found');
    return {
      ...record,
      contact: {
        phones: ['+251 99 797 9741', '+251 99 797 9740'],
        email: 'info@togttrading.com',
        message: 'Please contact us for any information',
      },
    };
  }
}
