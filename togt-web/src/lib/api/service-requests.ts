import { apiGet, apiPatch, apiPost, apiUpload } from "./client";
import type {
  ProgressHistoryItem,
  RequestStatus,
  ServiceRequest,
  ServiceType,
} from "./types";

export interface ServiceRequestListParams {
  status?: RequestStatus;
  serviceType?: ServiceType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedServiceRequests {
  data: ServiceRequest[];
  total: number;
  page: number;
  limit: number;
}

export function listServiceRequests(
  params?: ServiceRequestListParams,
): Promise<PaginatedServiceRequests> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") search.set(key, String(value));
    });
  }
  const s = search.toString();
  return apiGet<PaginatedServiceRequests>(`/service-requests${s ? `?${s}` : ""}`);
}

export interface CreateServiceRequestPayload {
  serviceType: ServiceType;
  formData: Record<string, unknown>;
  packageId?: string;
}

export function createServiceRequest(
  dto: CreateServiceRequestPayload,
): Promise<ServiceRequest> {
  return apiPost<ServiceRequest>("/service-requests", dto);
}

export interface UpdateStatusPayload {
  status: RequestStatus;
  notes?: string;
  assignToMe?: boolean;
}

export function updateRequestStatus(
  id: string,
  dto: UpdateStatusPayload,
): Promise<ServiceRequest> {
  return apiPatch<ServiceRequest>(`/service-requests/${id}/status`, dto);
}

export function getRequestHistory(id: string): Promise<ProgressHistoryItem[]> {
  return apiGet<ProgressHistoryItem[]>(`/service-requests/${id}/history`);
}

export function uploadRequestDocument(id: string, file: File): Promise<ServiceRequest> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ServiceRequest>(`/service-requests/${id}/documents`, formData);
}
