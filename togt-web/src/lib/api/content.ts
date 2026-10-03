import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { FaqItem, GalleryItem } from "./types";

export function getFaq(locale = "en"): Promise<FaqItem[]> {
  return apiGet<FaqItem[]>(`/content/faq?locale=${locale}`);
}

export function getGallery(locale = "en"): Promise<GalleryItem[]> {
  return apiGet<GalleryItem[]>(`/content/gallery?locale=${locale}`);
}

export interface GalleryPayload {
  title: string;
  category: string;
  location?: string;
  date?: string;
  description: string;
  images: string[];
  videoUrl?: string;
}

export interface FaqPayload {
  question: string;
  answer: string;
  category: string;
  order?: number;
  isActive?: boolean;
}

export function createGallery(dto: GalleryPayload): Promise<GalleryItem> {
  return apiPost<GalleryItem>("/content/gallery", dto);
}

/** Raw gallery row as returned by the staff-only /content/gallery/all endpoint. */
export interface GalleryAdminItem {
  id: string;
  title: string;
  category: string;
  location?: string | null;
  date?: string | null;
  description: string;
  images: string[];
  videoUrl?: string | null;
  createdAt: string;
}

export function getAllGallery(): Promise<GalleryAdminItem[]> {
  return apiGet<GalleryAdminItem[]>("/content/gallery/all");
}

export function updateGallery(id: string, dto: Partial<GalleryPayload>): Promise<GalleryAdminItem> {
  return apiPatch<GalleryAdminItem>(`/content/gallery/${encodeURIComponent(id)}`, dto);
}

export function deleteGallery(id: string): Promise<GalleryAdminItem> {
  return apiDelete<GalleryAdminItem>(`/content/gallery/${encodeURIComponent(id)}`);
}

export function createFaq(dto: FaqPayload): Promise<FaqItem> {
  return apiPost<FaqItem>("/content/faq", dto);
}
