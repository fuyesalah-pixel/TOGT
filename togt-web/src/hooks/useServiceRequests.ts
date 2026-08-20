"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createServiceRequest,
  getRequestHistory,
  listServiceRequests,
  uploadRequestDocument,
  updateRequestStatus,
  type CreateServiceRequestPayload,
  type ServiceRequestListParams,
  type UpdateStatusPayload,
} from "@/lib/api/service-requests";

export function useServiceRequests(params?: ServiceRequestListParams) {
  return useQuery({
    queryKey: ["service-requests", params ?? {}],
    queryFn: () => listServiceRequests(params),
  });
}

export function useRequestHistory(id?: string) {
  return useQuery({
    queryKey: ["request-history", id],
    queryFn: () => getRequestHistory(id as string),
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateServiceRequestPayload) => createServiceRequest(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["service-requests"] }),
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStatusPayload }) =>
      updateRequestStatus(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["request-history", variables.id] });
    },
  });
}

export function useUploadRequestDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadRequestDocument(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["service-requests"] }),
  });
}
