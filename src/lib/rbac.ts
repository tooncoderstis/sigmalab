import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "../../auth";
import {
  collectRoles,
  userHasRole,
  type SessionUser,
} from "@/lib/roles";

export { collectRoles, userHasRole };
export type { SessionUser };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    roles: session.user.roles ?? [],
  };
}

type AuthorizeResult =
  | { user: SessionUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

/**
 * Guard untuk route handler (API). Mengembalikan user bila berwenang,
 * atau `error` berupa NextResponse 401/403 yang bisa langsung dikembalikan.
 */
export async function requireApiRole(...roles: Role[]): Promise<AuthorizeResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Kamu harus login dulu" }, { status: 401 }),
    };
  }

  if (roles.length > 0 && !userHasRole(user, ...roles)) {
    return {
      error: NextResponse.json(
        { error: "Kamu tidak punya akses ke resource ini" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

type SafeParseLike<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };

/** Validasi payload dengan zod; mengembalikan data atau NextResponse 400. */
export function parseBody<T>(
  schema: { safeParse: (value: unknown) => SafeParseLike<T> },
  body: unknown
): { data: T; error?: undefined } | { data?: undefined; error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "Data tidak valid",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.map((part) => String(part)).join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
