import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Duffel } from '@duffel/api';
import { FlightOrderStatus, TicketStatus, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CurrencyService } from '../currency/currency.service';
import { CreateFlightOrderDto } from './dto/create-flight-order.dto';
import { SearchFlightsDto } from './dto/search-flights.dto';

const FLIGHT_REF_PREFIX = 'TOGT-FL-';

interface DuffelSlice {
  origin: { iata_code: string; city?: { name?: string } };
  destination: { iata_code: string; city?: { name?: string } };
  segments: Array<{
    origin: { iata_code: string; city?: { name?: string } };
    destination: { iata_code: string; city?: { name?: string } };
    departing_at: string;
    arriving_at: string;
    marketing_carrier_flight_number: string;
    marketing_carrier: { name: string; iata_code: string };
  }>;
}

interface DuffelOffer {
  id: string;
  slices?: DuffelSlice[];
  total_amount?: string;
  total_currency?: string;
  cabin_class?: string;
  expires_at?: string;
  payment_requirements?: { requires_instant_payment?: boolean };
  refund_before_departure?: { refundable?: boolean; refund_currency?: string };
  available_services?: Array<{ id: string; type?: string; total_amount?: string; total_currency?: string; maximum_quantity?: number; passenger_ids?: string[]; name?: string; metadata?: unknown }>;
  base_amount?: string;
  tax_amount?: string;
  conditions?: unknown;
}

interface DuffelOfferRequest {
  id: string;
  passengers?: Array<{ id: string }>;
  offers?: DuffelOffer[];
}

interface DuffelOrder {
  id: string;
  booking_reference?: string | null;
  total_amount?: string;
  total_currency?: string;
  payment_required_by?: string | null;
  slices?: DuffelSlice[];
  awaiting_payment?: boolean;
}

