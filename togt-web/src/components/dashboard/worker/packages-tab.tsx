"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Package } from "@/lib/api/types";
import { useAllPackages, usePackageMutations } from "@/hooks/usePackages";
import { useGroups } from "@/hooks/useGroups";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { PackageFormDialog } from "./package-form-dialog";

export function PackagesTab() {
  const { data: packages, isLoading } = useAllPackages();
  const { deletePackage, togglePackage, attachPackageGroup } = usePackageMutations();
  const { data: groups } = useGroups();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [deleting, setDeleting] = useState<Package | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const filteredPackages = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return [...(packages ?? [])]
      .filter((pkg) => !normalized || `${pkg.title} ${pkg.destination ?? ""} ${pkg.type}`.toLowerCase().includes(normalized))
      .filter((pkg) => !type || pkg.type.startsWith(type))
      .filter((pkg) => !status || (status === "active" ? pkg.isActive : !pkg.isActive))
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sort === "price-low") return (a.price ?? 0) - (b.price ?? 0);
        if (sort === "price-high") return (b.price ?? 0) - (a.price ?? 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [packages, search, type, status, sort]);

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Create, edit, toggle and delete catalog packages"
        actions={
          <Button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-togt-orange text-white hover:bg-togt-orange/90"
          >
            <Plus className="h-4 w-4" />
            New Package
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or destination..." className="h-8 min-w-56 flex-1 rounded-lg border border-input px-2.5 text-sm" />
        <select value={type} onChange={(event) => setType(event.target.value)} className="h-8 rounded-lg border border-input px-2.5 text-sm">
          <option value="">All types</option><option value="UMRAH">Umrah</option><option value="DOMESTIC">Domestic</option><option value="TOURIST">Tourist</option><option value="FOREIGN">Foreign</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-8 rounded-lg border border-input px-2.5 text-sm">
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-8 rounded-lg border border-input px-2.5 text-sm">
          <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setType(""); setStatus(""); setSort("newest"); }}>Clear</Button>
        <span className="flex items-center text-xs text-gray-500">Showing {filteredPackages.length} of {packages?.length ?? 0}</span>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<Package>
          isLoading={isLoading}
          rows={filteredPackages}
          emptyTitle="No packages"
          emptyDescription="Create your first package to get started."
          columns={[
            {
              key: "image",
              label: "",
              className: "w-16",
              render: (p) =>
                p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-10 w-14 rounded-md object-cover" />
                ) : (
                  <span className="flex h-10 w-14 items-center justify-center rounded-md bg-slate-100 text-[10px] text-gray-400">
                    No img
                  </span>
                ),
            },
            { key: "title", label: "Title", render: (p) => <span className="font-semibold">{p.title}</span> },
            { key: "type", label: "Type", render: (p) => <span className="text-xs">{p.type.replace(/_/g, " ")}</span> },
            {
              key: "price",
              label: "Price",
              render: (p) => (p.price != null ? `${p.price.toLocaleString()} ${p.currency ?? "ETB"}` : "—"),
            },
            { key: "duration", label: "Duration", render: (p) => p.duration ?? "—" },
            { key: "groupId", label: "Attached group", render: (p) => <select value={p.groupId ?? ""} onClick={(event) => event.stopPropagation()} onChange={(event) => attachPackageGroup.mutate({ id: p.id, groupId: event.target.value || null })} disabled={attachPackageGroup.isPending} className="h-7 max-w-36 rounded-lg border border-input bg-background px-2 text-xs"><option value="">None</option>{groups?.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select> },
            { key: "maxMembers", label: "Max" },
            {
              key: "isActive",
              label: "Active",
              render: (p) => (
                <button
                  onClick={(e) => { e.stopPropagation(); togglePackage.mutate(p.id); }}
                  className={`relative h-5 w-9 rounded-full transition-colors ${p.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                  aria-label={p.isActive ? "Deactivate" : "Activate"}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${p.isActive ? "left-4.5" : "left-0.5"}`}
                  />
                </button>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (p) => (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); setEditing(p); setFormOpen(true); }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4 text-togt-blue" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); setDeleting(p); }}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <PackageFormDialog open={formOpen} onClose={() => setFormOpen(false)} pkg={editing} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deletePackage.mutate(deleting.id, { onSettled: () => setDeleting(null) });
          }
        }}
        title="Delete package"
        description={`Permanently delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isPending={deletePackage.isPending}
      />
    </div>
  );
}
