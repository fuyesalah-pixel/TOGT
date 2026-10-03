import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, Messaging, MulticastMessage } from 'firebase-admin/messaging';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialService } from '../system/credential.service';

/**
 * Firebase Cloud Messaging push delivery to mobile devices (DeviceToken rows,
 * registered by the app via POST /users/device-token).
 *
 * The service-account JSON is stored encrypted in the provider store
 * (Tech Dashboard → Providers → FIREBASE) or in the FIREBASE_SERVICE_ACCOUNT
 * env var. When it is missing or invalid, pushes are skipped with a log line —
 * every caller treats push as best-effort and in-app notifications still work.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private messaging: Messaging | null = null;
  private appSecret = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly credentials: CredentialService,
  ) {}

  private async getClient(): Promise<Messaging | null> {
    const raw =
      (await this.credentials.get('FIREBASE')) ??
      this.config.get<string>('firebase.serviceAccount') ??
      '';
    if (!raw) return null;
    if (this.messaging && this.appSecret === raw) return this.messaging;
    try {
      const parsed = JSON.parse(raw) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!parsed.client_email || !parsed.private_key) {
        this.logger.warn('[push] FIREBASE credential is not a service-account JSON — push disabled');
        return null;
      }
      const appName = 'togt-push';
      const app: App =
        getApps().find((a) => a.name === appName) ??
        initializeApp(
          {
            credential: cert({
              projectId: parsed.project_id,
              clientEmail: parsed.client_email,
              privateKey: parsed.private_key.replace(/\\n/g, '\n'),
            }),
          },
          appName,
        );
      this.messaging = getMessaging(app);
      this.appSecret = raw;
      return this.messaging;
    } catch (error) {
      this.logger.warn(`[push] could not initialize Firebase: ${(error as Error).message}`);
      return null;
    }
  }

  /** Sends a notification push to every device registered for the user.
   *  Device tokens that fail permanently (app uninstalled) are cleaned up. */
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    const messaging = await this.getClient();
    if (!messaging) return false;
    try {
      const devices = await this.prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
      const tokens = devices.map((device) => device.token);
      if (tokens.length === 0) return false;
      const message: MulticastMessage = {
        tokens: tokens.slice(0, 500),
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' },
      };
      const response = await messaging.sendEachForMulticast(message);
      const stale = response.responses
        .map((result, index) => (result.success ? null : tokens[index]))
        .filter((token): token is string => !!token);
      if (stale.length) {
        await this.prisma.deviceToken.deleteMany({ where: { token: { in: stale } } }).catch(() => undefined);
      }
      return response.successCount > 0;
    } catch (error) {
      this.logger.warn(`[push:failed] user=${userId}: ${(error as Error).message}`);
      return false;
    }
  }

  /** Fan-out push to many users (e.g. the Friday reminder). Returns the
   *  number of users to whom at least one push was delivered. */
  async sendToUsersWhereIn(userIds: string[], title: string, body: string, data?: Record<string, string>): Promise<number> {
    if (userIds.length === 0) return 0;
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true, userId: true },
    });
    if (devices.length === 0) return 0;
    const messaging = await this.getClient();
    if (!messaging) return 0;
    const deliveredUsers = new Set<string>();
    const stale: string[] = [];
    // FCM accepts at most 500 tokens per multicast call.
    for (let i = 0; i < devices.length; i += 500) {
      const batch = devices.slice(i, i + 500);
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: batch.map((device) => device.token),
          notification: { title, body },
          data: data ?? {},
          android: { priority: 'high' },
        });
        response.responses.forEach((result, index) => {
          if (result.success) deliveredUsers.add(batch[index].userId);
          else stale.push(batch[index].token);
        });
      } catch (error) {
        this.logger.warn(`[push:batch-failed]: ${(error as Error).message}`);
      }
    }
    if (stale.length) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: stale } } }).catch(() => undefined);
    }
    return deliveredUsers.size;
  }
}
