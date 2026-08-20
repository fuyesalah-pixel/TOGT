"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserMutations } from "@/hooks/useUsers";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import type { User } from "@/lib/api/types";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../shared/status-badge";

export function UserDetailDialog({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user: currentUser } = useAuth();
  const { updateUser } = useUserMutations();
  const [form, setForm] = useState({ fullName: "", phone: "", passportNumber: "", languagePref: "en" });
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: requests } = useServiceRequests(
    user ? { search: user.email, limit: 5 } : undefined,
  );

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? "",
        phone: user.phone ?? "",
        passportNumber: user.passportNumber ?? "",
        languagePref: user.languagePref ?? "en",
      });
      setFeedback(null);
    }
  }, [user]);

  if (!user) return null;

  const isAdminTarget = user.role === "ADMIN";
  const canEdit = currentUser?.role === "ADMIN" || (currentUser?.role === "WORKER" && !isAdminTarget);

  const handleSave = async () => {
    setFeedback(null);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        dto: {
          fullName: form.fullName || undefined,
          phone: form.phone || undefined,
          passportNumber: form.passportNumber || undefined,
          languagePref: form.languagePref,
        },
      });
      setFeedback("Saved.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={user.fullName} description={user.email} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={user.role} />
          <StatusBadge value={user.status} />
          <span className="text-xs text-gray-400">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </span>
          {isAdminTarget && (
            <span className="rounded-full bg-togt-orange/10 px-2.5 py-0.5 text-xs font-semibold text-togt-orange">
              Admin accounts cannot be modified here
            </span>
          )}
        </div>

        {canEdit ? (
          <div className="rounded-xl border border-gray-100 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Edit profile</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Passport number</Label>
                <Input value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} />
              </div>
              <div>
                <Label>Language</Label>
                <select
                  value={form.languagePref}
                  onChange={(e) => setForm({ ...form, languagePref: e.target.value })}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="ar">Arabic</option>
                  <option value="om">Oromiffa</option>
                </select>
              </div>
            </div>
            {feedback && <p className="mt-2 text-sm text-togt-blue">{feedback}</p>}
            <div className="mt-3">
              <Button onClick={handleSave} disabled={updateUser.isPending} className="bg-togt-blue text-white hover:bg-togt-blue/90">
                {updateUser.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-4 text-sm">
            <div><dt className="text-gray-400">Phone</dt><dd>{user.phone ?? "—"}</dd></div>
            <div><dt className="text-gray-400">Passport</dt><dd>{user.passportNumber ?? "—"}</dd></div>
            <div><dt className="text-gray-400">Language</dt><dd>{user.languagePref}</dd></div>
          </dl>
        )}

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Recent requests
          </h3>
          {requests?.data?.length ? (
            <div className="divide-y divide-gray-50 rounded-xl border border-gray-100">
              {requests.data.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{r.serviceType.replace(/_/g, " ")}</span>
                  <StatusBadge value={r.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No service requests for this user.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
