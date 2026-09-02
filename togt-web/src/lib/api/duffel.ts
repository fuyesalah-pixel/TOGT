import { apiGet, apiPost } from "./client";

export interface Segment {
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departAt: string;
  arriveAt: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
}

export interface SliceSummary {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  segments: Segment[];
}

export interface TripSummary {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  outbound?: SliceSummary | null;
  return?: SliceSummary | null;
}

export interface OfferResult {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
  stops: number;
  direct: boolean;
  price: number;
  currency: string;
  duffelPrice: number;
  duffelCurrency: string;
  usdPrice: number;
  refundable: boolean;
  requiresInstantPayment: boolean;
  expiresAt: string;
  tripSummary: TripSummary;
}

export interface SearchFlightsResponse {
  offerRequestId: string;
  passengerIds: string[];
  offers: OfferResult[];
}

export interface FlightPassenger {
  passengerId?: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender?: string;
  email: string;
  phone: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

export interface FlightOrderView {
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
  tripSummary: TripSummary;
  passengers: unknown;
  duffelAmount: number;
  duffelCurrency: string;
  sellAmount: number;
  sellCurrency: string;
  paymentRequiredBy?: string | null;
  status: string;
  paymentId?: string | null;
  paidAt?: string | null;
  ticketId?: string | null;
  requiresPayment: boolean;
  isConfirmed: boolean;
  customerCurrency?: string;
  exchangeRate?: number | null;
  baseFare?: number | null;
  taxes?: number | null;
  seatAmount?: number;
  ancillaryAmount?: number;
  selectedSeats?: unknown;
  selectedServices?: unknown;
}

export interface CurrencyRates { USD_TO_ETB: number; updatedAt: string; isFallback: boolean }
export interface DuffelServiceOption { id: string; type?: string; name?: string; price: number; currency: string; maximumQuantity: number; passengerIds: string[]; metadata?: unknown }

export function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  directOnly?: boolean;
}) {
  return apiPost<SearchFlightsResponse>("/duffel/search", params);
}

export function getCurrencyRates() {
  return apiGet<CurrencyRates>('/currency/rates');
}

export function getSeatMap(offerId: string) {
  return apiGet<unknown[]>(`/duffel/seat-map?offerId=${encodeURIComponent(offerId)}`);
}

export function getOfferServices(offerId: string) {
  return apiGet<{ offerId: string; currency: string; services: DuffelServiceOption[] }>(`/duffel/offer-services?offerId=${encodeURIComponent(offerId)}`);
}

export function getOffer(offerId: string) {
  return apiGet<OfferResult>(`/duffel/offers/${encodeURIComponent(offerId)}`);
}

export function createFlightOrder(dto: { offerId: string; offerRequestId: string; passengers: FlightPassenger[]; seatSelection?: Array<{ designator: string; passengerId: string; serviceId?: string }>; services?: Array<{ id: string; quantity?: number; passengerId?: string }>; seatAmount?: number; ancillaryAmount?: number; customerCurrency?: string }) {
  return apiPost<FlightOrderView>("/duffel/orders", dto);
}

export function payFlightOrder(orderId: string) {
  return apiPost<{ checkoutUrl: string; transactionId: string }>(`/duffel/orders/${orderId}/pay`);
}

export function getFlightOrder(orderId: string) {
  return apiGet<FlightOrderView>(`/duffel/orders/${orderId}`);
}

export function cancelFlightOrder(orderId: string, confirm = false) {
  return apiPost<{ requiresConfirmation: boolean; refundAmount?: number }>(
    `/duffel/orders/${orderId}/cancel?confirm=${confirm}`,
  );
}
