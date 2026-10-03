"use client";

import { useState } from "react";
import { Images, Pencil, Plus, Trash2 } from "lucide-react";
import { useAllGallery, useContentMutations } from "@/hooks/useContent";
import { useToast } from "@/components/providers";
import { uploadFile } from "@/lib/api/uploads";
import type { GalleryAdminItem } from "@/lib/api/content";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { ConfirmDialog } from "./confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["UMRAH", "TICKET", "DOMESTIC", "TOURIST", "VISA", "FOREIGN_TRAVEL"];

type EditForm = {
  title: string;
  category: string;
  location: string;
  date: string;
  description: string;
  videoUrl: string;
  images: string[];
};

/** Worker/Admin "Gallery" tab — edit and delete gallery cards that were
 *  posted from the Create tab. The API PATCH/DELETE endpoints accept both
 *  WORKER and ADMIN roles. */
export function GalleryTab() {
  const { data: items, isLoading } = useAllGallery();
  const { updateGallery, deleteGallery } = useContentMutations();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<GalleryAdminItem | null>(null);
  const [deleting, setDeleting] = useState<GalleryAdminItem | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const openEdit = (item: GalleryAdminItem) => {
    setEditing(item);
    setError("");
    setForm({
      title: item.title ?? "",
      category: item.category ?? "",
      location: item.location ?? "",
      date: item.date ?? "",
      description: item.description ?? "",
      videoUrl: item.videoUrl ?? "",
      images: item.images ?? [],
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !form) return;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await uploadFile(file, "gallery");
        urls.push(url);
      }
      setForm((current) => (current ? { ...current, images: [...current.images, ...urls].slice(0, 8) } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing || !form) return;
    setError("");
    if (form.title.trim().length < 2) return setError("Title is required.");
    if (form.description.trim().length < 10) return setError("Description must be at least 10 characters.");
    if (!form.images.length) return setError("Keep at least one image — or delete the card instead.");
    try {
      await updateGallery.mutateAsync({
        id: editing.id,
        dto: {
          title: form.title.trim(),
          category: form.category.trim() || "UMRAH",
          location: form.location.trim() || undefined,
          date: form.date.trim() || undefined,
          description: form.description.trim(),
          videoUrl: form.videoUrl.trim() || undefined,
          images: form.images,
        },
      });
      showToast({ title: "Gallery card updated", message: "The public gallery now shows your changes." });
      setEditing(null);
      setForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the gallery card.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteGallery.mutateAsync(deleting.id);
      showToast({ title: "Gallery card deleted", message: "It is no longer shown on the public gallery." });
    } catch (err) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Edit or delete the gallery cards shown on the public gallery page and the home-page gallery section."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
        </div>
      ) : !items?.length ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <EmptyState title="No gallery cards yet" description="Gallery cards created from the Create tab will appear here for editing." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative h-40 w-full bg-slate-100">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center text-gray-300"><Images className="h-8 w-8" /></div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-togt-navy">{item.category}</span>
              </div>
              <div className="p-4">
                <p className="font-bold text-togt-navy">{item.title}</p>
                {(item.location || item.date) && (
                  <p className="mt-0.5 text-xs text-gray-500">{[item.location, item.date].filter(Boolean).join(" · ")}</p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(item)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!editing}
        onClose={() => { setEditing(null); setForm(null); }}
        title={`Edit: ${editing?.title ?? ""}`}
        description="Changes go live on the public gallery immediately after saving."
        size="lg"
      >
        {form && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  {form.category && !CATEGORIES.includes(form.category) && <option value={form.category}>{form.category}</option>}
                </select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" placeholder="e.g. March 2026" />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Video link (YouTube)</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="mt-1" placeholder="https://youtu.be/... (optional)" />
            </div>
            <div>
              <Label>Images ({form.images.length}/8)</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {form.images.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="Gallery image" className="h-16 w-16 rounded-lg border border-gray-100 object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, images: form.images.filter((image) => image !== url) })}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label
                  className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-togt-orange hover:text-togt-orange ${form.images.length >= 8 ? "pointer-events-none opacity-40" : ""}`}
                  title="Upload images"
                >
                  <Plus className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void handleUpload(e.target.files)}
                  />
                </label>
              </div>
              {uploading && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditing(null); setForm(null); }} disabled={updateGallery.isPending}>Cancel</Button>
              <Button onClick={() => void handleSave()} disabled={updateGallery.isPending} className="bg-togt-blue text-white hover:bg-togt-blue/90">
                {updateGallery.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title={`Delete “${deleting?.title ?? "card"}”?`}
        description="The gallery card will be removed from the public website. This cannot be undone."
        confirmLabel="Delete"
        destructive
        isPending={deleteGallery.isPending}
      />
    </div>
  );
}
