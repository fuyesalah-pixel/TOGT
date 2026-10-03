"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFaq, createGallery, deleteGallery, getAllGallery, getFaq, getGallery, updateGallery, type FaqPayload, type GalleryPayload } from "@/lib/api/content";
import { useLocale } from "next-intl";

export function useFaq() {
  const locale = useLocale();
  return useQuery({
    queryKey: ["content", "faq", locale],
    queryFn: () => getFaq(locale),
    staleTime: 5 * 60_000,
  });
}

export function useGallery() {
  const locale = useLocale();
  return useQuery({
    queryKey: ["content", "gallery", locale],
    queryFn: () => getGallery(locale),
    staleTime: 5 * 60_000,
  });
}

/** Staff-only full gallery list for the dashboard Gallery tab. */
export function useAllGallery() {
  return useQuery({
    queryKey: ["content", "gallery", "all"],
    queryFn: () => getAllGallery(),
    staleTime: 30_000,
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
    updateGallery: useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Partial<GalleryPayload> }) => updateGallery(id, dto), onSuccess: invalidate }),
    deleteGallery: useMutation({ mutationFn: (id: string) => deleteGallery(id), onSuccess: invalidate }),
  };
}
