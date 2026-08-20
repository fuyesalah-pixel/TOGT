"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, getTicketAnalytics, listTickets, requestTicketRefund, updateTicket, type CreateTicketPayload } from "@/lib/api/tickets";
import type { TicketStatus } from "@/lib/api/types";

export function useTickets(params: { search?: string; status?: TicketStatus } = {}) {
  return useQuery({ queryKey: ["tickets", params], queryFn: () => listTickets(params), staleTime: 0 });
}
export function useTicketMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["tickets"] });
  return {
    create: useMutation({ mutationFn: (payload: CreateTicketPayload) => createTicket(payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, status, note }: { id: string; status: TicketStatus; note?: string }) => updateTicket(id, status, note), onSuccess: invalidate }),
    refund: useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => requestTicketRefund(id, reason), onSuccess: invalidate }),
  };
}
export function useTicketAnalytics(enabled = true) {
  return useQuery({ queryKey: ["tickets", "analytics"], queryFn: getTicketAnalytics, enabled, staleTime: 0 });
}
