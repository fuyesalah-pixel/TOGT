import { apiGet, apiPatch, apiPost } from "./client";
import type { Review } from "./types";

export function getVisibleReviews(): Promise<Review[]> {
  return apiGet<Review[]>("/reviews/visible");
}

export function getAllReviews(): Promise<Review[]> {
  return apiGet<Review[]>("/reviews/all");
}

export interface CreateReviewPayload {
  serviceRequestId?: string;
  rating: number;
  reviewText?: string;
  imageUrls?: string[];
}

export function createReview(dto: CreateReviewPayload): Promise<Review> {
  return apiPost<Review>("/reviews", dto);
}

export function setReviewVisibility(id: string, isVisible: boolean): Promise<Review> {
  return apiPatch<Review>(`/reviews/${id}/visibility`, { isVisible });
}
