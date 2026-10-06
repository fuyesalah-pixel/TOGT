import { BadRequestException, ForbiddenException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PaymentStatus, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { DuffelService } from '../duffel/duffel.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { CredentialService } from '../system/credential.service';

const FLIGHT_REF_PREFIX = 'TOGT-FL-';
// How long a started-but-unconfirmed checkout keeps its slot before another
// initialize() may auto-release it. Covers "customer closed the checkout by
// mistake" — the slot frees itself instead of dead-ending every retry.
const STALE_PAYMENT_MS = 30 * 60 * 1000;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly notifications: NotificationsService, private readonly duffel: DuffelService, private readonly credentials: CredentialService) {}

  async initialize(dto: InitializePaymentDto, actor: User) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: dto.requestId }, include: { user: true } });
    if (!request || request.userId !== actor.id) throw new ForbiddenException('Request not found');
    if (request.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Request is already paid');
    if (request.paymentId) {
      // A previous checkout never finished (customer closed the window, app
      // crashed, Chapa never called back). Decide whether it is genuinely
      // still live or a dead reference blocking every retry.
      if (Date.now() - request.updatedAt.getTime() > STALE_PAYMENT_MS) {
        this.logger.log(`Auto-releasing stale payment reference ${request.paymentId} on request ${request.id}`);
        await this.prisma.serviceRequest.update({ where: { id: request.id }, data: { paymentId: null } });
      } else {
        const previous = await this.previousTransactionState(request.paymentId);
        if (previous?.status === 'success') {
          // Money actually arrived but the callback was missed — record it and
          // refuse a second checkout rather than charging the customer twice.
          if (previous.amount != null) await this.markPaid(request.id, request.paymentId, previous.amount, previous.currency);
          throw new BadRequestException(`This request is already paid — the payment went through. Refresh the app; if it still shows unpaid, contact TOGT support with reference ${request.paymentId}.`);
        }
        if (previous?.status === 'pending' || previous?.status === 'processing') {
          const minutesLeft = Math.max(1, Math.ceil((STALE_PAYMENT_MS - (Date.now() - request.updatedAt.getTime())) / 60000));
          throw new BadRequestException(`A checkout for this request is still open. Finish that payment, or wait about ${minutesLeft} min for it to expire and try again. If you already closed the payment window, tap Pay Now once more — it will be released.`);
        }
        // Not paid, not pending (or Chapa unreachable): the reference is dead —
        // free the slot and let the customer start over.
        this.logger.warn(`Releasing dead payment reference ${request.paymentId} on request ${request.id} (status: ${previous?.status ?? 'unverifiable'})`);
        await this.prisma.serviceRequest.update({ where: { id: request.id }, data: { paymentId: null } });
      }
    }
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) throw new BadRequestException('Payment amount must be greater than zero');
    if (request.amount == null) throw new BadRequestException('This request does not have an approved amount yet');
    if (Math.abs(request.amount - dto.amount) > 0.01) throw new BadRequestException('Payment amount does not match the approved amount');
    if (dto.currency && dto.currency.toUpperCase() !== request.currency.toUpperCase()) throw new BadRequestException('Payment currency does not match the approved currency');
    if (request.packageId) {
      const pkg = await this.prisma.package.findUnique({ where: { id: request.packageId }, select: { price: true } });
      if (pkg?.price != null && Math.abs(pkg.price - dto.amount) > 0.01) throw new BadRequestException('Payment amount does not match the package price');
    }
    const secret = await this.credentials.get('CHAPA');
    if (!secret) throw new ServiceUnavailableException('Chapa is not configured. Add CHAPA_SECRET_KEY on the backend.');
    const txRef = `TOGT-${Date.now()}-${randomUUID().slice(0, 8)}`;
    await this.prisma.serviceRequest.update({ where: { id: request.id }, data: { amount: dto.amount, currency: dto.currency ?? request.currency, paymentId: txRef } });
    const frontend = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
    const names = request.user.fullName.trim().split(/\s+/);
    // Chapa rejects initialize calls whose phone_number is not exactly
    // 09xxxxxxxx / 07xxxxxxxx (10 digits, Safaricom/Aethel mobile ranges) —
    // one malformed phone would kill the whole checkout, so only send it when
    // it matches the accepted shape.
    const digits = request.user.phone?.replace(/[\s()-]/g, '').replace(/^\+251/, '0');
    const phone = digits && /^0[79]\d{8}$/.test(digits) ? digits : undefined;
    const requestBody = { amount: String(dto.amount), currency: dto.currency ?? 'ETB', tx_ref: txRef, email: request.user.email, first_name: names[0] || 'TOGT', last_name: names.slice(1).join(' ') || 'Customer', ...(phone && { phone_number: phone }), callback_url: `${this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3001'}/api/payment/callback`, return_url: `${frontend}/en/payment/callback?tx_ref=${encodeURIComponent(txRef)}`, customization: { title: 'TOGT Travel', description: `${request.serviceType} payment` }, meta: { requestId: request.id } };
    const response = await fetch(`${chapaUrl}/transaction/initialize`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    const payload = await response.json() as { status?: string; message?: unknown; data?: { checkout_url?: string } };
    if (!response.ok || payload.status !== 'success' || !payload.data?.checkout_url) {
      const raw = typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message ?? payload);
      throw new BadRequestException(`Payment could not be started: ${raw.slice(0, 200)}. Check your details and try again; if it keeps failing, contact TOGT support.`);
    }
    return { checkoutUrl: payload.data.checkout_url, transactionId: txRef };
  }

  async verify(transactionId: string, actor: User) {
    if (transactionId.startsWith(FLIGHT_REF_PREFIX)) return this.duffel.verifyChapa(transactionId);
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: transactionId }, include: { user: true } });
    if (!request || (actor.role === Role.CUSTOMER && request.userId !== actor.id)) throw new ForbiddenException('Payment not found');
    const secret = await this.credentials.get('CHAPA');
    if (!secret) throw new ServiceUnavailableException('Chapa is not configured');
    const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
    const response = await fetch(`${chapaUrl}/transaction/verify/${encodeURIComponent(transactionId)}`, { headers: { Authorization: `Bearer ${secret}` } });
    const payload = await response.json() as { status?: string; data?: { status?: string; amount?: number; currency?: string }; amount?: number; currency?: string };
    const status = payload.data?.status ?? payload.status ?? 'pending';
    if (status.toLowerCase() === 'success') await this.markPaid(request.id, transactionId, payload.data?.amount ?? payload.amount, payload.data?.currency ?? payload.currency);
    return { status };
  }

  async callback(payload: { trx_ref?: string; tx_ref?: string; ref_id?: string; transaction_id?: string; status?: string }) {
    const transactionId = payload.trx_ref ?? payload.tx_ref;
    if (!transactionId) throw new BadRequestException('Missing transaction reference');
    if (transactionId.startsWith(FLIGHT_REF_PREFIX)) {
      const verification = await this.duffel.verifyChapa(transactionId);
      if (payload.status === 'success' && verification.status === 'success') await this.duffel.onChapaPaymentSucceeded(transactionId, payload.ref_id ?? payload.transaction_id ?? transactionId, verification.amount, verification.currency);
      return { received: true, status: verification.status };
    }
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: transactionId } });
    if (!request) throw new BadRequestException('Payment reference not found');
    const verification = await this.verifyByReference(transactionId);
    if (payload.status === 'success' && verification.status === 'success') await this.markPaid(request.id, payload.ref_id ?? payload.transaction_id ?? transactionId, verification.amount, verification.currency);
    return { received: true, status: verification.status };
  }

  async cancel(transactionId: string, actor: User) {
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: transactionId } });
    if (!request || request.userId !== actor.id) throw new ForbiddenException('Payment not found');
    // Release the slot FIRST. The old code threw when Chapa's cancel failed
    // (e.g. checkout already expired there) and left paymentId set forever,
    // permanently dead-ending the request with "already in progress".
    await this.prisma.serviceRequest.update({ where: { id: request.id }, data: { paymentId: null } });
    const secret = await this.credentials.get('CHAPA');
    if (secret) {
      const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
      try {
        const response = await fetch(`${chapaUrl}/transaction/cancel/${encodeURIComponent(transactionId)}`, { method: 'PUT', headers: { Authorization: `Bearer ${secret}` } });
        if (!response.ok) {
          // Not fatal for the customer — the slot is freed. But if the payment
          // quietly succeeded, record it instead of letting them pay twice.
          try {
            const state = await this.verifyByReference(transactionId);
            if (state.status === 'success') { await this.markPaid(request.id, transactionId, state.amount, state.currency); return { status: 'paid' }; }
          } catch { /* fall through to the warning */ }
          this.logger.warn(`Chapa cancel failed for ${transactionId} (${response.status}) — checkout released anyway`);
        }
      } catch (error) {
        this.logger.warn(`Chapa cancel unreachable for ${transactionId}: ${error instanceof Error ? error.message : error} — checkout released anyway`);
      }
    }
    return { status: 'cancelled' };
  }

  async webhook(rawBody: string, signature: string | undefined, payload: { event?: string; status?: string; tx_ref?: string; ref_id?: string; transaction_id?: string; amount?: number; currency?: string; data?: { status?: string; tx_ref?: string; ref_id?: string; amount?: number; currency?: string } }) {
    const webhookSecret = this.config.get<string>('CHAPA_WEBHOOK_SECRET');
    if (!webhookSecret || !signature) throw new ForbiddenException('Invalid webhook signature');
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) throw new ForbiddenException('Invalid webhook signature');
    const event = payload.data ?? payload;
    if ((!payload.event || payload.event === 'charge.success') && event.status === 'success' && event.tx_ref) await this.markPaidByReference(event.tx_ref, event.ref_id ?? payload.transaction_id ?? event.tx_ref, event.amount, event.currency);
    return { received: true };
  }

  async status(id: string, actor: User) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id }, select: { userId: true, paymentStatus: true, paymentId: true, amount: true, currency: true, paidAt: true } });
    if (!request || (actor.role === Role.CUSTOMER && request.userId !== actor.id)) throw new ForbiddenException('Request not found');
    return request;
  }

  private async markPaidByReference(reference: string, paymentId: string, amount?: number, currency?: string) {
    if (reference.startsWith(FLIGHT_REF_PREFIX)) {
      await this.duffel.onChapaPaymentSucceeded(reference, paymentId, amount, currency);
      return;
    }
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: reference } }); if (request) await this.markPaid(request.id, paymentId, amount, currency); }
  /// State of a previously-started checkout, or null when it cannot be
  /// confirmed (Chapa down / not configured). Null must NOT block the customer
  /// — dead references are released by the caller.
  private async previousTransactionState(transactionId: string): Promise<{ status: string; amount?: number; currency?: string } | null> {
    try {
      const state = await this.verifyByReference(transactionId);
      return { status: state.status.toLowerCase(), amount: state.amount, currency: state.currency };
    } catch (error) {
      this.logger.warn(`Could not verify previous payment attempt ${transactionId}: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private async verifyByReference(transactionId: string) { const secret = await this.credentials.get('CHAPA'); if (!secret) throw new ServiceUnavailableException('Chapa is not configured'); const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1'; const response = await fetch(`${chapaUrl}/transaction/verify/${encodeURIComponent(transactionId)}`, { headers: { Authorization: `Bearer ${secret}` } }); const payload = await response.json() as { status?: string; data?: { status?: string; amount?: number; currency?: string }; amount?: number; currency?: string }; return { status: payload.data?.status ?? payload.status ?? 'pending', amount: payload.data?.amount ?? payload.amount, currency: payload.data?.currency ?? payload.currency }; }
  private async markPaid(requestId: string, paymentId: string, amount?: number, currency?: string) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new BadRequestException('Payment request not found');
    if (request.amount == null || amount == null || Math.abs(request.amount - amount) > 0.01) {
      this.logger.error(`Payment amount mismatch for request ${requestId}`);
      throw new BadRequestException('Payment amount does not match the approved amount');
    }
    if (currency && currency.toUpperCase() !== request.currency.toUpperCase()) {
      this.logger.error(`Payment currency mismatch for request ${requestId}`);
      throw new BadRequestException('Payment currency does not match the approved currency');
    }
    if (request.paymentStatus === PaymentStatus.PAID) return request;
    const updated = await this.prisma.serviceRequest.update({ where: { id: requestId }, data: { paymentStatus: PaymentStatus.PAID, paidAt: new Date() } });
    await this.notifications.notifyUser(updated.userId, { type: 'STATUS_UPDATE', title: 'Payment successful', message: `Payment for your ${updated.serviceType} request has been received.`, channel: 'IN_APP' });
    return updated;
  }
}

