import { BadRequestException, Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Role, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { GoogleProfile } from './strategies/google.strategy';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Start Google OAuth flow (browser redirects to Google). */
  @Get('google')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Guard redirects to Google — nothing to do here
  }

  // Kept as an API-compatible alias for clients that initiate OAuth with POST.
  @Post('google')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(AuthGuard('google'))
  googleLoginPost() {
    // Guard redirects to Google — nothing to do here
  }

  @Post('google-mobile')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async googleMobile(@Body('idToken') idToken: string, @Res({ passthrough: true }) res: Response) {
    if (!idToken) throw new BadRequestException('idToken is required');
    const result = await this.auth.loginWithMobileGoogle(idToken);
    this.auth.setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  /** Google OAuth callback — issues JWT cookies and redirects to the frontend. */
  @Get('google/callback')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as unknown as GoogleProfile;
    const result = await this.auth.upsertGoogleUser(profile);
    const user = result.user;
    if (result.isNew) {
      await this.auth.sendWelcome(user);
      await this.auth.recordLogin(user, req);
    } else {
      await this.auth.recordLogin(user, req);
    }
    const tokens = await this.auth.issueTokens(user);
    this.auth.setAuthCookies(res, tokens);
    const frontendUrl = this.config.get<string>('frontendUrl');
    return res.redirect(`${frontendUrl}/en/auth/callback`);
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  refresh(@Body('refreshToken') refreshToken: string | undefined, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(refreshToken ?? req.cookies?.togt_refresh, res, Boolean(refreshToken));
  }

  /** Local development login — no Google required. Enabled only when DEV_LOGIN_ENABLED=true. */
  @Post('dev-login')
  @Public()
  async devLogin(
    @Body() body: { email?: string; role?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.config.get<boolean>('DEV_LOGIN_ENABLED')) {
      throw new UnauthorizedException('Dev login is disabled');
    }
    const result = await this.auth.devLogin(body.email ?? '', body.role as Role | undefined);
    this.auth.setAuthCookies(res, result.tokens);
    return { user: result.user };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(req.cookies?.togt_access, req.cookies?.togt_refresh, res);
  }

  @Post('logout-all')
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.logoutAll((req.user as User).id, res);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }
}
