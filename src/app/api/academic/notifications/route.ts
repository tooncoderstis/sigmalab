import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";

export async function GET() {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  try {
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: authz.user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({
        where: { userId: authz.user.id, readAt: null },
      }),
    ]);

    return NextResponse.json({ data: { notifications, unread } });
  } catch (error) {
    return handleApiError(error);
  }
}
