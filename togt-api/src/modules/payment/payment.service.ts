import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PaymentStatus, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly notifications: NotificationsService) {}

  async initialize(dto: InitializePaymentDto, actor: User) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: dto.requestId }, include: { user: true } });
    if (!request || request.userId !== actor.id) throw new ForbiddenException('Request not found');
    if (request.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Request is already paid');
    const secret = this.config.get<string>('CHAPA_SECRET_KEY');
    if (!secret) throw new ServiceUnavailableException('Chapa is not configured. Add CHAPA_SECRET_KEY on the backend.');
    const txRef = `TOGT-${Date.now()}-${randomUUID().slice(0, 8)}`;
    await this.prisma.serviceRequest.update({ where: { id: request.id }, data: { amount: dto.amount, currency: dto.currency ?? request.currency, paymentId: txRef } });
    const frontend = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
    const names = request.user.fullName.trim().split(/\s+/);
    const phone = request.user.phone?.replace(/[\s()-]/g, '').replace(/^\+251/, '0');
    const requestBody = { amount: String(dto.amount), currency: dto.currency ?? 'ETB', tx_ref: txRef, email: request.user.email, first_name: names[0] || 'TOGT', last_name: names.slice(1).join(' ') || 'Customer', ...(phone && { phone_number: phone }), callback_url: `${this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3001'}/api/payment/callback`, return_url: `${frontend}/en/payment/callback?tx_ref=${encodeURIComponent(txRef)}`, customization: { title: 'TOGT Travel', description: `${request.serviceType} payment` }, meta: { requestId: request.id } };
    const response = await fetch(`${chapaUrl}/transaction/initialize`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    const payload = await response.json() as { status?: string; message?: unknown; data?: { checkout_url?: string } };
    if (!response.ok || payload.status !== 'success' || !payload.data?.checkout_url) { const reason = typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message ?? payload); throw new BadRequestException(`Chapa initialization failed (${response.status}): ${reason}`); }
    return { checkoutUrl: payload.data.checkout_url, transactionId: txRef };
  }

  async verify(transactionId: string, actor: User) {
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: transactionId }, include: { user: true } });
    if (!request || (actor.role === Role.CUSTOMER && request.userId !== actor.id)) throw new ForbiddenException('Payment not found');
    const secret = this.config.get<string>('CHAPA_SECRET_KEY');
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
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: transactionId } });
    if (!request) throw new BadRequestException('Payment reference not found');
    const verification = await this.verifyByReference(transactionId);
    if (payload.status === 'success' && verification.status === 'success') await this.markPaid(request.id, payload.ref_id ?? payload.transaction_id ?? transactionId, verification.amount, verification.currency);
    return { received: true, status: verification.status };
  }

  async cancel(transactionId: string, actor: User) {
    const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: transactionId } });
    if (!request || request.userId !== actor.id) throw new ForbiddenException('Payment not found');
    const secret = this.config.get<string>('CHAPA_SECRET_KEY');
    if (!secret) throw new ServiceUnavailableException('Chapa is not configured');
    const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
    const response = await fetch(`${chapaUrl}/transaction/cancel/${encodeURIComponent(transactionId)}`, { method: 'PUT', headers: { Authorization: `Bearer ${secret}` } });
    const payload = await response.json();
    if (!response.ok) throw new BadRequestException((payload as { message?: string }).message ?? 'Unable to cancel payment');
    await this.prisma.serviceRequest.update({ where: { id: request.id }, data: { paymentId: null } });
    return payload;
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

  private async markPaidByReference(reference: string, paymentId: string, amount?: number, currency?: string) { const request = await this.prisma.serviceRequest.findFirst({ where: { paymentId: reference } }); if (request) await this.markPaid(request.id, paymentId, amount, currency); }
  private async verifyByReference(transactionId: string) { const secret = this.config.get<string>('CHAPA_SECRET_KEY'); if (!secret) throw new ServiceUnavailableException('Chapa is not configured'); const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1'; const response = await fetch(`${chapaUrl}/transaction/verify/${encodeURIComponent(transactionId)}`, { headers: { Authorization: `Bearer ${secret}` } }); const payload = await response.json() as { status?: string; data?: { status?: string; amount?: number; currency?: string }; amount?: number; currency?: string }; return { status: payload.data?.status ?? payload.status ?? 'pending', amount: payload.data?.amount ?? payload.amount, currency: payload.data?.currency ?? payload.currency }; }
  private async markPaid(requestId: string, paymentId: string, amount?: number, currency?: string) { const request = await this.prisma.serviceRequest.update({ where: { id: requestId }, data: { paymentStatus: PaymentStatus.PAID, paymentId, paidAt: new Date(), ...(amount !== undefined && { amount }), ...(currency && { currency }) } }); await this.notifications.notifyUser(request.userId, { type: 'STATUS_UPDATE', title: 'Payment successful', message: `Payment for your ${request.serviceType} request has been received.`, channel: 'IN_APP' }); }
}
