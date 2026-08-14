import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className
      )}
    />
  );
}

/* ── Package card skeleton ─────────────────────────────────────────── */
export function PackageCardSkeleton() {
  return (
    <div className="w-full rounded-[32px] overflow-hidden h-[360px] lg:h-[420px] bg-gray-200 relative">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute bottom-0 p-4 lg:p-6 w-full space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full ml-auto" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="flex-1 h-8 rounded-xl" />
          <Skeleton className="flex-1 h-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Testimonial card skeleton ─────────────────────────────────────── */
export function TestimonialSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 space-y-3">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-4 h-4 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <Skeleton className="h-3 w-3/5 rounded" />
      <div className="h-px bg-gray-100 my-1" />
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ── Gallery card skeleton ─────────────────────────────────────────── */
export function GalleryCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      <Skeleton className="h-56 md:h-64 w-full rounded-none" />
    </div>
  );
}

/* ── Hero skeleton ─────────────────────────────────────────────────── */
export function HeroSkeleton() {
  return (
    <div className="hero-section relative w-full bg-[#12394F] flex items-center justify-center">
      <div className="text-center space-y-5 px-6">
        <Skeleton className="h-7 w-44 rounded-full mx-auto" />
        <Skeleton className="h-14 md:h-20 w-80 md:w-[480px] rounded-xl mx-auto" />
        <Skeleton className="h-5 w-64 md:w-80 rounded-lg mx-auto" />
        <div className="flex items-center justify-center gap-3 pt-2">
          <Skeleton className="h-12 w-36 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Section title skeleton ────────────────────────────────────────── */
export function SectionTitleSkeleton() {
  return (
    <div className="text-center mb-10 md:mb-16 space-y-4">
      <Skeleton className="h-3 w-32 rounded-full mx-auto" />
      <Skeleton className="h-10 md:h-14 w-64 md:w-96 rounded-xl mx-auto" />
      <Skeleton className="h-3 w-48 md:w-72 rounded-full mx-auto" />
    </div>
  );
}

/* ── FAQ skeleton ──────────────────────────────────────────────────── */
export function FAQSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 px-5 md:px-7 py-4 md:py-5 flex items-center gap-4"
        >
          <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ── IATA counter skeleton ─────────────────────────────────────────── */
export function CounterSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 sm:flex-col sm:items-center rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <Skeleton className="h-10 w-20 sm:h-14 sm:w-24 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ── Smart form skeleton ───────────────────────────────────────────── */
export function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div
        className="rounded-2xl md:rounded-3xl p-[2px]"
        style={{ background: "linear-gradient(135deg, #1F67B1 0%, #FF9300 50%, #1F67B1 100%)" }}
      >
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-6">
          <SectionTitleSkeleton />
          {/* Tab strip */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-full flex-shrink-0" />
            ))}
          </div>
          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-14 w-48 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}
