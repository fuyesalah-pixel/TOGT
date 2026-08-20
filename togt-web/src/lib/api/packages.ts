import { api, apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { Package, PackageType } from "./types";

export interface PackageFilters {
  type?: string;
  destination?: string;
}

function qs(params?: PackageFilters): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.destination) search.set("destination", params.destination);
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** Public: active packages only */
export function listPackages(params?: PackageFilters): Promise<Package[]> {
  return apiGet<Package[]>(`/packages${qs(params)}`);
}

/** Worker/Admin: all packages including inactive */
export function listAllPackages(params?: PackageFilters): Promise<Package[]> {
  return apiGet<Package[]>(`/packages/all${qs(params)}`);
}

export interface PackagePayload {
  title: string;
  description: string;
  type: PackageType;
  image?: string;
  images?: string[];
  videoUrl?: string;
  price?: number;
  currency?: string;
  duration?: string;
  maxMembers?: number;
  includes?: string[];
  excludes?: string[];
  isCustom?: boolean;
  destination?: string;
}

export function createPackage(dto: PackagePayload): Promise<Package> {
  return apiPost<Package>("/packages", dto);
}

export function updatePackage(id: string, dto: Partial<PackagePayload>): Promise<Package> {
  return apiPatch<Package>(`/packages/${id}`, dto);
}

export function deletePackage(id: string): Promise<Package> {
  return apiDelete<Package>(`/packages/${id}`);
}

export function togglePackage(id: string): Promise<Package> {
  return api<Package>(`/packages/${id}/toggle`, { method: "PATCH" });
}

export function attachPackageGroup(id: string, groupId: string | null): Promise<Package> {
  return apiPatch<Package>(`/packages/${id}/group`, { groupId });
}

/* ── Display adapter ────────────────────────────────────────────────────
 * Maps an API Package to the rich shape the public site components render.
 * `MockPackage` is kept as a back-compat alias for existing components.
 */
export interface PackageItineraryDay {
  day: number;
  title: string;
  description: string;
}

export type PackageDetails = Record<string, string | undefined>;

export interface DisplayPackage {
  id: string;
  /** lowercase type, e.g. "umrah_economy" — site components filter on prefixes */
  type: string;
  title: string;
  price: number;
  currency: string;
  durationDays: number;
  includes: string[];
  image: string;
  videoUrl?: string;
  excluded: string[];
  fullDescription: string;
  images: string[];
  details: PackageDetails;
  highlights: string[];
  itinerary?: PackageItineraryDay[];
  destination?: string;
  isCustom: boolean;
  createdAt: string;
}

/** Back-compat alias — previously lived in the deleted lib/data/packages.ts */
export type MockPackage = DisplayPackage;

const FALLBACK_IMAGE = "/images/packages/world-custom.jpg";

export function toDisplayPackage(p: Package): DisplayPackage {
  const durationMatch = p.duration?.match(/(\d+)/);
  return {
    id: p.id,
    type: p.type.toLowerCase(),
    title: p.title,
    price: p.price ?? 0,
    currency: p.currency ?? "ETB",
    durationDays: durationMatch ? parseInt(durationMatch[1], 10) : 1,
    includes: p.includes ?? [],
    image: p.image ?? FALLBACK_IMAGE,
    images: p.images?.length ? p.images : [p.image ?? FALLBACK_IMAGE],
    excluded: p.excludes ?? [],
    fullDescription: p.description,
    details: {
      ...(p.duration ? { duration: p.duration } : {}),
      groupSize: `${p.maxMembers} travelers maximum`,
      ...(p.destination ? { destination: p.destination } : {}),
    },
    highlights: [],
    itinerary: undefined,
    destination: p.destination ?? undefined,
    videoUrl: p.videoUrl ?? undefined,
    isCustom: p.isCustom,
    createdAt: p.createdAt,
  };
}
