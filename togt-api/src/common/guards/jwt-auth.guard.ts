import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ValkeyService } from '../../valkey/valkey.service';

/**
 * Global JWT guard.
 * - Skips routes decorated with @Public()
 * - Authenticates via the `togt_access` httpOnly cookie (see jwt.strategy)
 * - Rejects blacklisted tokens (Valkey `bl:{jti}`)
 * - The strategy itself rejects TERMINATED users
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly valkey: ValkeyService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const activated = (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest();
    const jti: string | undefined = request.tokenPayload?.jti;
    if (jti) {
      const blacklisted = await this.valkey.get(`bl:${jti}`);
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    return activated;
  }
}
