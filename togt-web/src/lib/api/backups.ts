import { api, apiDelete, apiGet, apiPatch, apiPost } from "./client";

export interface Backup {
  id: string;
  type: "database" | "full";
  status: "queued" | "running" | "completed" | "failed";
  sizeBytes?: string | number | null;
  filePath?: string | null;
  fileName?: string | null;
  checksum?: string | null;
  error?: string | null;
  triggeredBy?: string | null;
  durationMs?: number | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface BackupSchedule {
  id: string;
  enabled: boolean;
  cron: string;
  timezone: string;
  retentionDays: number;
  updatedAt: string;
}

export interface BackupListResponse {
  data: Backup[];
  schedule: BackupSchedule;
  total: number;
}

export function listBackups(): Promise<BackupListResponse> {
  return apiGet<BackupListResponse>("/backups");
}

export function createBackup(type: "database" | "full" = "database"): Promise<Backup> {
  return apiPost<Backup>("/backups", { type });
}

export function deleteBackup(id: string): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/backups/${id}`);
}

export function updateBackupSchedule(dto: Partial<Pick<BackupSchedule, "enabled" | "cron" | "timezone" | "retentionDays">>): Promise<BackupSchedule> {
  return apiPatch<BackupSchedule>("/backups/schedule", dto);
}

export function restoreBackup(id: string, confirm: string): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/backups/${id}/restore`, { method: "POST", json: { confirm } });
}

export function backupDownloadUrl(id: string): string {
  return `${apiBase()}/api/backups/${id}/download`;
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export function formatBackupSize(size?: string | number | null): string {
  const bytes = typeof size === "string" ? Number(size) : size;
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
