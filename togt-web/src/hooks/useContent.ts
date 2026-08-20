"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFaq, createGallery, getFaq, getGallery, type FaqPayload, type GalleryPayload } from "@/lib/api/content";

export function useFaq() {
  return useQuery({
    queryKey: ["content", "faq"],
    queryFn: getFaq,
    staleTime: 5 * 60_000,
  });
}

export function useGallery() {
  return useQuery({
    queryKey: ["content", "gallery"],
    queryFn: getGallery,
    staleTime: 5 * 60_000,
  });
}

export function useContentMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["content", "faq"] });
    queryClient.invalidateQueries({ queryKey: ["content", "gallery"] });
  };
  return {
    createFaq: useMutation({ mutationFn: (dto: FaqPayload) => createFaq(dto), onSuccess: invalidate }),
    createGallery: useMutation({ mutationFn: (dto: GalleryPayload) => createGallery(dto), onSuccess: invalidate }),
  };
}
