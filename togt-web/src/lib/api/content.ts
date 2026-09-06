import { apiGet, apiPost } from "./client";
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

export function createFaq(dto: FaqPayload): Promise<FaqItem> {
  return apiPost<FaqItem>("/content/faq", dto);
}
