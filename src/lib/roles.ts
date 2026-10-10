import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  roles: string[];
};

export function collectRoles(
  user: Pick<SessionUser, "role" | "roles">
): Set<string> {
  return new Set([user.role, ...(user.roles ?? [])]);
}

export function userHasRole(
  user: Pick<SessionUser, "role" | "roles"> | null | undefined,
  ...roles: Role[]
): boolean {
  if (!user) return false;
  if (roles.length === 0) return true;
  const owned = collectRoles(user);
  return roles.some((role) => owned.has(role));
}
