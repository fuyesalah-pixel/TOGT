"use client";

import { useRef, useState } from "react";
import { ImagePlus, Images, MessageCircleQuestion } from "lucide-react";
import { useContentMutations } from "@/hooks/useContent";
import { uploadFile, MAX_UPLOAD_BYTES } from "@/lib/api/uploads";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function youtubeId(value: string) {
  return value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? null;
}

export function ContentCards() {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button onClick={() => setGalleryOpen(true)} className="rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-togt-orange">
          <Images className="mb-3 h-6 w-6 text-togt-orange" /><p className="font-bold text-togt-navy">Create Gallery Card</p><p className="mt-1 text-sm text-gray-500">Publish up to 8 images and an optional video to the homepage.</p>
        </button>
        <button onClick={() => setFaqOpen(true)} className="rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-togt-orange">
          <MessageCircleQuestion className="mb-3 h-6 w-6 text-togt-orange" /><p className="font-bold text-togt-navy">Create FAQ Card</p><p className="mt-1 text-sm text-gray-500">Add a categorized question to the homepage accordion.</p>
        </button>
      </div>
      <GalleryDialog open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <FaqDialog open={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  );
}

function GalleryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createGallery } = useContentMutations();
  const input = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", category: "UMRAH", location: "", date: "", description: "", videoUrl: "" });
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const addImages = async (files: File[]) => {
    if (files.length + images.length > 8) return setError("Maximum 8 images");
    if (files.some((file) => file.size > MAX_UPLOAD_BYTES)) return setError("Each image must be under 10MB");
    setUploading(true); setError("");
    try { const urls: string[] = []; for (const file of files) urls.push((await uploadFile(file, "misc")).url); setImages([...images, ...urls]); } catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); } finally { setUploading(false); }
  };
  const save = async () => {
    if (!form.title || !form.description) return setError("Title and description are required");
    if (form.videoUrl && !youtubeId(form.videoUrl)) return setError("Invalid YouTube URL");
    try { await createGallery.mutateAsync({ ...form, images }); setForm({ title: "", category: "UMRAH", location: "", date: "", description: "", videoUrl: "" }); setImages([]); onClose(); } catch (err) { setError(err instanceof Error ? err.message : "Failed to create gallery card"); }
  };
  return <Dialog open={open} onClose={onClose} title="Create Gallery Card" size="lg"><div className="space-y-4">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div><Label>Category</Label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"><option>UMRAH</option><option>DOMESTIC</option><option>TOURIST</option><option>EVENT</option><option>FOREIGN</option></select></div><div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><div><Label>Date</Label><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
    <div><Label>Description *</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
    <div><Label>Images (up to 8)</Label><input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void addImages(Array.from(e.target.files ?? []))} /><Button variant="outline" onClick={() => input.current?.click()} disabled={uploading}><ImagePlus className="h-4 w-4" />{uploading ? "Uploading..." : "Upload images"}</Button><div className="mt-2 flex flex-wrap gap-2">{images.map((url, i) => <div key={url} className="relative"><img src={url} alt="" className="h-14 w-20 rounded object-cover" /><button onClick={() => setImages(images.filter((_, index) => index !== i))} className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-white">×</button></div>)}</div></div>
    <div><Label>YouTube URL</Label><Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtu.be/..." /></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} disabled={createGallery.isPending || uploading} className="bg-togt-blue text-white">Create card</Button></div>
  </div></Dialog>;
}

function FaqDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createFaq } = useContentMutations();
  const [form, setForm] = useState({ question: "", answer: "", category: "General", order: "0" });
  const [error, setError] = useState("");
  const save = async () => { if (!form.question || !form.answer) return setError("Question and answer are required"); try { await createFaq.mutateAsync({ ...form, order: Number(form.order) }); setForm({ question: "", answer: "", category: "General", order: "0" }); onClose(); } catch (err) { setError(err instanceof Error ? err.message : "Failed to create FAQ"); } };
  return <Dialog open={open} onClose={onClose} title="Create FAQ Card" size="md"><div className="space-y-4"><div><Label>Question *</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div><div><Label>Answer *</Label><Textarea rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><Label>Category</Label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"><option>General</option><option>Umrah</option><option>Ticket</option><option>Visa</option><option>Tour</option></select></div><div><Label>Order</Label><Input type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} disabled={createFaq.isPending} className="bg-togt-blue text-white">Create FAQ</Button></div></div></Dialog>;
}
