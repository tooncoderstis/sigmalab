import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";

type Params = { params: Promise<{ notificationId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { notificationId } = await params;

  try {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });
    if (!existing || existing.userId !== authz.user.id) {
      return NextResponse.json(
        { error: "Notifikasi tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
