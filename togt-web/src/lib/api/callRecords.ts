import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { CallRecord, CallRecordFilters, CallRecordPayload } from "./types";

export interface CallRecordList {
  data: CallRecord[];
  total: number;
  page: number;
  limit: number;
}

export function listCallRecords(params: CallRecordFilters = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return apiGet<CallRecordList>(`/call-records${query.toString() ? `?${query}` : ""}`);
}

export function getCallRecord(id: string) {
  return apiGet<CallRecord>(`/call-records/${id}`);
}

export function getUsedTeamNumbers() {
  return apiGet<{ used: string[] }>("/call-records/used-team-numbers");
}

export function createCallRecord(payload: CallRecordPayload) {
  return apiPost<CallRecord>("/call-records", payload);
}

export function updateCallRecord(id: string, payload: Partial<CallRecordPayload>) {
  return apiPatch<CallRecord>(`/call-records/${id}`, payload);
}

export function deleteCallRecord(id: string) {
  return apiDelete<{ ok: boolean }>(`/call-records/${id}`);
}
