import { apiGet, apiPatch, apiPost } from "./client";
import type { Ticket, TicketStatus } from "./types";

export interface TicketList { data: Ticket[]; total: number; page: number; limit: number }
export interface TicketAnalytics { revenueByAirline: [string, number][]; popularRoutes: [string, number][]; monthlyRevenue: [string, number][] }
export interface CreateTicketPayload {
  airline: string; flightNumber: string; origin: string; destination: string;
  departureAt: string; arrivalAt?: string; passengerName: string;
  passengerDetails: unknown[]; seat?: string; cabinClass?: string;
  paymentMethod?: string; totalAmount: number; currency?: string;
}
export function listTickets(params: { search?: string; status?: TicketStatus; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, String(value)); });
  return apiGet<TicketList>(`/tickets${query.toString() ? `?${query}` : ""}`);
}
export function getTicketAnalytics() { return apiGet<TicketAnalytics>("/tickets/analytics"); }
export function createTicket(payload: CreateTicketPayload) { return apiPost<Ticket>("/tickets", payload); }
export function updateTicket(id: string, status: TicketStatus, note?: string) { return apiPatch<Ticket>(`/tickets/${id}`, { status, note }); }
export function requestTicketRefund(id: string, reason?: string) { return apiPost<Ticket>(`/tickets/${id}/refund`, { reason }); }