@Injectable()
export class DuffelService {
  private readonly logger = new Logger(DuffelService.name);
  private duffel: Duffel | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly currency: CurrencyService,
  ) {}

  private client(): Duffel {
    if (this.duffel) return this.duffel;
    const token = this.config.get<string>('duffel.accessToken');
    if (!token) throw new ServiceUnavailableException('Duffel is not configured. Add DUFFEL_ACCESS_TOKEN on the backend.');
    const apiUrl = this.config.get<string>('duffel.apiUrl') ?? 'https://api.duffel.com';
    const basePath = apiUrl.replace(/\/+$/, '');
    this.duffel = new Duffel({ token, basePath });
    return this.duffel;
  }

  private markup(): number {
    return parseFloat(this.config.get<string>('duffel.markupPercent') ?? '8') || 8;
  }

  // Price paid by the customer (ETB in Chapa). Converts Duffel's priced currency to ETB and applies markup.
  private async sellPrice(amount: number, currency: string): Promise<{ sellAmount: number; sellCurrency: string; exchangeRate: number }> {
    const base = await this.currency.convertToEtb(amount, currency);
    const sell = Math.ceil(base * (1 + this.markup() / 100));
    const rates = await this.currency.getRates();
    return { sellAmount: sell, sellCurrency: 'ETB', exchangeRate: rates.USD_TO_ETB };
  }

  private assertCustomerOrOwned(order: { userId: string }, actor: User) {
    if (actor.role !== 'CUSTOMER' && actor.role !== 'ADMIN' && actor.role !== 'WORKER') return;
    if (order.userId !== actor.id) throw new ForbiddenException('Flight order not found');
  }

  async search(dto: SearchFlightsDto) {
    const adults = dto.adults ?? 1;
    const children = dto.children ?? 0;
    const infants = dto.infants ?? 0;
    const passengers = [
      ...Array.from({ length: adults }, () => ({ type: 'adult' as const })),
      ...Array.from({ length: children }, () => ({ type: 'child' as const })),
      ...Array.from({ length: infants }, () => ({ type: 'infant_without_seat' as const })),
    ];
    if (passengers.length === 0) throw new BadRequestException('At least one passenger is required');

    const slices = [
      { origin: dto.origin, destination: dto.destination, departure_date: dto.departureDate },
    ];
    if (dto.returnDate) {
      slices.push({ origin: dto.destination, destination: dto.origin, departure_date: dto.returnDate });
    }

    const response = await this.client().offerRequests.create({
      slices,
      passengers,
      cabin_class: (dto.cabinClass ?? 'economy') as never,
      max_connections: dto.directOnly ? 0 : 1,
      return_offers: true,
    } as never);

    const request = response.data as unknown as DuffelOfferRequest;
    const offerRequestId = request.id;
    const passengerIds = (request.passengers ?? []).map((p: { id: string }) => p.id as string);

    const offers = await Promise.all(((request.offers ?? []) as unknown as DuffelOffer[]).map((offer: DuffelOffer) =>
      this.normalize(offer),
    ));
    this.logger.log(`Duffel search ${dto.origin}-${dto.destination}: ${offers.length} offers; ${offers.slice(0, 5).map((offer) => `${offer.id}=${offer.duffelPrice} ${offer.duffelCurrency}`).join(', ')}`);

    return { offerRequestId, passengerIds, offers };
  }

  // Normalizes a Duffel offer into the compact FlightResult shape used by the web app.
  private async normalize(offer: DuffelOffer) {
    const slices = (offer.slices ?? []) as Array<{
      origin: { iata_code: string };
      destination: { iata_code: string };
      segments: Array<{
        origin: { iata_code: string; city?: { name?: string } };
        destination: { iata_code: string; city?: { name?: string } };
        departing_at: string;
        arriving_at: string;
        marketing_carrier_flight_number: string;
        marketing_carrier: { name: string; iata_code: string };
      }>;
    }>;

    const outbound = slices[0];
    const returnSlice = slices[1];

    const summarize = (slice: (typeof slices)[number] | undefined) => {
      if (!slice) return null;
      const segs = slice.segments;
      const stops = Math.max(0, segs.length - 1);
      return {
        origin: slice.origin.iata_code,
        destination: slice.destination.iata_code,
        departureAt: segs[0]?.departing_at ?? '',
        arrivalAt: segs[segs.length - 1]?.arriving_at ?? '',
        duration: '',
        stops,
        segments: segs.map((s) => ({
          origin: s.origin.iata_code,
          originCity: s.origin.city?.name,
          destination: s.destination.iata_code,
          destinationCity: s.destination.city?.name,
          departAt: s.departing_at,
          arriveAt: s.arriving_at,
          flightNumber: s.marketing_carrier_flight_number,
          airline: s.marketing_carrier.name,
          airlineCode: s.marketing_carrier.iata_code,
        })),
      };
    };

    const outboundSummary = summarize(outbound);
    const returnSummary = summarize(returnSlice);
    const firstSeg = outbound?.segments[0];
    const amount = Number.parseFloat(offer.total_amount ?? '0') || 0;
    const currency = offer.total_currency || 'USD';
    const { sellAmount, sellCurrency } = await this.sellPrice(amount, currency);
    const usdPrice = await this.currency.convertToUsd(amount, currency);
    const refundable = !!(offer.refund_before_departure?.refundable && offer.refund_before_departure?.refund_currency);

    return {
      id: offer.id,
      airline: firstSeg?.marketing_carrier.name ?? '',
      airlineCode: firstSeg?.marketing_carrier.iata_code ?? '',
      flightNumber: firstSeg?.marketing_carrier_flight_number ?? '',
      origin: outboundSummary?.origin ?? '',
      destination: outboundSummary?.destination ?? '',
      departureAt: outboundSummary?.departureAt ?? '',
      arrivalAt: outboundSummary?.arrivalAt ?? '',
      duration: '',
      stops: outboundSummary?.stops ?? 0,
      direct: (outboundSummary?.stops ?? 0) === 0,
      price: sellAmount,
      currency: sellCurrency,
      duffelPrice: amount,
      duffelCurrency: currency,
      usdPrice,
      baseAmount: Number.parseFloat(offer.base_amount ?? '0') || 0,
      taxAmount: Number.parseFloat(offer.tax_amount ?? '0') || 0,
      conditions: offer.conditions ?? null,
      refundable,
      requiresInstantPayment: !!(offer.payment_requirements?.requires_instant_payment),
      expiresAt: offer.expires_at ?? '',
      tripSummary: { outbound: outboundSummary, return: returnSummary },
    };
  }

  async getOffer(offerId: string) {
    const response = await this.client().offers.get(offerId, { return_available_services: true });
    return this.normalize(response.data as unknown as DuffelOffer);
  }

  async getSeatMap(offerId: string) {
    try {
      const response = await this.client().seatMaps.get({ offer_id: offerId });
      return response.data;
    } catch (error) {
      this.logger.warn(`Seat map unavailable for ${offerId}: ${error instanceof Error ? error.message : 'provider error'}`);
      return [];
    }
  }

  async getOfferServices(offerId: string) {
    try {
      const response = await this.client().offers.get(offerId, { return_available_services: true });
      const offer = response.data as unknown as DuffelOffer;
      return {
        offerId,
        currency: offer.total_currency ?? 'USD',
        services: (offer.available_services ?? []).map((service) => ({
          id: service.id,
          type: service.type,
          name: service.name,
          price: Number.parseFloat(service.total_amount ?? '0') || 0,
          currency: service.total_currency ?? offer.total_currency ?? 'USD',
          maximumQuantity: service.maximum_quantity ?? 1,
          passengerIds: service.passenger_ids ?? [],
          metadata: service.metadata ?? null,
        })),
      };
    } catch (error) {
      this.logger.warn(`Offer services unavailable for ${offerId}: ${error instanceof Error ? error.message : 'provider error'}`);
      return { offerId, currency: 'USD', services: [] };
    }
  }

  async createOrder(dto: CreateFlightOrderDto, actor: User) {
    const offerResponse = await this.client().offers.get(dto.offerId, { return_available_services: true });
    const offer = offerResponse.data as unknown as DuffelOffer;
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.payment_requirements?.requires_instant_payment) {
      throw new BadRequestException('This fare requires instant payment and cannot be held for booking.');
    }

    const requestedServices = [
      ...(dto.services ?? []).map((service) => ({ id: service.id, quantity: service.quantity ?? 1 })),
      ...(dto.seatSelection ?? []).filter((seat) => seat.serviceId).map((seat) => ({ id: seat.serviceId as string, quantity: 1 })),
    ];
    const availableIds = new Set((offer.available_services ?? []).map((service) => service.id));
    for (const service of requestedServices) {
      if (!availableIds.has(service.id)) throw new BadRequestException(`Selected Duffel service is not available: ${service.id}`);
    }

    const passengers = dto.passengers.map((p, i) => {
      const bornOn = this.toIsoDate(p.dob);
      const gender = (p.gender ?? '').toLowerCase().startsWith('f') ? 'f' : 'm';
      const names = [p.firstName, p.lastName];
      const title = gender === 'f' ? 'ms' : 'mr';
      return {
        id: p.passengerId || `passenger-${i + 1}`,
        title,
        given_name: p.firstName,
        family_name: p.lastName,
        born_on: bornOn,
        gender,
        email: p.email,
        phone_number: p.phone.replace(/^\+/, '+'),
        ...(p.nationality && { nationality: p.nationality.toUpperCase() }),
        ...(p.passportNumber ? {
          document_type: 'passport',
          document_number: p.passportNumber,
          document_expiry_date: this.toIsoDate(p.passportExpiry),
        } : {}),
      };
    });

    const orderResponse = await this.client().orders.create({
      type: 'hold',
      selected_offers: [dto.offerId],
      passengers,
      ...(requestedServices.length ? { services: requestedServices } : {}),
    } as never);
    const order = orderResponse.data as unknown as DuffelOrder;

    const duffelAmount = Number.parseFloat(order.total_amount ?? '0') || 0;
    const duffelCurrency = order.total_currency || 'USD';
    const { sellAmount, sellCurrency, exchangeRate } = await this.sellPrice(duffelAmount, duffelCurrency);
    const tripSummary = this.orderTripSummary(order);

    const record = await this.prisma.flightOrder.create({
      data: {
        userId: actor.id,
        duffelOfferRequestId: dto.offerRequestId,
        duffelOfferId: dto.offerId,
        duffelOrderId: order.id,
        duffelBookingRef: order.booking_reference ?? null,
        origin: tripSummary.origin,
        destination: tripSummary.destination,
        departureDate: tripSummary.departureDate,
        returnDate: tripSummary.returnDate,
        cabinClass: (offer.cabin_class ?? 'economy') as string,
        tripSummary: tripSummary as never,
        passengers: dto.passengers as never,
        duffelAmount,
        duffelCurrency,
        sellAmount,
        sellCurrency,
        exchangeRate,
        customerCurrency: dto.customerCurrency ?? 'ETB',
        baseFare: duffelAmount,
        taxes: 0,
        seatAmount: dto.seatAmount ?? 0,
        ancillaryAmount: dto.ancillaryAmount ?? 0,
        selectedSeats: dto.seatSelection as never,
        selectedServices: [...(dto.services ?? []), ...(dto.seatSelection ?? [])] as never,
        paymentRequiredBy: order.payment_required_by ? new Date(order.payment_required_by) : null,
      },
    });

    return this.orderView(record);
  }

  private orderTripSummary(order: DuffelOrder) {
    const slices = (order.slices ?? []) as DuffelSlice[];
    const outbound = slices[0];
    const returnSlice = slices[1];
    const summarize = (slice?: (typeof slices)[number]) => {
      if (!slice) return null;
      const segs = slice.segments;
      return {
        origin: slice.origin.iata_code,
        destination: slice.destination.iata_code,
        departureAt: segs[0]?.departing_at ?? '',
        arrivalAt: segs[segs.length - 1]?.arriving_at ?? '',
        segments: segs.map((s) => ({
          origin: s.origin.iata_code,
          originCity: s.origin.city?.name,
          destination: s.destination.iata_code,
          destinationCity: s.destination.city?.name,
          departAt: s.departing_at,
          arriveAt: s.arriving_at,
          flightNumber: s.marketing_carrier_flight_number,
          airline: s.marketing_carrier.name,
          airlineCode: s.marketing_carrier.iata_code,
        })),
      };
    };
    return {
      origin: outbound?.origin.iata_code ?? '',
      destination: outbound?.destination.iata_code ?? '',
      departureDate: outbound?.segments[0]?.departing_at?.slice(0, 10) ?? '',
      returnDate: returnSlice?.segments[0]?.departing_at?.slice(0, 10) ?? null,
      outbound: summarize(outbound),
      return: summarize(returnSlice),
    };
  }

  async getOrder(id: string, actor: User) {
    const order = await this.prisma.flightOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Flight order not found');
    this.assertCustomerOrOwned(order, actor);
    return this.orderView(order);
  }

  // Creates a Chapa checkout that, once paid, will fund the held Duffel order.
  async payOrder(id: string, actor: User) {
    const order = await this.prisma.flightOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Flight order not found');
    if (order.userId !== actor.id) throw new ForbiddenException('Flight order not found');
    if (order.status !== FlightOrderStatus.HELD) {
      throw new BadRequestException(`This order is not awaiting payment (current status: ${order.status}).`);
    }
    if (order.paymentRequiredBy && new Date(order.paymentRequiredBy).getTime() < Date.now()) {
      throw new BadRequestException('This booking opportunity has expired. Please search again.');
    }
    const secret = this.config.get<string>('CHAPA_SECRET_KEY');
    if (!secret) {
      this.logger.error(`Chapa flight initialization blocked for ${order.id}: CHAPA_SECRET_KEY is missing`);
      throw new ServiceUnavailableException('Chapa is not configured. Add a Chapa TEST secret key as CHAPA_SECRET_KEY in togt-api/.env.');
    }

    const txRef = `${FLIGHT_REF_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}`;

    const frontend = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
    const names = actor.fullName.trim().split(/\s+/);
    const phone = actor.phone?.replace(/[\s()-]/g, '').replace(/^\+251/, '0');
    const requestBody = {
      amount: String(order.sellAmount),
      currency: order.sellCurrency,
      tx_ref: txRef,
      email: actor.email,
      first_name: names[0] || 'TOGT',
      last_name: names.slice(1).join(' ') || 'Customer',
      ...(phone && { phone_number: phone }),
      callback_url: `${this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3001'}/api/payment/callback`,
      return_url: `${frontend}/en/payment/callback?tx_ref=${encodeURIComponent(txRef)}`,
      customization: { title: 'TOGT Booking', description: 'Flight booking' },
      meta: { flightOrderId: order.id },
    };
    const response = await fetch(`${chapaUrl}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const payload = (await response.json()) as { status?: string; message?: unknown; data?: { checkout_url?: string } };
    if (!response.ok || payload.status !== 'success' || !payload.data?.checkout_url) {
      const reason = typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message ?? payload);
      this.logger.error(`Chapa flight initialization failed: HTTP ${response.status}; ${reason}`);
      throw new BadRequestException(`Chapa initialization failed (${response.status}): ${reason}`);
    }
    await this.prisma.flightOrder.update({ where: { id: order.id }, data: { paymentId: txRef } });
    this.logger.log(`Chapa checkout initialized for flight order ${order.id}`);
    return { checkoutUrl: payload.data.checkout_url, transactionId: txRef };
  }

  // Explicitly confirms a held order: pays Duffel the balance and issues the ticket.
  async confirmOrder(id: string, actor?: User) {
    const order = await this.prisma.flightOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Flight order not found');
    if (order.status === FlightOrderStatus.CONFIRMED) return this.orderView(order);
    if (order.status === FlightOrderStatus.CANCELLED) throw new BadRequestException('Order is cancelled.');
    if (actor) this.assertCustomerOrOwned(order, actor);
    return this.payDuffel(order.id);
  }

  // Pays Duffel the balance for a held order and produces the Ticket record.
  async payDuffel(id: string) {
    const order = await this.prisma.flightOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Flight order not found');
    if (order.status === FlightOrderStatus.CONFIRMED) return this.orderView(order);
    if (!order.duffelOrderId) throw new BadRequestException('Order has not been held with Duffel yet.');

    const client = this.client();
    // Pay the Duffel balance owed on the held order.
    await client.payments.create({
      order_id: order.duffelOrderId,
      payment: { type: 'balance', amount: String(order.duffelAmount), currency: order.duffelCurrency },
    } as never);

    const orderResponse = await client.orders.get(order.duffelOrderId);
    const refreshed = orderResponse.data as unknown as DuffelOrder;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber: `DFL-${Date.now()}-${randomUUID().slice(0, 4)}`,
        userId: order.userId,
        airline: (order.tripSummary as { outbound?: { segments?: Array<{ airline: string }> } }).outbound?.segments?.[0]?.airline ?? '',
        flightNumber: this.flightNumber(order.tripSummary),
        origin: order.origin,
        destination: order.destination,
        departureAt: new Date((order.tripSummary as { outbound?: { departureAt?: string } }).outbound?.departureAt || order.departureDate),
        passengerName: this.passengerNames(order.passengers),
        passengerDetails: (order.passengers as never[] ?? []) as never,
        cabinClass: order.cabinClass,
        paymentMethod: 'Chapa (Card/Telebirr/Bank)',
        totalAmount: order.sellAmount,
        currency: order.sellCurrency,
        status: TicketStatus.CONFIRMED,
      },
    });

    const updated = await this.prisma.flightOrder.update({
      where: { id: order.id },
      data: {
        status: FlightOrderStatus.CONFIRMED,
        ticketId: ticket.id,
        duffelBookingRef: refreshed.booking_reference ?? order.duffelBookingRef,
        paidAt: new Date(),
      },
    });

    await this.notifications.notifyUser(order.userId, {
      type: 'STATUS_UPDATE',
      title: 'Flight booking confirmed',
      message: `Your flight ${order.origin} → ${order.destination} has been ticketed. Reference: ${updated.duffelBookingRef ?? 'n/a'}.`,
      channel: 'IN_APP',
    });

    return this.orderView(updated);
  }

  // Called by the payment service once Chapa confirms a flight payment, or via the verify endpoint.
  async onChapaPaymentSucceeded(txRef: string, chapaPaymentId: string) {
    const order = await this.prisma.flightOrder.findFirst({ where: { paymentId: txRef } });
    if (!order) return { status: 'ignored' };
    if (order.status === FlightOrderStatus.CONFIRMED) return { status: 'success', flightOrderId: order.id };
    await this.prisma.flightOrder.update({
      where: { id: order.id },
      data: { status: FlightOrderStatus.AWAITING_TICKET, paidAt: new Date() },
    });
    try {
      const view = await this.payDuffel(order.id);
      return { status: 'success', flightOrderId: order.id, bookingReference: view.duffelBookingRef ?? null };
    } catch (err) {
      // Payment was collected; ticketing failed. Leave AWAITING_TICKET for manual/cron retry.
      const reason = err instanceof Error ? err.message : 'unknown error';
      await this.prisma.flightOrder.update({
        where: { id: order.id },
        data: { paymentId: chapaPaymentId },
      });
      await this.notifications.notifyUser(order.userId, {
        type: 'STATUS_UPDATE',
        title: 'Payment received — issuing ticket',
        message: 'Your flight payment was received. Your ticket will be issued shortly.',
        channel: 'IN_APP',
      });
      throw new ServiceUnavailableException(`Flight payment received, but ticketing failed: ${reason}`);
    }
  }

  async cancel(id: string, actor: User, confirm = false) {
    const order = await this.prisma.flightOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Flight order not found');
    if (order.userId !== actor.id) throw new ForbiddenException('Flight order not found');
    if (order.status === FlightOrderStatus.CANCELLED) throw new BadRequestException('Order is already cancelled');
    if (!order.duffelOrderId) throw new BadRequestException('Order has not been created yet');

    const client = this.client();
    const quoteResponse = await client.orderCancellations.create({
      order_id: order.duffelOrderId,
    } as never);
    const quote = quoteResponse.data as { id: string; refund_amount: string; refund_currency: string; expires_at: string };

    if (!confirm) {
      return {
        requiresConfirmation: true,
        cancellationId: quote.id,
        refundAmount: Number.parseFloat(quote.refund_amount ?? '0') || 0,
        refundCurrency: quote.refund_currency || 'Duffel',
        expiresAt: quote.expires_at,
      };
    }

    const confirmedResponse = await client.orderCancellations.confirm(quote.id);
    const confirmed = confirmedResponse.data as { id: string };

    const updated = await this.prisma.flightOrder.update({
      where: { id: order.id },
      data: { status: FlightOrderStatus.CANCELLED },
    });
    if (order.ticketId) {
      await this.prisma.ticket.update({
        where: { id: order.ticketId },
        data: { status: TicketStatus.CANCELLED },
      });
    }
    return { cancelled: true, cancellationId: confirmed.id, ...this.orderView(updated) };
  }

  // Verifies a Chapa payment for a flight transaction reference. Used by the payment service bridge.
  async verifyChapa(txRef: string) {
    const order = await this.prisma.flightOrder.findFirst({ where: { paymentId: txRef } });
    if (!order) throw new ForbiddenException('Payment not found');
    const secret = this.config.get<string>('CHAPA_SECRET_KEY');
    if (!secret) throw new ServiceUnavailableException('Chapa is not configured');
    const chapaUrl = this.config.get<string>('CHAPA_API_URL') ?? 'https://api.chapa.co/v1';
    const response = await fetch(`${chapaUrl}/transaction/verify/${encodeURIComponent(txRef)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const payload = (await response.json()) as { status?: string; data?: { status?: string; amount?: number; currency?: string } };
    const status = payload.data?.status ?? payload.status ?? 'pending';
    if (status.toLowerCase() === 'success' && order.status === FlightOrderStatus.HELD) {
      await this.onChapaPaymentSucceeded(txRef, txRef);
    }
    const fresh = await this.prisma.flightOrder.findUnique({ where: { id: order.id } });
    return { status, flightOrderId: order.id, bookingReference: fresh?.duffelBookingRef ?? null };
  }

  private orderView(o: {
    id: string;
    duffelOrderId?: string | null;
    duffelBookingRef?: string | null;
    duffelOfferId: string;
    duffelOfferRequestId?: string | null;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string | null;
    cabinClass: string;
    tripSummary: unknown;
    passengers: unknown;
    duffelAmount: number;
    duffelCurrency: string;
    sellAmount: number;
    sellCurrency: string;
    paymentRequiredBy?: Date | null;
    status: FlightOrderStatus;
    paymentId?: string | null;
    paidAt?: Date | null;
    ticketId?: string | null;
    customerCurrency?: string;
    exchangeRate?: number | null;
    baseFare?: number | null;
    taxes?: number | null;
    seatAmount?: number;
    ancillaryAmount?: number;
    selectedSeats?: unknown;
    selectedServices?: unknown;
    eticketNumber?: string | null;
  }) {
    return {
      id: o.id,
      duffelOrderId: o.duffelOrderId,
      duffelBookingRef: o.duffelBookingRef,
      duffelOfferId: o.duffelOfferId,
      duffelOfferRequestId: o.duffelOfferRequestId,
      origin: o.origin,
      destination: o.destination,
      departureDate: o.departureDate,
      returnDate: o.returnDate,
      cabinClass: o.cabinClass,
      tripSummary: o.tripSummary,
      passengers: o.passengers,
      duffelAmount: o.duffelAmount,
      duffelCurrency: o.duffelCurrency,
      sellAmount: o.sellAmount,
      sellCurrency: o.sellCurrency,
      paymentRequiredBy: o.paymentRequiredBy,
      status: o.status,
      paymentId: o.paymentId,
      paidAt: o.paidAt,
      ticketId: o.ticketId,
      customerCurrency: o.customerCurrency,
      exchangeRate: o.exchangeRate,
      baseFare: o.baseFare,
      taxes: o.taxes,
      seatAmount: o.seatAmount,
      ancillaryAmount: o.ancillaryAmount,
      selectedSeats: o.selectedSeats,
      selectedServices: o.selectedServices,
      eticketNumber: o.eticketNumber,
      requiresPayment: o.status === FlightOrderStatus.HELD,
      isConfirmed: o.status === FlightOrderStatus.CONFIRMED,
    };
  }

  private toIsoDate(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
  }

  private flightNumber(tripSummary: unknown): string {
    const first = (tripSummary as { outbound?: { segments?: Array<{ flightNumber?: string }> } }).outbound?.segments?.[0]?.flightNumber;
    return first ?? '';
  }

  private passengerNames(passengersJson: unknown): string {
    try {
      const list = passengersJson as unknown as Array<{ firstName?: string; lastName?: string }>;
      return list.map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()).filter(Boolean).join(', ') || 'Passenger';
    } catch {
      return 'Passenger';
    }
  }
}
