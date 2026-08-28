import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ValkeyService } from '../../valkey/valkey.service';
import { GoogleProfile } from './strategies/google.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { OAuth2Client } from 'google-auth-library';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_COOKIE = 'togt_access';
const REFRESH_COOKIE = 'togt_refresh';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly valkey: ValkeyService,
    private readonly notifications: NotificationsService,
  ) {}

  private isAdminEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const configured: string[] = this.config.get('adminEmails') ?? [];
    return normalized === 'fuadnesredinhiyar@gmail.com' || configured.map((value) => value.trim().toLowerCase()).includes(normalized);
  }

  /** Create or update a user from a Google profile. */
  async upsertGoogleUser(profile: GoogleProfile): Promise<{ user: User; isNew: boolean }> {
    const existing = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (existing) {
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { fullName: existing.fullName || profile.fullName, email: profile.email, ...(this.isAdminEmail(profile.email) && { role: Role.ADMIN }) },
      });
      return { user, isNew: false };
    }

    // Manually-created accounts (no googleId yet) are upgraded by email match
    const byEmail = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      const user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: profile.googleId, ...(this.isAdminEmail(profile.email) && { role: Role.ADMIN }) },
      });
      return { user, isNew: false };
    }

    const role = this.isAdminEmail(profile.email) ? Role.ADMIN : Role.CUSTOMER;
    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        fullName: profile.fullName,
        nationality: 'Ethiopia',
        role,
      },
    });
    return { user, isNew: true };
  }

  async loginWithMobileGoogle(idToken: string) {
    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) throw new UnauthorizedException('Google OAuth is not configured');
    const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified === false) {
      throw new UnauthorizedException('Invalid Google ID token');
    }
    const { user, isNew } = await this.upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      fullName: payload.name || payload.email.split('@')[0],
    });
    if (isNew) await this.sendWelcome(user);
    const tokens = await this.issueTokens(user);
    return { token: tokens.accessToken, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
  }

  async recordLogin(user: User, request: Request) {
    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const fingerprint = createHash('sha256').update(`${userAgent}|${ip}`).digest('hex');
    const known = await this.prisma.knownDevice.findUnique({ where: { userId_fingerprint: { userId: user.id, fingerprint } } });
    if (known) {
      await this.prisma.knownDevice.update({ where: { id: known.id }, data: { lastSeenAt: new Date() } });
      return;
    }
    await this.prisma.knownDevice.create({ data: { userId: user.id, fingerprint, browser: userAgent.slice(0, 200), lastSeenAt: new Date() } });
    if (user.createdAt.getTime() > Date.now() - 60_000) return;
    await this.notifications.notifyUser(user.id, { type: 'ALERT', title: 'New Device Login Detected', message: 'Your account was just accessed from a new device. Was this you?', channel: 'IN_APP', payload: { device: userAgent, ip, fingerprint } });
  }

  async sendWelcome(user: User) {
    await this.notifications.notifyUser(user.id, { type: 'SYSTEM', title: 'Welcome to TOGT! 🎉', message: 'Your account has been successfully created. Please complete your profile with nationality and contact details for better service.', channel: 'IN_APP' });
    await this.notifications.sendEmail(user.email, 'Welcome to TOGT!', `<p>Welcome ${user.fullName}! Your TOGT account is ready.</p>`);
  }

  async issueTokens(user: User): Promise<AuthTokens> {
    if (this.isAdminEmail(user.email) && user.role !== Role.ADMIN) {
      const promoted = await this.prisma.user.update({ where: { id: user.id }, data: { role: Role.ADMIN } });
      Object.assign(user, promoted);
    }
    const accessTtl = this.config.get<number>('jwt.accessTtl') ?? 900;
    const refreshTtl = this.config.get<number>('jwt.refreshTtl') ?? 604800;
    const refreshJti = randomUUID();

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role, jti: randomUUID() },
      { secret: this.config.get<string>('jwt.accessSecret'), expiresIn: accessTtl },
    );
    const refreshToken = this.jwt.sign(
      { sub: user.id, jti: refreshJti },
      { secret: this.config.get<string>('jwt.refreshSecret'), expiresIn: refreshTtl },
    );

    await this.valkey.set(`refresh:${user.id}:${refreshJti}`, '1', refreshTtl);
    return { accessToken, refreshToken };
  }

  setAuthCookies(res: Response, tokens: AuthTokens) {
    const secure = this.config.get<boolean>('cookieSecure') ?? false;
    const base = {
      httpOnly: true,
      secure,
      sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
    res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  /** Rotate the token pair from a valid refresh cookie. */
  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    let payload: { sub: string; jti: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const key = `refresh:${payload.sub}:${payload.jti}`;
    const exists = await this.valkey.get(key);
    if (!exists) throw new UnauthorizedException('Refresh token revoked');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'TERMINATED') {
      throw new UnauthorizedException('Account unavailable');
    }

    // Rotate: invalidate old refresh token, issue a fresh pair
    await this.valkey.del(key);
    const tokens = await this.issueTokens(user);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  /** Blacklist the current access token and drop the refresh token. */
  async logout(accessToken: string | undefined, refreshToken: string | undefined, res: Response) {
    if (accessToken) {
      const payload = this.jwt.decode(accessToken) as { jti?: string; exp?: number } | null;
      if (payload?.jti && payload?.exp) {
        const remainingSec = payload.exp - Math.floor(Date.now() / 1000);
        if (remainingSec > 0) {
          await this.valkey.set(`bl:${payload.jti}`, '1', remainingSec);
        }
      }
    }
    if (refreshToken) {
      const payload = this.jwt.decode(refreshToken) as { sub?: string; jti?: string } | null;
      if (payload?.sub && payload?.jti) {
        await this.valkey.del(`refresh:${payload.sub}:${payload.jti}`);
      }
    }
    this.clearAuthCookies(res);
    return { ok: true };
  }

  async logoutAll(userId: string, res: Response) {
    await this.valkey.delPattern(`refresh:${userId}:*`);
    this.clearAuthCookies(res);
    return { ok: true };
  }
}
