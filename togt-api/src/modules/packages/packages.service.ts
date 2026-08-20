import { Injectable, NotFoundException } from '@nestjs/common';
import { PackageType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { ChatGateway } from '../chat/chat.gateway';

interface PackageFilters {
  type?: string;
  destination?: string;
}

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService, private readonly gateway: ChatGateway) {}

  private buildWhere(filters: PackageFilters, onlyActive: boolean): Prisma.PackageWhereInput {
    const where: Prisma.PackageWhereInput = {};
    if (onlyActive) where.isActive = true;
    if (filters.type) {
      // Prefix match: ?type=UMRAH matches UMRAH_ECONOMY, UMRAH_VIP, ...
      const prefix = filters.type.toUpperCase();
      const matches = Object.values(PackageType).filter((t) => t.startsWith(prefix));
      if (matches.length > 0) where.type = { in: matches };
    }
    if (filters.destination) {
      where.destination = { contains: filters.destination, mode: 'insensitive' };
    }
    return where;
  }

  findActive(filters: PackageFilters) {
    return this.prisma.package.findMany({
      where: this.buildWhere(filters, true),
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll(filters: PackageFilters) {
    return this.prisma.package.findMany({
      where: this.buildWhere(filters, false),
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreatePackageDto, userId: string) {
    return this.prisma.package.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        image: dto.image,
        images: dto.images ?? (dto.image ? [dto.image] : []),
        videoUrl: dto.videoUrl,
        price: dto.price,
        currency: dto.currency ?? 'ETB',
        duration: dto.duration,
        maxMembers: dto.maxMembers ?? 50,
        includes: dto.includes ?? [],
        excludes: dto.excludes ?? [],
        isCustom: dto.isCustom ?? false,
        destination: dto.destination,
        groupId: dto.groupId,
        createdById: userId,
      },
    }).then((pkg) => { this.gateway.emitToRole('CUSTOMER', 'packageCreated', pkg); this.gateway.emitToRole('WORKER', 'packageCreated', pkg); return pkg; });
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.package.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.images !== undefined && { image: dto.images[0] ?? null }),
      },
    });
    this.gateway.emitToRole('CUSTOMER', 'packageUpdated', updated);
    this.gateway.emitToRole('WORKER', 'packageUpdated', updated);
    return updated;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const deleted = await this.prisma.package.delete({ where: { id } });
    this.gateway.emitToRole('CUSTOMER', 'packageDeleted', { id });
    this.gateway.emitToRole('WORKER', 'packageDeleted', { id });
    return deleted;
  }

  async toggle(id: string) {
    const pkg = await this.ensureExists(id);
    return this.prisma.package.update({
      where: { id },
      data: { isActive: !pkg.isActive },
    });
  }

  async setGroup(id: string, groupId: string | null) {
    await this.ensureExists(id);
    if (groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: groupId } });
      if (!group) throw new NotFoundException('Group not found');
    }
    const updated = await this.prisma.package.update({ where: { id }, data: { groupId } });
    this.gateway.emitToRole('CUSTOMER', 'packageAttachedToGroup', updated);
    this.gateway.emitToRole('WORKER', 'packageAttachedToGroup', updated);
    return updated;
  }

  private async ensureExists(id: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }
}
