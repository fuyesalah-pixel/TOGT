import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Role, TrackingRequestStatus, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** A trackable traveler with live position — one entry per active group. */
export type TrackableMember = {
  memberId: string;
  memberName: string;
  phone: string | null;
  groupId: string;
  groupName: string;
  guideLocation: { latitude: number; longitude: number; name?: string } | null;
  memberLocation: { latitude: number; longitude: number } | null;
  distance: number | null;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'OFFLINE' | 'UNKNOWN';
  lastUpdated: Date | null;
};

/**
 * Tracking access rules (redesigned):
 *  - CUSTOMER → CUSTOMER requires consent: A sends a TrackingRequest to B;
 *    while B has not answered the status is "in progress". When B accepts,
 *    A can track B whenever B is a member of an IN_PROGRESS group — A does
 *    NOT have to be in that group. Same-group membership alone no longer
 *    grants access. When B declines, A is told the request was declined.
 *  - WORKER / GUIDE / ADMIN track anyone directly, no request needed.
 */
@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  // ── Consent flow ──────────────────────────────────────────────────────────

  /** A (customer) asks to track B (customer). Re-sending resets to PENDING. */
  async sendRequest(targetId: string, actor: User) {
    if (actor.role !== Role.CUSTOMER) throw new ForbiddenException('Only customers send tracking requests');
    if (targetId === actor.id) throw new BadRequestException('You cannot track yourself');
    const target = await this.prisma.user.findFirst({ where: { id: targetId, status: 'ACTIVE', role: Role.CUSTOMER }, select: { id: true, fullName: true } });
    if (!target) throw new NotFoundException('Customer not found');
    const request = await this.prisma.trackingRequest.upsert({
      where: { requesterId_targetId: { requesterId: actor.id, targetId } },
      create: { requesterId: actor.id, targetId },
      update: { status: TrackingRequestStatus.PENDING, respondedAt: null },
    });
    await this.notifications.notifyUser(targetId, {
      title: 'Tracking request',
      message: `${actor.fullName} would like to track your location during your trips.`,
      type: NotificationType.SYSTEM,
      payload: { kind: 'tracking_request', requestId: request.id, requesterId: actor.id, requesterName: actor.fullName },
    });
    return { id: request.id, targetId, status: TrackingRequestStatus.PENDING, targetName: target.fullName };
  }

  /** B answers A's request: accept grants access, decline tells A it was declined. */
  async respond(requestId: string, accept: boolean, actor: User) {
    const request = await this.prisma.trackingRequest.findUnique({ where: { id: requestId }, include: { requester: { select: { id: true, fullName: true } }, target: { select: { id: true, fullName: true } } } });
    if (!request) throw new NotFoundException('Tracking request not found');
    if (request.targetId !== actor.id) throw new ForbiddenException('Only the recipient can respond');
    if (request.status !== TrackingRequestStatus.PENDING) throw new BadRequestException(`This request was already ${request.status.toLowerCase()}`);
    const updated = await this.prisma.trackingRequest.update({ where: { id: requestId }, data: { status: accept ? TrackingRequestStatus.ACCEPTED : TrackingRequestStatus.DECLINED, respondedAt: new Date() } });
    await this.notifications.notifyUser(request.requesterId, {
      title: accept ? 'Tracking approved' : 'Tracking declined',
      message: accept
        ? `${request.target.fullName} accepted your tracking request. You can now follow their trips while they travel.`
        : `${request.target.fullName} declined your tracking request.`,
      type: NotificationType.SYSTEM,
      payload: { kind: 'tracking_response', requestId, targetId: request.targetId, accepted: accept },
    });
    return updated;
  }

  /** A cancels a still-pending request (declutter). */
  async cancel(requestId: string, actor: User) {
    const request = await this.prisma.trackingRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Tracking request not found');
    if (request.requesterId !== actor.id) throw new ForbiddenException('Only the sender can cancel');
    if (request.status !== TrackingRequestStatus.PENDING) throw new BadRequestException('Only pending requests can be cancelled');
    return this.prisma.trackingRequest.update({ where: { id: requestId }, data: { status: TrackingRequestStatus.CANCELLED } });
  }

  /** Everything the consent UI needs: requests I sent and requests I received. */
  async listRequests(actor: User) {
    type RequestRow = { id: string; status: TrackingRequestStatus; respondedAt: Date | null; createdAt: Date; target?: { id: string; fullName: string; email: string }; requester?: { id: string; fullName: string; email: string } };
    const map = (request: RequestRow, direction: 'sent' | 'received') => {
      const user = (direction === 'sent' ? request.target : request.requester)!;
      return { id: request.id, status: request.status, direction, user: { id: user.id, fullName: user.fullName, email: user.email }, respondedAt: request.respondedAt, createdAt: request.createdAt };
    };
    const [sent, received] = await Promise.all([
      this.prisma.trackingRequest.findMany({ where: { requesterId: actor.id, status: { not: TrackingRequestStatus.CANCELLED } }, include: { target: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.trackingRequest.findMany({ where: { targetId: actor.id, status: TrackingRequestStatus.PENDING }, include: { requester: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { sent: sent.map((request) => map(request, 'sent')), received: received.map((request) => map(request, 'received')) };
  }

  /** Consent state between the actor and one customer (for search result cards). */
  private async consentStatus(requesterId: string, targetId: string): Promise<TrackingRequestStatus | 'NONE'> {
    const request = await this.prisma.trackingRequest.findUnique({ where: { requesterId_targetId: { requesterId, targetId } }, select: { status: true } });
    return request?.status ?? 'NONE';
  }

  /** People a customer can send a request to (by name/email) + current consent state. */
  async searchPeople(query: string, actor: User) {
    const q = query.trim();
    const users = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER, status: 'ACTIVE', id: { not: actor.id }, ...(q ? { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] } : {}) },
      select: { id: true, fullName: true, email: true, phone: true, groupMembers: { where: { group: { status: 'IN_PROGRESS' } }, select: { group: { select: { id: true, name: true } } }, take: 1 } },
      take: 20,
    });
    return Promise.all(users.map(async (user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      travelingNow: user.groupMembers.length > 0,
      groupName: user.groupMembers[0]?.group.name ?? null,
      consent: await this.consentStatus(actor.id, user.id),
    })));
  }

  // ── Live tracking ─────────────────────────────────────────────────────────

  /**
   * Live tracking for the signed-in customer: everyone who accepted a
   * tracking request from them AND is currently in an IN_PROGRESS group.
   * Query filters by name/email; empty query returns the full list.
   */
  async search(query: string, actor: User) {
    if (actor.role !== Role.CUSTOMER) throw new ForbiddenException('Customer tracking only');
    const q = query.trim().toLowerCase();
    const accepted = await this.prisma.trackingRequest.findMany({ where: { requesterId: actor.id, status: TrackingRequestStatus.ACCEPTED }, select: { targetId: true } });
    if (!accepted.length) return [];
    const targets = await this.prisma.user.findMany({
      where: { id: { in: accepted.map((item) => item.targetId) }, status: 'ACTIVE' },
      select: { id: true, fullName: true, email: true },
    });
    const matched = targets.filter((target) => `${target.fullName} ${target.email} ${target.id}`.toLowerCase().includes(q));
    const results = (await Promise.all(matched.map((target) => this.trackable(target.id)))).filter((entry): entry is TrackableMember & { traveling: boolean } => entry.traveling);
    return results.map(({ traveling, ...member }) => member);
  }

  /**
   * Live position of one member. Customers need an ACCEPTED request and the
   * member must be traveling (IN_PROGRESS group). Workers/guides/admins go
   * straight in — no consent flow for staff.
   */
  async getMember(memberId: string, actor: User): Promise<TrackableMember> {
    const staff = actor.role !== Role.CUSTOMER;
    if (!staff) {
      const consent = await this.consentStatus(actor.id, memberId);
      if (consent !== TrackingRequestStatus.ACCEPTED) {
        if (consent === 'NONE') throw new ForbiddenException('Send a tracking request first — tracking starts once it is accepted');
        if (consent === TrackingRequestStatus.PENDING) throw new ForbiddenException('Your tracking request is still in progress');
        throw new ForbiddenException('Your tracking request was declined');
      }
    }
    const member = await this.trackable(memberId);
    const { traveling, ...result } = member;
    if (!traveling && !staff) throw new NotFoundException('This traveler is not on an active trip right now');
    return result;
  }

  /**
   * Snapshot of a member across every IN_PROGRESS group they belong to.
   * `traveling` is false when they are not in any active group.
   */
  private async trackable(memberId: string): Promise<TrackableMember & { traveling: boolean }> {
    const member = await this.prisma.user.findUnique({ where: { id: memberId }, select: { id: true, fullName: true, phone: true } });
    if (!member) throw new NotFoundException('Member not found');
    const membership = await this.prisma.groupMember.findFirst({
      where: { userId: memberId, group: { status: 'IN_PROGRESS' } },
      orderBy: { joinedAt: 'desc' },
      select: { groupId: true, group: { select: { id: true, name: true } } },
    });
    if (!membership) return { memberId: member.id, memberName: member.fullName, phone: member.phone, groupId: '', groupName: '', guideLocation: null, memberLocation: null, distance: null, status: 'OFFLINE', lastUpdated: null, traveling: false };
    const groupId = membership.group.id;
    const guide = await this.prisma.groupMember.findFirst({ where: { groupId, role: 'GUIDE' }, select: { user: { select: { id: true, fullName: true } } } });
    const latest = await this.prisma.locationTracking.findFirst({ where: { groupId, userId: memberId }, orderBy: { createdAt: 'desc' } });
    const guideLocation = guide ? await this.prisma.locationTracking.findFirst({ where: { groupId, userId: guide.user.id }, orderBy: { createdAt: 'desc' } }) : null;
    const distance = latest && guideLocation ? this.distance(latest.latitude, latest.longitude, guideLocation.latitude, guideLocation.longitude) : null;
    const age = latest ? Date.now() - latest.createdAt.getTime() : Infinity;
    const status = !latest || age > 300000 || !guideLocation ? (!latest || age > 300000 ? 'OFFLINE' : 'UNKNOWN') : distance! > 1000 ? 'DANGER' : distance! > 500 ? 'WARNING' : 'SAFE';
    return {
      memberId: member.id,
      memberName: member.fullName,
      phone: member.phone,
      groupId,
      groupName: membership.group.name,
      guideLocation: guideLocation ? { latitude: guideLocation.latitude, longitude: guideLocation.longitude, name: guide?.user.fullName } : null,
      memberLocation: latest ? { latitude: latest.latitude, longitude: latest.longitude } : null,
      distance,
      status,
      lastUpdated: latest?.createdAt ?? null,
      traveling: true,
    };
  }

  private distance(aLat: number, aLng: number, bLat: number, bLng: number) { const radians = (value: number) => value * Math.PI / 180; const dLat = radians(bLat - aLat); const dLng = radians(bLng - aLng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2; return 6371000 * 2 * Math.asin(Math.sqrt(h)); }
}
