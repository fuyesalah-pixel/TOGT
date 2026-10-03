"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceRequest } from "@/lib/api/types";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useCreateReview, useVisibleReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { uploadFile, MAX_UPLOAD_BYTES } from "@/lib/api/uploads";
import { PageHeader } from "../shared/page-header";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/** Matches the API uploads allow-list (jpg/png/gif/webp/heic/heif/pdf). */
const ACCEPTED_UPLOADS = "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.pdf";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hover || value) >= star ? "fill-amber-400 text-amber-400" : "text-gray-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsTab({ preselected }: { preselected?: ServiceRequest | null }) {
  const { user } = useAuth();
  const { data: completed } = useServiceRequests({ status: "COMPLETED", limit: 50 });
  const createReview = useCreateReview();
  const { data: visibleReviews } = useVisibleReviews();

  const [requestId, setRequestId] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadTotal, setUploadTotal] = useState(0); // files remaining to upload
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselected) setRequestId(preselected.id);
  }, [preselected]);

  const completedRequests = completed?.data ?? [];
  const myReviews = (visibleReviews ?? []).filter((r) => r.userId === user?.id);
  const uploading = uploadTotal > 0;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = 3 - images.length;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    if (picked.length === 0) return setError("Maximum 3 photos per review");
    for (const file of picked) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`"${file.name}" is over the 10MB limit`);
        continue;
      }
      setUploadTotal((count) => count + 1);
      try {
        const { url } = await uploadFile(file, "reviews");
        setImages((prev) => (prev.length < 3 ? [...prev, url] : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed — try a JPG, PNG, WEBP or PDF");
      } finally {
        setUploadTotal((count) => Math.max(0, count - 1));
      }
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);
    if (!requestId) return setError("Please choose the service you are reviewing");
    if (rating < 1) return setError("Please select a star rating");
    if (uploading) return setError("Please wait for the photos to finish uploading");
    try {
      await createReview.mutateAsync({
        serviceRequestId: requestId,
        rating,
        reviewText: text.trim() || undefined,
        imageUrls: images.length ? images : undefined,
      });
      setSuccess(true);
      setRequestId("");
      setRating(0);
      setText("");
      setImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Reviews" description="Rate your completed services" />

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
          Rate a completed service
        </h2>

        {completedRequests.length === 0 ? (
          <p className="text-sm text-gray-400">
            You have no completed services to review yet.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="review-service">Service</Label>
              <select
                id="review-service"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Choose a completed service...</option>
                {completedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.serviceType.replace(/_/g, " ")} · {new Date(r.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Rating</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div>
              <Label htmlFor="review-text">Your review</Label>
              <Textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Tell others about your experience..."
              />
            </div>

            <div>
              <Label>Photos or a PDF (up to 3, max 10MB each)</Label>
              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG, GIF, WEBP, HEIC or PDF — tap a photo to preview it.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {images.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setPreview(url)}
                    className="group relative"
                    aria-label="Preview attachment"
                  >
                    {url.toLowerCase().endsWith(".pdf") ? (
                      <span className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg bg-red-50 text-red-600">
                        <FileText className="h-5 w-5" />
                        <span className="text-[9px] font-bold">PDF</span>
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Review attachment" className="h-16 w-16 rounded-lg object-cover transition group-hover:opacity-80" />
                    )}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setImages((prev) => prev.filter((u) => u !== url));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          setImages((prev) => prev.filter((u) => u !== url));
                        }
                      }}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </button>
                ))}
                {uploading && (
                  <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-lg border-2 border-dashed border-togt-orange/50 text-[10px] font-semibold text-togt-orange">
                    {uploadTotal} left
                  </span>
                )}
                {images.length < 3 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_UPLOADS}
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void handleFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-togt-orange hover:text-togt-orange disabled:opacity-50"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px]">{uploading ? "..." : "Add"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Thank you! Your review will appear publicly within 24 hours.
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={createReview.isPending || uploading}
              className="bg-togt-orange text-white hover:bg-togt-orange/90"
            >
              {createReview.isPending ? "Submitting..." : "Submit review"}
            </Button>
          </div>
        )}
      </div>

      {myReviews.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
            My published reviews
          </h2>
          <div className="space-y-3">
            {myReviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-50 p-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")}
                    />
                  ))}
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.reviewText && <p className="mt-1 text-sm text-gray-600">{r.reviewText}</p>}
                {r.imageUrls.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {r.imageUrls.slice(0, 3).map((url) => (
                      <button key={url} type="button" onClick={() => setPreview(url)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-12 w-12 rounded-md object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!preview} onClose={() => setPreview(null)} size="lg">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Review attachment" className="max-h-[75vh] w-full rounded-xl object-contain" />
        )}
      </Dialog>
    </div>
  );
}
