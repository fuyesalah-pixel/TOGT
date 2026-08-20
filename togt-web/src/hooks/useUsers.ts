"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeUserRole,
  createUser,
  getUser,
  listUsers,
  terminateUser,
  setUserStatus,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserListParams,
} from "@/lib/api/users";
import type { Role, User } from "@/lib/api/types";

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ["users", params ?? {}],
    queryFn: () => listUsers(params),
  });
}

export function useUser(id?: string) {
  return useQuery<User>({
    queryKey: ["users", "detail", id],
    queryFn: () => getUser(id as string),
    enabled: !!id,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });
  const invalidateProfile = () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

  const create = useMutation({
    mutationFn: (dto: CreateUserPayload) => createUser(dto),
    onSuccess: () => { invalidate(); invalidateProfile(); },
  });
  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserPayload }) => updateUser(id, dto),
    onSuccess: () => { invalidate(); invalidateProfile(); },
  });
  const terminate = useMutation({
    mutationFn: (id: string) => terminateUser(id),
    onSuccess: invalidate,
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => changeUserRole(id, role),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'TERMINATED' }) =>
      setUserStatus(id, status),
    onSuccess: invalidate,
  });

  return {
    createUser: create,
    updateUser: update,
    terminateUser: terminate,
    changeUserRole: changeRole,
    setUserStatus: setStatus,
  };
}
