import { User } from '@prisma/client';

/** Strips sensitive fields (googleId) from a user record. */
export function sanitizeUser<T extends Partial<User>>(user: T): Omit<T, 'googleId'> {
  if (!user) return user;
  const { googleId, ...rest } = user as any;
  return rest;
}

/** Prisma select for exposing user data without googleId. */
export const safeUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  passportNumber: true,
  passportExpiry: true,
  role: true,
  status: true,
  languagePref: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Compact select for embedding user info in other resources. */
export const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
} as const;
