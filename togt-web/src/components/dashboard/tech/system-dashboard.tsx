"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, Terminal, Wrench, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { deleteSystemProvider, getSystemAuditLogs, getSystemHealth, getSystemLogs, getSystemMaintenance, getSystemMetrics, getSystemMigrations, getSystemProviders, getSystemVersion, saveSystemProvider, setSystemMaintenance, testSystemProvider, type ProviderStatus, type SystemHealth } from "@/lib/api/system";
import { listSiteSettings, updateSiteSettings, type SiteSettingRow } from "@/lib/api/siteSettings";
import { BackupsTab } from "@/components/dashboard/shared/backups-tab";

const tabs = ["Overview", "Providers", "Database", "Backups", "Logs", "Security", "Maintenance", "Okra Tech"] as const;
const providerLabels: Record<string, string> = { OPENROUTER: "OpenRouter", OPENAI: "OpenAI", GEMINI: "Google Gemini", DUFFEL: "Duffel", CHAPA: "Chapa", RESEND: "Resend", SMS_ETHIOPIA: "SMSEthiopia", MAPBOX: "Mapbox", R2: "Cloudflare R2", TELEGRAM: "Telegram", TELEGRAM_SUPPORT_BOT: "Telegram Support Bot", TELEGRAM_BACKUP_BOT: "Telegram Backup Bot", TELEGRAM_BACKUP_CHAT: "Telegram Backup Chat ID", FIREBASE: "Firebase / FCM" };
/** Per-provider guidance shown when saving a secret — keeps key formats right. */
const providerSecretHints: Record<string, string> = {
  CHAPA: "Paste the Chapa SECRET key (starts with CHASECK-) from Chapa Dashboard → API Keys. The Public key (CHAPUBK-) is not used by the backend and the Encryption key is not needed here. Use Test to verify the key with Chapa's live API.",
  DUFFEL: "Paste the Duffel API access token (starts with duffel_...).",
  R2: "Paste the Cloudflare R2 secret access key.",
  TELEGRAM_BACKUP_CHAT: "Paste the Telegram chat ID (a number, e.g. 123456789).",
  TELEGRAM_SUPPORT_BOT: "Paste the bot token from @BotFather (format 123456:ABC-DEF...).",
  TELEGRAM_BACKUP_BOT: "Paste the bot token from @BotFather (format 123456:ABC-DEF...).",
};
const fmtBytes = (n?: number) => n == null ? "—" : `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
const fmtUptime = (n: number) => `${Math.floor(n / 86400)}d ${Math.floor(n / 3600) % 24}h ${Math.floor(n / 60) % 60}m`;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>; }
function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}><span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />{children}</span>; }

const DEFAULT_MAINTENANCE_MESSAGE = "TOGT is temporarily unavailable for maintenance.";
type MaintenanceRow = { enabled: boolean; message: string; updatedAt?: string };

/** Maintenance mode card. Every change saves automatically — the toggle saves
 * instantly, the message ~1s after typing stops — so the state can never be
 * lost by closing the tab. A failed save is kept locally and can be retried. */
function MaintenanceCard({ onEnabledChange, refreshKey }: { onEnabledChange: (enabled: boolean) => void; refreshKey: number }) {
  const [row, setRow] = useState<MaintenanceRow | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loadError, setLoadError] = useState("");
  const pendingRef = useRef<MaintenanceRow | null>(null);
  const savingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip refreshes while a local change is unsaved/in-flight so the server can
    // never clobber the user's edits.
    if (pendingRef.current || savingRef.current) return;
    let active = true;
    getSystemMaintenance().then((data) => { if (active && data) { setRow(data); onEnabledChange(data.enabled); } }).catch(() => { if (active && !row) setLoadError("Could not load the saved maintenance state."); });
    return () => { active = false; if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [onEnabledChange, refreshKey, row]);

  const runSave = async () => {
    if (savingRef.current) return; // an in-flight save drains newer edits itself
    savingRef.current = true;
    setStatus("saving");
    try {
      while (pendingRef.current) {
        const draft = pendingRef.current;
        pendingRef.current = null;
        try {
          const saved = await setSystemMaintenance(draft.enabled, draft.message);
          if (!pendingRef.current) setRow(saved); // never clobber newer local edits
          onEnabledChange(saved.enabled);
        } catch (error) {
          if (!pendingRef.current) pendingRef.current = draft; // keep the failed change for retry
          throw error;
        }
      }
      setStatus("saved");
      window.setTimeout(() => setStatus((current) => (current === "saved" ? "idle" : current)), 2500);
    } catch { setStatus("error"); } finally { savingRef.current = false; }
  };

  const update = (next: MaintenanceRow, immediate: boolean) => {
    setRow(next);
    pendingRef.current = next;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (immediate) void runSave();
    else debounceRef.current = window.setTimeout(() => { debounceRef.current = null; void runSave(); }, 900);
  };

  const flushSave = () => {
    if (debounceRef.current) { window.clearTimeout(debounceRef.current); debounceRef.current = null; }
    void runSave();
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-black text-togt-navy">Maintenance mode</h2>
          <p className="mt-1 text-sm text-slate-500">Changes save automatically and take effect immediately: while the site is under development visitors see the maintenance screen, and TECH accounts keep full access.</p>
        </div>
        <Wrench className="h-6 w-6 shrink-0 text-togt-orange" />
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={row?.enabled ?? false} onChange={(event) => update({ enabled: event.target.checked, message: row?.message ?? DEFAULT_MAINTENANCE_MESSAGE }, true)} />
        Enabled — show the maintenance screen to visitors
      </label>
      <textarea value={row?.message ?? DEFAULT_MAINTENANCE_MESSAGE} onChange={(event) => update({ enabled: row?.enabled ?? false, message: event.target.value }, false)} className="mt-3 min-h-24 w-full rounded-xl border p-3 text-sm" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button disabled={status === "saving"} onClick={flushSave} className="rounded-lg bg-togt-blue px-4 py-2 text-sm font-bold text-white">{status === "error" ? "Retry save" : "Save now"}</button>
        <span className={`text-xs font-semibold ${status === "error" ? "text-rose-600" : status === "saved" ? "text-emerald-600" : "text-slate-500"}`}>
          {status === "saving" ? "Saving…" : status === "saved" ? "All changes saved ✓" : status === "error" ? "Save failed — your change is kept, press Retry." : row?.updatedAt ? `Last saved ${new Date(row.updatedAt).toLocaleString()}` : "All changes save automatically."}
        </span>
      </div>
      {loadError && <p className="mt-2 text-sm text-rose-600">{loadError}</p>}
    </Card>
  );
}

export function SystemDashboard() {
  const [tab, setTabState] = useState<(typeof tabs)[number]>(() => { if (typeof window === "undefined") return "Overview"; const requested = new URLSearchParams(window.location.search).get("systemTab"); return (tabs as readonly string[]).includes(requested ?? "") ? (requested as (typeof tabs)[number]) : "Overview"; });
  // Keep the active panel in the URL (?systemTab=…) so reopening or sharing the
  // link restores the exact tab. Uses its own param so it never clashes with the
  // dashboard-shell ?tab= navigation.
  const setTab = (next: (typeof tabs)[number]) => { setTabState(next); if (typeof window !== "undefined") { const url = new URL(window.location.href); url.searchParams.set("systemTab", next); window.history.replaceState(null, "", url); } };
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<{ activeUsers: number; users: number; activeRequests: number; pendingBackups: number; requestRate: number | null; responseTimeMs: number | null; note: string } | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});
  const [logs, setLogs] = useState<Array<{ id: number; level: string; message: string }>>([]);
  const [audit, setAudit] = useState<Array<{ id: string; action: string; outcome: string; target?: string; createdAt: string }>>([]);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [migrations, setMigrations] = useState<{ applied: number; runnerConfigured: boolean } | null>(null);
  const [version, setVersion] = useState<{ version: string; commit: string; node: string; environment: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [siteSettingRows, setSiteSettingRows] = useState<Record<string, string>>({});
  const [siteSettingStatus, setSiteSettingStatus] = useState<string>("");
  const [systemRefreshKey, setSystemRefreshKey] = useState(0);

  const load = async () => {
    setError("");
    try {
      const [h, m, p, l, a, ma, mi, v] = await Promise.all([getSystemHealth(), getSystemMetrics(), getSystemProviders(), getSystemLogs(), getSystemAuditLogs(), getSystemMaintenance(), getSystemMigrations(), getSystemVersion()]);
      setHealth(h); setMetrics(m); setProviders(p); setLogs(l.entries); setAudit(a); setMaintenanceEnabled(!!ma?.enabled); setMigrations(mi); setVersion(v); setSystemRefreshKey((key) => key + 1);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Unable to load system data"); }
  };
  const loadSiteSettings = async () => {
    try {
      const rows: SiteSettingRow[] = await listSiteSettings();
      setSiteSettingRows(Object.fromEntries(rows.map((row) => [row.key, row.value])));
    } catch { /* non-fatal */ }
  };
  useEffect(() => { void loadSiteSettings(); }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 30000); return () => window.clearInterval(timer); }, []);
  const alerts = useMemo(() => [health?.database !== "UP" ? "Database is unavailable" : null, health && health.memory.usedPercent > 85 ? "Memory usage is high" : null, maintenanceEnabled ? "Maintenance mode is enabled" : null].filter(Boolean) as string[], [health, maintenanceEnabled]);
  const handleMaintenanceEnabled = useCallback((enabled: boolean) => setMaintenanceEnabled(enabled), []);
  const action = async (fn: () => Promise<unknown>) => { setBusy(true); setError(""); try { await fn(); await load(); } catch (e) { setError(e instanceof ApiError ? e.message : "Operation failed"); } finally { setBusy(false); } };
  const runTest = async (provider: string) => {
    setBusy(true); setError("");
    setTestResults((current) => ({ ...current, [provider]: { status: "RUNNING", message: "Testing…" } }));
    try {
      const result = await testSystemProvider(provider) as { status: string; detail?: string; username?: string };
      setTestResults((current) => ({ ...current, [provider]: { status: result.status, message: result.status === "PASS" ? (result.detail || result.username || "Test passed.") : (result.detail || "Test failed.") } }));
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Test failed";
      setTestResults((current) => ({ ...current, [provider]: { status: "FAIL", message } }));
      setError(message);
    } finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-togt-orange">Operations center</p><h1 className="mt-1 text-3xl font-black text-togt-navy">System Control</h1><p className="mt-1 text-sm text-slate-500">TECH-only infrastructure, security, and service operations.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-togt-blue px-4 py-2.5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Refresh</button></div>
    {error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><XCircle className="h-4 w-4" />{error}</div>}
    {alerts.length > 0 && <div className="grid gap-2 md:grid-cols-3">{alerts.map((alert) => <div key={alert} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{alert}</div>)}</div>}
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold ${tab === item ? "bg-togt-navy text-white" : "text-slate-500 hover:bg-slate-100"}`}>{item}</button>)}</div>
    {tab === "Overview" && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card><p className="text-xs font-bold uppercase text-slate-400">System</p><p className="mt-2 text-xl font-black text-togt-navy">{health?.status ?? "CHECKING"}</p><p className="text-xs text-slate-500">{health?.host ?? "—"}</p></Card><Card><p className="text-xs font-bold uppercase text-slate-400">Memory</p><p className="mt-2 text-xl font-black text-togt-navy">{health?.memory.usedPercent ?? "—"}%</p><p className="text-xs text-slate-500">{fmtBytes(health?.memory.usedBytes)} / {fmtBytes(health?.memory.totalBytes)}</p></Card><Card><p className="text-xs font-bold uppercase text-slate-400">Active users</p><p className="mt-2 text-xl font-black text-togt-navy">{metrics?.activeUsers ?? "—"}</p><p className="text-xs text-slate-500">{metrics?.users ?? "—"} total accounts</p></Card><Card><p className="text-xs font-bold uppercase text-slate-400">Uptime</p><p className="mt-2 text-xl font-black text-togt-navy">{health ? fmtUptime(health.uptimeSeconds) : "—"}</p><p className="text-xs text-slate-500">Node {health?.node ?? "—"}</p></Card></div><Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-togt-navy">Core services</h2><Status ok={health?.status === "UP"}>API {health?.status ?? "CHECKING"}</Status></div><div className="grid gap-3 sm:grid-cols-4"><Status ok={health?.database === "UP"}>PostgreSQL {health?.database ?? "—"}</Status><Status ok={health?.valkey === "CONFIGURED"}>Valkey {health?.valkey ?? "—"}</Status><Status ok={!!health}>Web reachable via dashboard</Status><Status ok={false}>Host runner unavailable</Status></div></Card><Card><h2 className="mb-3 font-black text-togt-navy">Operational snapshot</h2><div className="grid gap-3 text-sm sm:grid-cols-3"><p>Active requests: <b>{metrics?.activeRequests ?? "—"}</b></p><p>Pending backups: <b>{metrics?.pendingBackups ?? "—"}</b></p><p>Request rate: <b>{metrics?.requestRate ?? "Not collected"}</b></p></div></Card></div>}
    {tab === "Providers" && <Card><div className="mb-4 flex items-center justify-between"><div><h2 className="font-black text-togt-navy">Provider credentials</h2><p className="text-xs text-slate-500">Secrets are write-only and never returned by the API. Changes take effect immediately — no redeploy needed.</p></div><LockKeyhole className="h-5 w-5 text-togt-orange" /></div><div className="grid gap-3 md:grid-cols-2">{providers.map((item) => <div key={item.provider} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-bold text-togt-navy">{providerLabels[item.provider] ?? item.provider}</p><div className="mt-1 flex gap-2"><Status ok={item.configured}>{item.configured ? "SET" : "MISSING"}</Status>{item.lastTestStatus && <Status ok={item.lastTestStatus === "PASS"}>{item.lastTestStatus}</Status>}</div>{testResults[item.provider] && <p className={`mt-1.5 max-w-xs text-xs font-medium ${testResults[item.provider].status === "PASS" ? "text-emerald-600" : testResults[item.provider].status === "RUNNING" ? "text-slate-500" : "text-rose-600"}`}>{testResults[item.provider].message}</p>}</div><div className="flex gap-2"><button disabled={busy} onClick={() => void runTest(item.provider)} className="rounded-lg border px-3 py-2 text-xs font-bold">Test</button><button onClick={() => { setSelectedProvider(item.provider); setSecret(""); }} className="rounded-lg bg-togt-blue px-3 py-2 text-xs font-bold text-white">{item.configured ? "Rotate" : "Add"}</button>{item.configured && <button onClick={() => void action(() => deleteSystemProvider(item.provider))} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600">Delete</button>}</div></div>)}</div></Card>}
    {tab === "Database" && <div className="grid gap-4 md:grid-cols-2"><Card><Database className="mb-3 h-6 w-6 text-togt-blue" /><h2 className="font-black text-togt-navy">Database status</h2><p className="mt-2 text-sm">Connection: <b>{health?.database ?? "—"}</b></p><p className="text-sm">Applied migrations: <b>{migrations?.applied ?? "—"}</b></p><p className="text-sm">Runner: <b>{migrations?.runnerConfigured ? "Configured" : "Not configured"}</b></p></Card><Card><Terminal className="mb-3 h-6 w-6 text-togt-orange" /><h2 className="font-black text-togt-navy">Migration control</h2><p className="mt-2 text-sm text-slate-500">Migration execution is fail-closed until the restricted host runner is installed.</p><button disabled className="mt-4 rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-500">Runner unavailable</button></Card></div>}
    {tab === "Backups" && <BackupsTab />}
    {tab === "Logs" && <Card><div className="mb-4 flex items-center gap-2"><Terminal className="h-5 w-5 text-togt-blue" /><h2 className="font-black text-togt-navy">Redacted system logs</h2></div>{logs.length ? <div className="max-h-[32rem] overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200">{logs.map((log) => <p key={log.id} className={log.level === "ERROR" ? "text-rose-300" : log.level === "WARN" ? "text-amber-300" : ""}>[{log.level}] {log.message}</p>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No allowlisted log source configured.</p>}</Card>}
    {tab === "Security" && <div className="space-y-4"><Card><ShieldCheck className="mb-3 h-6 w-6 text-emerald-600" /><h2 className="font-black text-togt-navy">Audit trail</h2><div className="mt-3 space-y-2">{audit.length ? audit.map((item) => <div key={item.id} className="flex justify-between border-b py-2 text-sm"><span>{item.action} {item.target ?? ""}</span><span className="text-slate-500">{item.outcome} · {new Date(item.createdAt).toLocaleString()}</span></div>) : <p className="text-sm text-slate-500">No operations recorded.</p>}</div></Card><Card><KeyRound className="mb-3 h-6 w-6 text-togt-orange" /><h2 className="font-black text-togt-navy">Build and runtime</h2><p className="text-sm">Version: {version?.version ?? "—"}</p><p className="text-sm">Commit: {version?.commit ?? "—"}</p><p className="text-sm">Environment: {version?.environment ?? "—"}</p></Card></div>}
    {tab === "Maintenance" && <MaintenanceCard onEnabledChange={handleMaintenanceEnabled} refreshKey={systemRefreshKey} />}
    {tab === "Okra Tech" && <Card><div className="mb-4 flex items-center justify-between"><div><h2 className="font-black text-togt-navy">Footer credit — Developed by Okra Tech</h2><p className="text-xs text-slate-500">Shown at the bottom of the public website footer. Changes go live immediately after saving.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-togt-navy">Website link (URL)<input value={siteSettingRows.OKRA_LINK ?? ""} onChange={(event) => setSiteSettingRows((current) => ({ ...current, OKRA_LINK: event.target.value }))} placeholder="https://okratech.et" className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" /></label><label className="text-sm font-bold text-togt-navy">Logo image URL<input value={siteSettingRows.OKRA_IMAGE ?? ""} onChange={(event) => setSiteSettingRows((current) => ({ ...current, OKRA_IMAGE: event.target.value }))} placeholder="https://…/okra-logo.png (leave empty to show text only)" className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" /></label></div>{siteSettingRows.OKRA_IMAGE ? <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><img src={siteSettingRows.OKRA_IMAGE} alt="Okra Tech logo preview" className="h-10 w-auto max-w-40 object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="text-xs text-slate-500">Live preview (as it appears in the footer)</span></div> : null}<div className="mt-4 flex items-center gap-3"><button disabled={busy} onClick={() => void action(async () => { await updateSiteSettings([{ key: "OKRA_LINK", value: siteSettingRows.OKRA_LINK ?? "" }, { key: "OKRA_IMAGE", value: siteSettingRows.OKRA_IMAGE ?? "" }]); setSiteSettingStatus("Footer credit updated."); void loadSiteSettings(); })} className="rounded-lg bg-togt-orange px-4 py-2 text-sm font-bold text-white">Save footer credit</button>{siteSettingStatus && <span className="text-xs font-semibold text-emerald-600">{siteSettingStatus}</span>}</div></Card>}
    {selectedProvider && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><h2 className="font-black text-togt-navy">Configure {providerLabels[selectedProvider] ?? selectedProvider}</h2><button onClick={() => setSelectedProvider(null)}><XCircle className="h-5 w-5" /></button></div>            <p className="mt-2 text-xs text-slate-500">{providerSecretHints[selectedProvider] ?? "The value is encrypted at rest and cannot be viewed after saving."}</p><input autoFocus type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder={selectedProvider === "CHAPA" ? "CHASECK-xxxxxxxxxxxxxxxxxxxxxxxx" : "Paste secret value"} className="mt-4 w-full rounded-xl border p-3 text-sm" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setSelectedProvider(null)} className="rounded-lg border px-4 py-2 text-sm font-bold">Cancel</button><button disabled={!secret || busy} onClick={() => void action(async () => { await saveSystemProvider(selectedProvider, secret, true); setSelectedProvider(null); })} className="rounded-lg bg-togt-orange px-4 py-2 text-sm font-bold text-white">Save encrypted key</button></div></div></div>}
  </div>;
}
