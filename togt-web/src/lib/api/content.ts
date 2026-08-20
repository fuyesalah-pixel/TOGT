import { apiGet, apiPost } from "./client";
import type { FaqItem, GalleryItem } from "./types";

export function getFaq(): Promise<FaqItem[]> {
  return apiGet<FaqItem[]>("/content/faq");
}

export function getGallery(): Promise<GalleryItem[]> {
  return apiGet<GalleryItem[]>("/content/gallery");
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
