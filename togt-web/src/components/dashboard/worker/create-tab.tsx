"use client";

import { useState } from "react";
import { Package, UserPlus, Users } from "lucide-react";
import type { Role } from "@/lib/api/types";
import { useUserMutations, useUsers } from "@/hooks/useUsers";
import { useGroupMutations } from "@/hooks/useGroups";
import { useAllPackages } from "@/hooks/usePackages";
import { PageHeader } from "../shared/page-header";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PackageFormDialog } from "./package-form-dialog";
import { ContentCards } from "./content-cards";
import { useAuth } from "@/hooks/useAuth";

function CreateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onClick,
}: {
  icon: typeof Package;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-togt-blue/10 text-togt-blue">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-bold text-togt-navy">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-gray-500">{description}</p>
      <div className="mt-4">
        <Button onClick={onClick} className="bg-togt-blue text-white hover:bg-togt-blue/90">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createUser } = useUserMutations();
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "CUSTOMER" as Role });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!form.fullName.trim() || !form.email.trim()) {
      return setError("Full name and email are required");
    }
    try {
      await createUser.mutateAsync({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        role: form.role,
      });
      setForm({ fullName: "", email: "", phone: "", role: "CUSTOMER" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create user" description="The user can sign in with Google using this email" size="sm">
      <div className="space-y-4">
        <div>
          <Label htmlFor="cu-name">Full name *</Label>
          <Input id="cu-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="cu-email">Email *</Label>
          <Input id="cu-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="cu-phone">Phone</Label>
          <Input id="cu-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251..." />
        </div>
        <div>
          <Label htmlFor="cu-role">Role</Label>
          <select
            id="cu-role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="GUIDE">GUIDE</option>
            {currentUser?.role === "ADMIN" && <><option value="WORKER">WORKER</option><option value="TECH">TECH</option></>}
          </select>
          <p className="mt-1 text-xs text-gray-400">Admin users can only be created by an admin.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending} className="bg-togt-blue text-white hover:bg-togt-blue/90">
            {createUser.isPending ? "Creating..." : "Create user"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function CreateGroupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createGroup, addGroupMembers } = useGroupMutations();
  const { data: packages } = useAllPackages();
  const { data: usersData } = useUsers({ limit: 100 });
  const [form, setForm] = useState({ name: "", packageId: "", startDate: "", endDate: "" });
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [guideIds, setGuideIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = (usersData?.data ?? []).filter((u) =>
    !memberSearch ||
    u.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const toggleId = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      return setError("Name, start date and end date are required");
    }
    try {
      const group = await createGroup.mutateAsync({
        name: form.name.trim(),
        packageId: form.packageId || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      if (memberIds.length > 0) {
        await addGroupMembers.mutateAsync({ id: group.id, userIds: memberIds, role: "MEMBER" });
      }
      if (guideIds.length > 0) {
        await addGroupMembers.mutateAsync({ id: group.id, userIds: guideIds, role: "GUIDE" });
      }
      setForm({ name: "", packageId: "", startDate: "", endDate: "" });
      setMemberIds([]);
      setGuideIds([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  const isPending = createGroup.isPending || addGroupMembers.isPending;

  return (
    <Dialog open={open} onClose={onClose} title="Create group" description="Organize travelers into a guided group" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cg-name">Group name *</Label>
            <Input id="cg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="December 2026 Umrah Group" />
          </div>
          <div>
            <Label htmlFor="cg-pkg">Package</Label>
            <select
              id="cg-pkg"
              value={form.packageId}
              onChange={(e) => setForm({ ...form, packageId: e.target.value })}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">No package</option>
              {packages?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cg-start">Start date *</Label>
              <Input id="cg-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="cg-end">End date *</Label>
              <Input id="cg-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <Label>Members &amp; guides ({memberIds.length + guideIds.length} selected)</Label>
          <Input
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search users..."
            className="mb-2"
          />
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
            {filteredUsers.map((u) => {
              const isMember = memberIds.includes(u.id);
              const isGuide = guideIds.includes(u.id);
              return (
                <div key={u.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <div>
                    <span className="font-medium text-togt-navy">{u.fullName}</span>
                    <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleId(u.id, memberIds, setMemberIds)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isMember ? "bg-togt-blue text-white" : "bg-slate-100 text-gray-500"}`}
                    >
                      Member
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleId(u.id, guideIds, setGuideIds)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isGuide ? "bg-purple-600 text-white" : "bg-slate-100 text-gray-500"}`}
                    >
                      Guide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-togt-blue text-white hover:bg-togt-blue/90">
            {isPending ? "Creating..." : "Create group"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function CreateTab() {
  const [userOpen, setUserOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Create" description="Quickly create users, packages and groups" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CreateCard
          icon={UserPlus}
          title="Create User"
          description="Register a customer, worker or guide. They sign in with Google using this email."
          actionLabel="New user"
          onClick={() => setUserOpen(true)}
        />
        <CreateCard
          icon={Package}
          title="Create Package"
          description="Add a new Umrah, domestic, tourist or foreign package to the catalog."
          actionLabel="New package"
          onClick={() => setPackageOpen(true)}
        />
        <CreateCard
          icon={Users}
          title="Create Group"
          description="Group travelers with assigned guides for a scheduled trip."
          actionLabel="New group"
          onClick={() => setGroupOpen(true)}
        />
      </div>
      <ContentCards />

      <CreateUserDialog open={userOpen} onClose={() => setUserOpen(false)} />
      <PackageFormDialog open={packageOpen} onClose={() => setPackageOpen(false)} />
      <CreateGroupDialog open={groupOpen} onClose={() => setGroupOpen(false)} />
    </div>
  );
}
