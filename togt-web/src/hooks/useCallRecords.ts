"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCallRecord,
  deleteCallRecord,
  getUsedTeamNumbers,
  listCallRecords,
  updateCallRecord,
  type CallRecordList,
} from "@/lib/api/callRecords";
import type { CallRecordFilters, CallRecordPayload } from "@/lib/api/types";

export function useCallRecords(filters: CallRecordFilters) {
  return useQuery<CallRecordList>({
    queryKey: ["call-records", filters],
    queryFn: () => listCallRecords(filters),
  });
}

export function useUsedTeamNumbers() {
  return useQuery<{ used: string[] }>({
    queryKey: ["call-records", "used-team-numbers"],
    queryFn: getUsedTeamNumbers,
    retry: false,
  });
}

export function useCallRecordMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["call-records"], refetchType: "active" });

  const create = useMutation({
    mutationFn: (payload: CallRecordPayload) => createCallRecord(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CallRecordPayload> }) =>
      updateCallRecord(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCallRecord(id),
    onSuccess: invalidate,
  });

  return { createCallRecord: create, updateCallRecord: update, deleteCallRecord: remove };
}
