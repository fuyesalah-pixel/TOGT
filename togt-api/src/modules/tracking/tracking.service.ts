import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, actor: User) {
    if (actor.role !== Role.CUSTOMER) throw new ForbiddenException('Customer tracking only');
    const groups = await this.prisma.group.findMany({ where: { status: 'IN_PROGRESS', members: { some: { userId: actor.id, role: 'MEMBER' } } }, include: { members: { where: { userId: actor.id }, include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } } } });
    const member = groups.flatMap((group) => group.members.map((item) => ({ group, item }))).find(({ item }) => `${item.user.fullName} ${item.user.email} ${item.user.id}`.toLowerCase().includes(query.toLowerCase()));
    if (!member) throw new NotFoundException('Member not found in any active group');
    return this.getMember(member.item.userId, actor, member.group.id);
  }

  async getMember(memberId: string, actor: User, groupId?: string) {
    if (actor.role !== Role.CUSTOMER) throw new ForbiddenException('Customer tracking only');
    const membership = await this.prisma.groupMember.findFirst({ where: { userId: actor.id, groupId: groupId ?? undefined, group: { status: 'IN_PROGRESS' } } });
    if (!membership || membership.userId !== memberId) throw new ForbiddenException('You cannot track this member');
    const member = await this.prisma.user.findUnique({ where: { id: memberId }, select: { id: true, fullName: true, email: true, phone: true } });
    const guide = await this.prisma.groupMember.findFirst({ where: { groupId: membership.groupId, role: 'GUIDE' }, select: { user: { select: { id: true, fullName: true } } } });
    const latest = await this.prisma.locationTracking.findFirst({ where: { groupId: membership.groupId, userId: memberId }, orderBy: { createdAt: 'desc' } });
    const guideLocation = guide ? await this.prisma.locationTracking.findFirst({ where: { groupId: membership.groupId, userId: guide.user.id }, orderBy: { createdAt: 'desc' } }) : null;
    const distance = latest && guideLocation ? this.distance(latest.latitude, latest.longitude, guideLocation.latitude, guideLocation.longitude) : 0;
    const age = latest ? Date.now() - latest.createdAt.getTime() : Infinity;
    return { memberId: member?.id, memberName: member?.fullName, phone: member?.phone, groupId: membership.groupId, groupName: (await this.prisma.group.findUnique({ where: { id: membership.groupId }, select: { name: true } }))?.name, guideLocation: guideLocation ? { latitude: guideLocation.latitude, longitude: guideLocation.longitude, name: guide?.user.fullName } : null, memberLocation: latest ? { latitude: latest.latitude, longitude: latest.longitude } : null, distance, status: age > 300000 ? 'OFFLINE' : distance > 1000 ? 'DANGER' : distance > 500 ? 'WARNING' : 'SAFE', lastUpdated: latest?.createdAt ?? null };
  }

  private distance(aLat: number, aLng: number, bLat: number, bLng: number) { const radians = (value: number) => value * Math.PI / 180; const dLat = radians(bLat - aLat); const dLng = radians(bLng - aLng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2; return 6371000 * 2 * Math.asin(Math.sqrt(h)); }
}
