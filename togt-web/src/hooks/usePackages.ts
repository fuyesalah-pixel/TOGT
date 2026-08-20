"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackage,
  attachPackageGroup,
  deletePackage,
  listAllPackages,
  listPackages,
  toDisplayPackage,
  togglePackage,
  updatePackage,
  type PackageFilters,
  type PackagePayload,
} from "@/lib/api/packages";
import type { Package } from "@/lib/api/types";

/** Public active packages (raw API shape) */
export function usePackages(params?: PackageFilters) {
  return useQuery<Package[]>({
    queryKey: ["packages", "active", params ?? {}],
    queryFn: () => listPackages(params),
  });
}

/** All packages incl. inactive (worker/admin) */
export function useAllPackages(params?: PackageFilters) {
  return useQuery<Package[]>({
    queryKey: ["packages", "all", params ?? {}],
    queryFn: () => listAllPackages(params),
  });
}

/** Public packages mapped to the display shape the site components render */
export function useDisplayPackages(params?: PackageFilters) {
  const query = usePackages(params);
  return {
    ...query,
    data: query.data?.map(toDisplayPackage),
  };
}

export function usePackageMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["packages"] });

  const create = useMutation({
    mutationFn: (dto: PackagePayload) => createPackage(dto),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<PackagePayload> }) =>
      updatePackage(id, dto),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: invalidate,
  });
  const toggle = useMutation({
    mutationFn: (id: string) => togglePackage(id),
    onSuccess: invalidate,
  });
  const attachGroup = useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string | null }) => attachPackageGroup(id, groupId),
    onSuccess: invalidate,
  });

  return {
    createPackage: create,
    updatePackage: update,
    deletePackage: remove,
    togglePackage: toggle,
    attachPackageGroup: attachGroup,
  };
}
