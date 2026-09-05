"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
import type { Package, PackageType } from "@/lib/api/types";
import type { PackagePayload } from "@/lib/api/packages";
import { uploadFile, MAX_UPLOAD_BYTES } from "@/lib/api/uploads";
import { usePackageMutations } from "@/hooks/usePackages";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const TYPE_GROUPS: { label: string; types: PackageType[] }[] = [
  { label: "Umrah", types: ["UMRAH_ECONOMY", "UMRAH_VIP", "UMRAH_HONEYMOON", "UMRAH_CUSTOM"] },
  { label: "Domestic", types: ["DOMESTIC_PREBUILT", "DOMESTIC_CUSTOM"] },
  { label: "Tourist", types: ["TOURIST_PREBUILT", "TOURIST_CUSTOM"] },
  { label: "Foreign", types: ["FOREIGN_PREBUILT", "FOREIGN_CUSTOM"] },
];

interface FormState {
  title: string;
  description: string;
  type: PackageType;
  price: string;
  currency: string;
  duration: string;
  maxMembers: string;
  image: string;
  images: string[];
  videoUrl: string;
  includes: string[];
  excludes: string[];
  destination: string;
  isCustom: boolean;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  type: "UMRAH_ECONOMY",
  price: "",
  currency: "ETB",
  duration: "",
  maxMembers: "50",
  image: "",
  images: [],
  videoUrl: "",
  includes: [],
  excludes: [],
  destination: "",
  isCustom: false,
};

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const extractItems = (raw: string): string[] =>
    raw
      .split(",,")
      .map((part) => part.trim().replace(/^,|,$/g, "").trim())
      .filter((part) => part.length > 0);

  const commit = (raw: string) => {
    const newItems = extractItems(raw);
    if (newItems.length > 0) {
      onChange([...items, ...newItems]);
    }
  };

  const add = () => {
    if (draft.trim()) {
      commit(draft);
      setDraft("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const idx = value.lastIndexOf(",,");
    if (idx !== -1) {
      const before = value.slice(0, idx);
      const after = value.slice(idx + 2);
      const newItems = extractItems(before);
      if (newItems.length > 0) {
        onChange([...items, ...newItems]);
      }
      setDraft(after);
    } else {
      setDraft(value);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={handleChange}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
        <Button type="button" variant="outline" size="icon" onClick={add} aria-label={`Add ${label}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 text-xs text-gray-400">Separate multiple items with double comma (,,)</p>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-togt-navy"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-500"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function youtubeId(value: string) {
  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match?.[1] ?? null;
}

export function PackageFormDialog({
  open,
  onClose,
  pkg,
}: {
  open: boolean;
  onClose: () => void;
  /** When provided, the dialog edits this package; otherwise it creates a new one */
  pkg?: Package | null;
}) {
  const { createPackage, updatePackage } = usePackageMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        pkg
          ? {
              title: pkg.title,
              description: pkg.description,
              type: pkg.type,
              price: pkg.price != null ? String(pkg.price) : "",
              currency: pkg.currency ?? "ETB",
              duration: pkg.duration ?? "",
              maxMembers: String(pkg.maxMembers ?? 50),
              image: pkg.image ?? "",
              images: pkg.images?.length ? pkg.images : pkg.image ? [pkg.image] : [],
              videoUrl: pkg.videoUrl ?? "",
              includes: pkg.includes ?? [],
              excludes: pkg.excludes ?? [],
              destination: pkg.destination ?? "",
              isCustom: pkg.isCustom ?? false,
            }
          : emptyForm,
      );
    }
  }, [open, pkg]);

  const isPending = createPackage.isPending || updatePackage.isPending;

  const handleImagePick = async (files: File[]) => {
    setError(null);
    const available = 8 - form.images.length;
    if (files.length > available) return setError(`You can add only ${available} more image(s)`);
    if (files.some((file) => file.size > MAX_UPLOAD_BYTES)) return setError("Each image must be under 10MB");
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) uploaded.push((await uploadFile(file, "packages")).url);
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded], image: f.images[0] ?? uploaded[0] ?? "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim() || form.title.trim().length < 3) return setError("Title is required (min 3 characters)");
    if (!form.description.trim() || form.description.trim().length < 10)
      return setError("Description is required (min 10 characters)");

    const payload: PackagePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      image: form.image || undefined,
      images: form.images,
      videoUrl: form.videoUrl || undefined,
      price: form.price ? Number(form.price) : undefined,
      currency: form.currency || undefined,
      duration: form.duration || undefined,
      maxMembers: form.maxMembers ? Number(form.maxMembers) : undefined,
      includes: form.includes,
      excludes: form.excludes,
      isCustom: form.isCustom,
      destination: form.destination || undefined,
    };

    try {
      if (pkg) {
        await updatePackage.mutateAsync({ id: pkg.id, dto: payload });
      } else {
        await createPackage.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save package");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={pkg ? "Edit package" : "Create package"}
      description={pkg ? `Editing "${pkg.title}"` : "Add a new package to the catalog"}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pkg-title">Title *</Label>
            <Input
              id="pkg-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Economy Umrah - 10 Days"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pkg-desc">Description *</Label>
            <Textarea
              id="pkg-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe the package..."
            />
          </div>
          <div>
            <Label htmlFor="pkg-type">Type *</Label>
            <select
              id="pkg-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PackageType })}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              {TYPE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.types.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="pkg-destination">Destination</Label>
            <Input
              id="pkg-destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="e.g. Turkey"
            />
          </div>
          <div>
            <Label htmlFor="pkg-price">Price</Label>
            <Input
              id="pkg-price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="45000"
            />
          </div>
          <div>
            <Label htmlFor="pkg-currency">Currency</Label>
            <select
              id="pkg-currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="ETB">ETB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <Label htmlFor="pkg-duration">Duration</Label>
            <Input
              id="pkg-duration"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="10 days"
            />
          </div>
          <div>
            <Label htmlFor="pkg-max">Max members</Label>
            <Input
              id="pkg-max"
              type="number"
              min={1}
              max={500}
              value={form.maxMembers}
              onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
            />
          </div>
        </div>

        {/* Image upload */}
        <div>
            <Label>Images (up to 8, max 10MB each)</Label>
          <div
            className="rounded-xl border-2 border-dashed border-gray-200 p-4 transition-colors hover:border-togt-orange"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); void handleImagePick(Array.from(event.dataTransfer.files)); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) void handleImagePick(files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload images"}
            </Button>
            <span className="ml-2 text-xs text-gray-500">Drag images here. First image is the cover.</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.images.map((url, index) => (
                <div key={url} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                  event.preventDefault();
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isNaN(from) || from === index) return;
                  const images = [...form.images]; const [moved] = images.splice(from, 1); images.splice(index, 0, moved);
                  setForm({ ...form, images, image: images[0] ?? "" });
                }} className="relative cursor-grab">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Package image ${index + 1}`} className={`h-16 w-20 rounded-lg object-cover ${index === 0 ? "ring-2 ring-togt-orange" : ""}`} />
                  <button type="button" onClick={() => { const images = form.images.filter((_, i) => i !== index); setForm({ ...form, images, image: images[0] ?? "" }); }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
                  <span className="absolute bottom-0 left-0 rounded bg-black/60 px-1 text-[9px] text-white">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="pkg-video">YouTube video URL</Label>
          <Input id="pkg-video" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtu.be/..." />
          {form.videoUrl && (youtubeId(form.videoUrl) ? (
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://img.youtube.com/vi/${youtubeId(form.videoUrl)}/mqdefault.jpg`} alt="YouTube preview" className="h-14 w-24 rounded object-cover" />
              <span className="text-xs text-emerald-600">Valid YouTube video</span>
            </div>
          ) : <p className="mt-1 text-xs text-red-600">Use a youtube.com/watch, youtu.be, or youtube.com/shorts link.</p>)}
        </div>

        <ListEditor
          label="Includes"
          items={form.includes}
          onChange={(includes) => setForm({ ...form, includes })}
          placeholder="e.g. Round-trip airfare"
        />
        <ListEditor
          label="Excludes"
          items={form.excludes}
          onChange={(excludes) => setForm({ ...form, excludes })}
          placeholder="e.g. Travel insurance"
        />

        <label className="flex items-center gap-2 text-sm text-togt-navy">
          <input
            type="checkbox"
            checked={form.isCustom}
            onChange={(e) => setForm({ ...form, isCustom: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          Custom package (built to order)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || uploading}
            className="bg-togt-blue text-white hover:bg-togt-blue/90"
          >
            {isPending ? "Saving..." : pkg ? "Save changes" : "Create package"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
