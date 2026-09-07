import { apiDelete, apiGet, apiPost } from "./client";

export type SystemHealth = { status: string; host: string; uptimeSeconds: number; processUptimeSeconds: number; cpu: { load1m: number; cores: number }; memory: { usedBytes: number; totalBytes: number; usedPercent: number }; database: string; valkey: string; node: string; now: string };
export type ProviderStatus = { provider: string; configured: boolean; enabled: boolean; lastTestedAt?: string; lastTestStatus?: string; rotatedAt?: string };

export const getSystemHealth = () => apiGet<SystemHealth>("/system/health");
export const getSystemMetrics = () => apiGet<{ activeUsers: number; users: number; activeRequests: number; pendingBackups: number; requestRate: number | null; responseTimeMs: number | null; note: string }>("/system/metrics");
export const getSystemProviders = () => apiGet<ProviderStatus[]>("/system/api-keys");
export const saveSystemProvider = (provider: string, secret: string, enabled: boolean) => apiPost(`/system/api-keys`, { provider, secret, enabled });
export const deleteSystemProvider = (provider: string) => apiDelete(`/system/api-keys/${provider}`);
export const testSystemProvider = (provider: string) => apiPost(`/system/api-keys/${provider}/test`);
export const getSystemLogs = (level?: string, search?: string) => apiGet<{ available: boolean; entries: Array<{ id: number; level: string; message: string }>; message?: string }>(`/system/logs?${new URLSearchParams({ ...(level ? { level } : {}), ...(search ? { search } : {}) })}`);
export const getSystemBackups = () => apiGet<Array<{ id: string; status: string; destination: string; startedAt: string; completedAt?: string }>>("/system/backups");
export const requestSystemBackup = () => apiPost("/system/backup");
export const getSystemMaintenance = () => apiGet<{ enabled: boolean; message: string } | null>("/system/maintenance");
export const setSystemMaintenance = (enabled: boolean, message: string) => apiPost("/system/maintenance", { enabled, message });
export const getSystemMigrations = () => apiGet<{ applied: number; runnerConfigured: boolean }>("/system/migrations");
export const getSystemAuditLogs = () => apiGet<Array<{ id: string; action: string; outcome: string; target?: string; createdAt: string }>>("/system/audit-logs");
export const getSystemVersion = () => apiGet<{ version: string; commit: string; node: string; environment: string }>("/system/version");
