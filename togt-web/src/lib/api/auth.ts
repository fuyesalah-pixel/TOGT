import { apiGet, apiPost } from "./client";
import type { User } from "./types";

export function getMe(): Promise<User> {
  return apiGet<User>("/auth/me");
}

export function logout(): Promise<void> {
  return apiPost<void>("/auth/logout");
}
