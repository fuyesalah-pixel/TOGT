"use client";

import { useState } from "react";
import { FileText, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/api/types";
import { useAllReviews, useSetReviewVisibility } from "@/hooks/useReviews";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";
import { Dialog } from "@/components/ui/dialog";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("h-3.5 w-3.5", s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200")}
        />
      ))}
    </span>
  );
}

export function ReviewsAdminTab() {
  const { data: reviews, isLoading } = useAllReviews();
  const setVisibility = useSetReviewVisibility();
  const [preview, setPreview] = useState<string | null>(null);

  const rows = reviews ?? [];
  const pendingCount = rows.filter((r) => !r.isVisible).length;

  return (
    <div>
      <PageHeader
        title="Reviews moderation"
        description="Reviews auto-publish 24h after submission — toggle visibility anytime"
      />

      {rows.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
            {rows.length} total
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            {rows.length - pendingCount} visible
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
            {pendingCount} awaiting auto-publish
          </span>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<Review>
          isLoading={isLoading}
          rows={rows}
          emptyTitle="No reviews yet"
          columns={[
            { key: "user", label: "Customer", render: (r) => <span className="font-semibold">{r.user?.fullName ?? "—"}</span> },
            { key: "rating", label: "Rating", render: (r) => <Stars rating={r.rating} /> },
            {
              key: "reviewText",
              label: "Review",
              render: (r) => (
                <span className="line-clamp-2 max-w-md text-xs text-gray-600">{r.reviewText ?? "—"}</span>
              ),
            },
            {
              key: "imageUrls",
              label: "Photos",
              render: (r) =>
                r.imageUrls.length === 0 ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : (
                  <span className="flex gap-1">
                    {r.imageUrls.slice(0, 3).map((url) =>
                      url.toLowerCase().endsWith(".pdf") ? (
                        <span
                          key={url}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-red-50 text-red-600"
                          title="PDF attachment"
                          onClick={() => setPreview(url)}
                        >
                          <FileText className="h-4 w-4" />
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-8 w-8 cursor-zoom-in rounded object-cover transition hover:ring-2 hover:ring-togt-orange"
                          onClick={() => setPreview(url)}
                        />
                      ),
                    )}
                  </span>
                ),
            },
            { key: "createdAt", label: "Submitted", render: (r) => new Date(r.createdAt).toLocaleDateString() },
            {
              key: "isVisible",
              label: "Visible",
              render: (r) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisibility.mutate({ id: r.id, isVisible: !r.isVisible });
                  }}
                  className={`relative h-5 w-9 rounded-full transition-colors ${r.isVisible ? "bg-emerald-500" : "bg-gray-300"}`}
                  aria-label="Toggle visibility"
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${r.isVisible ? "left-4.5" : "left-0.5"}`} />
                </button>
              ),
            },
          ]}
        />
      </div>

      <Dialog open={!!preview} onClose={() => setPreview(null)} size="lg">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Review attachment" className="max-h-[75vh] w-full rounded-xl object-contain" />
        )}
      </Dialog>
    </div>
  );
}
