"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Download, HardDriveDownload, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  backupDownloadUrl,
  createBackup,
  deleteBackup,
  formatBackupSize,
  listBackups,
  restoreBackup,
  updateBackupSchedule,
  type Backup,
  type BackupSchedule,
} from "@/lib/api/backups";
import { ApiError } from "@/lib/api/client";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  running: "bg-blue-50 text-blue-700",
  queued: "bg-amber-50 text-amber-700",
};

function triggerLabel(triggeredBy?: string | null): string {
  if (triggeredBy === "scheduler") return "Automatic schedule";
  if (!triggeredBy) return "Unknown";
  return `Manual (${triggeredBy.slice(0, 8)})`;
}

export function BackupsTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isTech = user?.role === "TECH";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await listBackups();
      setBackups(result.data ?? []);
      setSchedule(result.schedule ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const handleCreate = async () => {
    setBusy(true);
    setCreating(true);
    try {
      await createBackup("database");
      showToast({ title: "Backup queued", message: "The backup is running. This list updates automatically." });
      await load();
    } catch (e) {
      showToast({ title: "Backup failed to start", message: e instanceof ApiError ? e.message : "Try again." });
    } finally {
      setBusy(false);
      setCreating(false);
    }
  };

  const handleDelete = async (backup: Backup) => {
    setBusy(true);
    try {
      await deleteBackup(backup.id);
      showToast({ title: "Backup deleted", message: "Removed from disk and catalog." });
      await load();
    } catch (e) {
      showToast({ title: "Delete failed", message: e instanceof ApiError ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setBusy(true);
    try {
      await restoreBackup(restoreTarget.id, restoreConfirm);
      showToast({ title: "Restore acknowledged", message: "Follow the restore instructions returned by the API." });
      setRestoreTarget(null);
      setRestoreConfirm("");
    } catch (e) {
      showToast({ title: "Restore failed", message: e instanceof ApiError ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const handleScheduleSave = async () => {
    if (!schedule) return;
    setSavingSchedule(true);
    try {
      const updated = await updateBackupSchedule({
        enabled: schedule.enabled,
        cron: schedule.cron,
        timezone: schedule.timezone,
        retentionDays: schedule.retentionDays,
      });
      setSchedule(updated);
      showToast({ title: "Schedule saved", message: `Automatic backups ${updated.enabled ? "enabled" : "disabled"}.` });
    } catch (e) {
      showToast({ title: "Schedule not saved", message: e instanceof ApiError ? e.message : "Try again." });
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Backups"
        description="Database backups with Telegram notifications, automatic schedule, and manual runs."
        actions={
          <Button onClick={handleCreate} disabled={busy} className="bg-togt-orange text-white hover:bg-togt-orange/90">
            <Plus className="h-4 w-4" />
            {creating ? "Backup running..." : "Create Backup Now"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {schedule && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-togt-navy">
                    <HardDriveDownload className="h-4 w-4 text-togt-orange" /> Automatic backup
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {schedule.enabled ? "Enabled" : "Disabled"} · cron <code className="rounded bg-gray-100 px-1">{schedule.cron}</code> · {schedule.timezone} · keep {schedule.retentionDays} days
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
                  <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <Label>Enabled</Label>
                  <select
                    value={schedule.enabled ? "1" : "0"}
                    onChange={(e) => setSchedule({ ...schedule, enabled: e.target.value === "1" })}
                    className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="1">Enabled</option>
                    <option value="0">Disabled</option>
                  </select>
                </div>
                <div>
                  <Label>Cron (m h dom mon dow)</Label>
                  <Input value={schedule.cron} onChange={(e) => setSchedule({ ...schedule, cron: e.target.value })} className="mt-1 h-8" />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input value={schedule.timezone} onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })} className="mt-1 h-8" />
                </div>
                <div>
                  <Label>Retention (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={schedule.retentionDays}
                    onChange={(e) => setSchedule({ ...schedule, retentionDays: Number(e.target.value) })}
                    className="mt-1 h-8"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Button size="sm" onClick={handleScheduleSave} disabled={savingSchedule} className="bg-togt-blue text-white hover:bg-togt-blue/90">
                    {savingSchedule ? "Saving..." : "Save schedule"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-bold text-togt-navy">Backup history</h2>
            </div>
            {backups.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">No backups yet — create one with the button above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Trigger</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 text-gray-700">{new Date(backup.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{backup.type}</td>
                        <td className="px-4 py-3 text-gray-600">{formatBackupSize(backup.sizeBytes)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[backup.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {backup.status}
                            {backup.status === "failed" && backup.error ? ` — ${backup.error.slice(0, 60)}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{triggerLabel(backup.triggeredBy)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {backup.status === "completed" && (
                              <a href={backupDownloadUrl(backup.id)} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /> Download</Button>
                              </a>
                            )}
                            {isTech && backup.status === "completed" && (
                              <Button variant="ghost" size="sm" onClick={() => setRestoreTarget(backup)}>
                                <RotateCcw className="h-4 w-4" /> Restore
                              </Button>
                            )}
                            <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => void handleDelete(backup)} disabled={busy}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={!!restoreTarget}
        onClose={() => {
          setRestoreTarget(null);
          setRestoreConfirm("");
        }}
        title={restoreTarget ? `Restore from ${new Date(restoreTarget.createdAt).toLocaleString()}` : "Restore"}
        description="Restoring overwrites the current database. This action is irreversible."
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Type <b>RESTORE</b> to confirm. The API verifies the artifact checksum and returns the exact restore
            command for the host; automatic in-place restore is fail-closed while the platform is running.
          </p>
          <Input value={restoreConfirm} onChange={(e) => setRestoreConfirm(e.target.value)} placeholder="Type RESTORE" />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRestoreTarget(null);
                setRestoreConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={restoreConfirm !== "RESTORE" || busy} onClick={handleRestore}>
              {busy ? "Working..." : "Confirm restore"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
