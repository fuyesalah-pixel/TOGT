"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  getAllReviews,
  getVisibleReviews,
  setReviewVisibility,
  type CreateReviewPayload,
} from "@/lib/api/reviews";

export function useVisibleReviews() {
  return useQuery({
    queryKey: ["reviews", "visible"],
    queryFn: getVisibleReviews,
  });
}

export function useAllReviews() {
  return useQuery({
    queryKey: ["reviews", "all"],
    queryFn: getAllReviews,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReviewPayload) => createReview(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useSetReviewVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      setReviewVisibility(id, isVisible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}
