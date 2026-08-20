import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { Role, ServiceType, Status, User } from "./types";

export interface UserListParams {
  search?: string;
  role?: Role;
  status?: Status;
  serviceType?: ServiceType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

function qs(params?: UserListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

export function listUsers(params?: UserListParams): Promise<PaginatedUsers> {
  return apiGet<PaginatedUsers>(`/users${qs(params)}`);
}

export function getUser(id: string): Promise<User> {
  return apiGet<User>(`/users/${id}`);
}

export interface ProfileChange {
  id: string;
  userId: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedAt: string;
  ipAddress?: string | null;
  deviceInfo?: string | null;
}

export function getUserChanges(id: string): Promise<ProfileChange[]> {
  return apiGet<ProfileChange[]>(`/users/${id}/changes`);
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthday?: string;
  nationality?: string;
  passportIssueDate?: string;
  role?: Role;
  languagePref?: string;
}

export function createUser(dto: CreateUserPayload): Promise<User> {
  return apiPost<User>("/users", dto);
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  nationality?: string;
  passportIssueDate?: string;
  passportNumber?: string;
  passportExpiry?: string;
  languagePref?: string;
}

export function updateUser(id: string, dto: UpdateUserPayload): Promise<User> {
  return apiPatch<User>(`/users/${id}`, dto);
}

export function terminateUser(id: string): Promise<User> {
  return apiDelete<User>(`/users/${id}`);
}

export function setUserStatus(id: string, status: Status): Promise<User> {
  return apiPatch<User>(`/users/${id}/status`, { status });
}

export function changeUserRole(id: string, role: Role): Promise<User> {
  return apiPatch<User>(`/users/${id}/role`, { role });
}
