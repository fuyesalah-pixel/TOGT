"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/api/types";
import { useAllReviews, useSetReviewVisibility } from "@/hooks/useReviews";
import { DataTable } from "../shared/data-table";
import { PageHeader } from "../shared/page-header";

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

  return (
    <div>
      <PageHeader
        title="Reviews moderation"
        description="Reviews auto-publish 24h after submission — toggle visibility anytime"
      />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <DataTable<Review>
          isLoading={isLoading}
          rows={reviews ?? []}
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
              render: (r) => (
                <span className="flex gap-1">
                  {r.imageUrls.slice(0, 3).map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" className="h-8 w-8 rounded object-cover" />
                  ))}
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
    </div>
  );
}
