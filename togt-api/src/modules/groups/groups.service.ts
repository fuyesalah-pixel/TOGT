import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { safeUserSelect } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { LocationDto } from './dto/location.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';

const groupInclude = {
  members: { include: { user: { select: safeUserSelect } } },
  planSteps: { orderBy: { estimatedAt: 'asc' as const } },
} satisfies Prisma.GroupInclude;

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService, private readonly gateway: ChatGateway) {}

  findAll(actor: User) {
    const where: Prisma.GroupWhereInput = {};
    // Guides see only groups they guide
    if (actor.role === Role.GUIDE) {
      where.members = { some: { userId: actor.id, role: 'GUIDE' } };
    } else if (actor.role === Role.WORKER) {
      where.isHidden = false;
    } else if (actor.role === Role.CUSTOMER) {
      where.members = { some: { userId: actor.id, role: 'MEMBER' } };
    }
    return this.prisma.group.findMany({
      where,
      include: groupInclude,
      orderBy: { startDate: 'asc' },
    });
  }

  async toggleHidden(id: string, isHidden: boolean) {
    await this.ensureExists(id);
    return this.prisma.group.update({ where: { id }, data: { isHidden }, include: groupInclude });
  }

  create(dto: CreateGroupDto, user: User) {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        packageId: dto.packageId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdById: user.id,
      },
      include: groupInclude,
    }).then((group) => { this.gateway.emitToRole('GUIDE', 'groupCreated', group); this.gateway.emitToRole('ADMIN', 'groupCreated', group); return group; });
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.packageId !== undefined && { packageId: dto.packageId }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: groupInclude,
    });
    this.gateway.emitToRole('GUIDE', 'groupUpdated', updated);
    this.gateway.emitToRole('WORKER', 'groupUpdated', updated);
    this.gateway.emitToRole('ADMIN', 'groupUpdated', updated);
    return updated;
  }

  async addMembers(id: string, dto: AddMembersDto) {
    await this.ensureExists(id);
    const existing = await this.prisma.groupMember.findMany({
      where: { groupId: id, userId: { in: dto.userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((m) => m.userId));
    const newIds = dto.userIds.filter((uid) => !existingIds.has(uid));

    if (newIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: newIds.map((userId) => ({
          groupId: id,
          userId,
          role: dto.role ?? 'MEMBER',
        })),
      });
      if ((dto.role ?? 'MEMBER') === 'GUIDE') {
        const group = await this.prisma.group.findUnique({ where: { id }, select: { name: true, startDate: true, endDate: true } });
        for (const userId of newIds) {
          await this.notifications.notifyUser(userId, { type: 'SYSTEM', title: 'New Group Assignment', message: `${group?.name ?? 'A group'} needs your guidance. Review and accept the assignment.`, channel: 'IN_APP', payload: { groupId: id, action: 'group_assignment' } });
        }
      }
    }

    const group = await this.prisma.group.findUnique({ where: { id }, include: groupInclude });
    this.gateway.emitToRole('GUIDE', 'memberAdded', { groupId: id, userIds: newIds });
    this.gateway.emitToRole('WORKER', 'memberAdded', { groupId: id, userIds: newIds });
    this.gateway.emitToRole('ADMIN', 'memberAdded', { groupId: id, userIds: newIds });
    return group;
  }

  async alertGroup(id: string, actor: User, type: 'URGENT' | 'INFO' | 'WARNING', message: string) {
    if (actor.role !== Role.ADMIN) throw new NotFoundException('Not allowed');
    const group = await this.prisma.group.findUnique({ where: { id }, include: { members: { select: { userId: true } } } });
    if (!group) throw new NotFoundException('Group not found');
    for (const member of group.members) await this.notifications.notifyUser(member.userId, { type: 'ALERT', title: `${type} group alert`, message, channel: 'IN_APP', payload: { groupId: id, alertType: type } });
    this.gateway.emitToRole('GUIDE', 'groupAlert', { groupId: id, type, message });
    this.gateway.emitToRole('WORKER', 'groupAlert', { groupId: id, type, message });
    return { sent: group.members.length };
  }

  async removeMember(id: string, userId: string) {
    await this.ensureExists(id);
    const result = await this.prisma.groupMember.deleteMany({ where: { groupId: id, userId } });
    this.gateway.emitToRole('GUIDE', 'memberRemoved', { groupId: id, userId });
    this.gateway.emitToRole('WORKER', 'memberRemoved', { groupId: id, userId });
    this.gateway.emitToRole('ADMIN', 'memberRemoved', { groupId: id, userId });
    return result;
  }

  async updateLocation(id: string, user: User, dto: LocationDto) {
    const member = await this.prisma.groupMember.findFirst({ where: { groupId: id, userId: user.id } });
    const group = await this.prisma.group.findUnique({ where: { id }, include: { members: { select: { userId: true, role: true } } } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.status !== 'IN_PROGRESS') throw new NotFoundException('Location sharing is disabled until the group is current');
    if (!member && group?.createdById !== user.id && user.role !== Role.ADMIN) {
      throw new NotFoundException('You are not assigned to this group');
    }
    const location = await this.prisma.locationTracking.create({ data: { groupId: id, userId: user.id, latitude: dto.latitude, longitude: dto.longitude, accuracy: dto.accuracy } });
    this.gateway.emitToRole('GUIDE', 'memberLocationUpdate', location);
    this.gateway.emitToRole('WORKER', 'memberLocationUpdate', location);
    this.gateway.emitToRole('ADMIN', 'memberLocationUpdate', location);
    await this.checkGeofence(id, user, location, group.members);
    return location;
  }

  private async checkGeofence(id: string, user: User, location: { latitude: number; longitude: number }, members: Array<{ userId: string; role: string }>) {
    const current = members.find((member) => member.userId === user.id);
    if (!current || current.role === 'GUIDE') return;
    const guideIds = members.filter((member) => member.role === 'GUIDE').map((member) => member.userId);
    const guideLocations = await this.prisma.locationTracking.findMany({ where: { groupId: id, userId: { in: guideIds } }, orderBy: { createdAt: 'desc' }, take: guideIds.length });
    const guide = guideLocations[0];
    if (!guide) return;
    const radians = (value: number) => value * Math.PI / 180;
    const dLat = radians(guide.latitude - location.latitude);
    const dLng = radians(guide.longitude - location.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(location.latitude)) * Math.cos(radians(guide.latitude)) * Math.sin(dLng / 2) ** 2;
    const distanceMeters = 6371000 * 2 * Math.asin(Math.sqrt(h));
    const existing = await this.prisma.geofenceAlert.findUnique({ where: { groupId_memberId: { groupId: id, memberId: user.id } } });
    const now = Date.now();
    if (distanceMeters > 1000 && (!existing || !existing.active || now - existing.lastAlertAt.getTime() >= 5 * 60 * 1000)) {
      const alert = await this.prisma.geofenceAlert.upsert({ where: { groupId_memberId: { groupId: id, memberId: user.id } }, create: { groupId: id, memberId: user.id, distanceMeters }, update: { distanceMeters, active: true, resolvedAt: null, lastAlertAt: new Date() } });
      const payload = { alert, memberId: user.id, memberName: user.fullName, distanceMeters, location };
      this.gateway.emitToRole('GUIDE', 'geofenceAlarm', payload);
      this.gateway.emitToRole('WORKER', 'geofenceAlarm', payload);
      for (const recipientId of [...guideIds, ...(members.filter((member) => member.role !== 'GUIDE').map((member) => member.userId))]) await this.notifications.notifyUser(recipientId, { type: 'ALERT', title: 'Geofence alarm', message: `${user.fullName} is ${Math.round(distanceMeters)}m from the guide.`, channel: 'IN_APP', payload });
    } else if (distanceMeters <= 1000 && existing?.active) {
      const resolved = await this.prisma.geofenceAlert.update({ where: { id: existing.id }, data: { distanceMeters, active: false, resolvedAt: new Date() } });
      this.gateway.emitToRole('GUIDE', 'geofenceResolved', { alert: resolved, memberId: user.id, memberName: user.fullName, distanceMeters });
      this.gateway.emitToRole('WORKER', 'geofenceResolved', { alert: resolved, memberId: user.id, memberName: user.fullName, distanceMeters });
    }
  }

  async getLocations(id: string) {
    const members = await this.prisma.groupMember.findMany({ where: { groupId: id }, include: { user: { select: safeUserSelect } } });
    const latest = await Promise.all(members.map(async (member) => ({ member, location: await this.prisma.locationTracking.findFirst({ where: { groupId: id, userId: member.userId }, orderBy: { createdAt: 'desc' } }) })));
    const guideLocations = latest.filter((item) => item.member.role === 'GUIDE' && item.location);
    const guide = guideLocations[0]?.location;
    const distance = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
      const radians = (value: number) => value * Math.PI / 180;
      const earth = 6371000;
      const dLat = radians(b.latitude - a.latitude);
      const dLng = radians(b.longitude - a.longitude);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
      return 2 * earth * Math.asin(Math.sqrt(h));
    };
    return latest.filter((item) => item.location).map(({ member, location }) => ({ user: member.user, role: member.role, latitude: location!.latitude, longitude: location!.longitude, accuracy: location!.accuracy, createdAt: location!.createdAt, distanceMeters: guide && member.role !== 'GUIDE' ? distance(guide, location!) : 0 }));
  }

  async getGroupLocation(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id }, include: { packages: { select: { destination: true } }, members: { where: { role: 'GUIDE' }, select: { userId: true } } } });
    if (!group) throw new NotFoundException('Group not found');
    const guide = await this.prisma.locationTracking.findFirst({ where: { groupId: id, userId: { in: group.members.map((member) => member.userId) } }, orderBy: { createdAt: 'desc' } });
    if (guide) return { latitude: guide.latitude, longitude: guide.longitude, locationName: 'Guide current location', updatedAt: guide.createdAt };
    const destination = (group.packages.find((item) => item.destination)?.destination ?? '').toLowerCase();
    const fallback = destination.includes('makkah') || destination.includes('mecca') ? { latitude: 21.4225, longitude: 39.8262, locationName: 'Makkah' } : destination.includes('dubai') ? { latitude: 25.2048, longitude: 55.2708, locationName: 'Dubai' } : destination.includes('turkey') || destination.includes('istanbul') ? { latitude: 41.0082, longitude: 28.9784, locationName: 'Istanbul' } : null;
    return fallback ? { ...fallback, updatedAt: null } : null;
  }

  async updateAssignment(id: string, guide: User, status: 'ACCEPTED' | 'DECLINED') {
    const assignment = await this.prisma.groupMember.findFirst({ where: { groupId: id, userId: guide.id, role: 'GUIDE' } });
    if (!assignment) throw new NotFoundException('Guide assignment not found');
    return this.prisma.groupMember.update({ where: { id: assignment.id }, data: { assignmentStatus: status } });
  }

  getPlan(id: string) {
    return this.prisma.tourPlanStep.findMany({ where: { groupId: id }, orderBy: { estimatedAt: 'asc' } });
  }

  async createPlanStep(id: string, data: { title: string; description?: string; location?: string; estimatedAt?: string; priority?: string }) {
    await this.ensureExists(id);
    const step = await this.prisma.tourPlanStep.create({ data: { groupId: id, title: data.title, description: data.description, location: data.location, priority: data.priority ?? 'MEDIUM', estimatedAt: data.estimatedAt ? new Date(data.estimatedAt) : undefined } });
    this.gateway.emitToRole('GUIDE', 'orderCreated', step);
    return step;
  }

  async updatePlanStep(id: string, stepId: string, data: { status?: string; notes?: string; actualAt?: string }, actor?: User) {
    await this.ensureExists(id);
    const step = await this.prisma.tourPlanStep.update({ where: { id: stepId }, data: { status: data.status, notes: data.notes, actualAt: data.actualAt ? new Date(data.actualAt) : undefined, ...(data.status === 'COMPLETED' ? { completedAt: new Date(), actualAt: data.actualAt ? new Date(data.actualAt) : new Date() } : {}) } });
    if (data.status === 'COMPLETED') await this.autoCompleteGroup(id);
    return step;
  }

  async updatePlanConfirmation(id: string, stepId: string, guide: User, data: { status: 'CONFIRMED' | 'REJECTED'; reason?: string }) {
    const assignment = await this.prisma.groupMember.findFirst({ where: { groupId: id, userId: guide.id, role: 'GUIDE' } });
    if (!assignment) throw new NotFoundException('Guide assignment not found');
    const step = await this.prisma.tourPlanStep.update({ where: { id: stepId }, data: { confirmationStatus: data.status, rejectedReason: data.status === 'REJECTED' ? data.reason : null, confirmedById: guide.id, confirmedAt: new Date() } });
    const group = await this.prisma.group.findUnique({ where: { id }, select: { createdById: true, name: true } });
    if (group) await this.notifications.notifyUser(group.createdById, { type: 'STATUS_UPDATE', title: data.status === 'CONFIRMED' ? 'Guide confirmed an order' : 'Guide rejected an order', message: `${guide.fullName} ${data.status === 'CONFIRMED' ? 'confirmed' : 'rejected'} a tour order in ${group.name}.${data.reason ? ` Reason: ${data.reason}` : ''}`, channel: 'IN_APP' });
    this.gateway.emitToRole('WORKER', data.status === 'CONFIRMED' ? 'orderConfirmed' : 'orderRejected', { step, groupId: id, guideName: guide.fullName, reason: data.reason });
    if (data.status === 'CONFIRMED') await this.autoStartGroup(id);
    return step;
  }

  private async autoStartGroup(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id }, include: { members: { select: { userId: true } } } });
    if (!group || group.status !== 'UPCOMING') return;
    const updated = await this.prisma.group.update({ where: { id }, data: { status: 'IN_PROGRESS' }, include: groupInclude });
    for (const member of group.members) await this.notifications.notifyUser(member.userId, { type: 'STATUS_UPDATE', title: 'Your tour has started', message: 'GPS tracking is now active for your group.', channel: 'IN_APP' });
    this.gateway.emitToRole('GUIDE', 'groupStatusChanged', updated); this.gateway.emitToRole('WORKER', 'groupStatusChanged', updated); this.gateway.emitToRole('ADMIN', 'groupStatusChanged', updated);
  }

  private async autoCompleteGroup(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id }, include: { members: { select: { userId: true } }, planSteps: { select: { status: true } } } });
    if (!group || group.status !== 'IN_PROGRESS' || !group.planSteps.length || !group.planSteps.every((step) => step.status === 'COMPLETED')) return;
    const updated = await this.prisma.group.update({ where: { id }, data: { status: 'COMPLETED' }, include: groupInclude });
    for (const member of group.members) await this.notifications.notifyUser(member.userId, { type: 'STATUS_UPDATE', title: 'Your tour is completed', message: 'Thank you for traveling with TOGT.', channel: 'IN_APP' });
    this.gateway.emitToRole('GUIDE', 'groupStatusChanged', updated); this.gateway.emitToRole('WORKER', 'groupStatusChanged', updated); this.gateway.emitToRole('ADMIN', 'groupStatusChanged', updated);
  }

  private async ensureExists(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }
}
