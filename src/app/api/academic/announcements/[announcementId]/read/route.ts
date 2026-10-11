import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { getAudienceContext } from "@/lib/audience-context";
import { contentMatches } from "@/lib/audience";

type Params = { params: Promise<{ announcementId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { announcementId } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { status: true, audienceAll: true, targets: true },
  });
  if (!announcement) {
    return NextResponse.json(
      { error: "Pengumuman tidak ditemukan" },
      { status: 404 }
    );
  }

  const ctx = await getAudienceContext(authz.user);
  const visible =
    announcement.status === "PUBLISHED" &&
    contentMatches(
      { audienceAll: announcement.audienceAll, targets: announcement.targets },
      ctx
    );
  if (!visible) {
    return NextResponse.json(
      { error: "Kamu tidak berhak menandai pengumuman ini" },
      { status: 403 }
    );
  }

  try {
    const read = await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: { announcementId, userId: authz.user.id },
      },
      create: { announcementId, userId: authz.user.id },
      update: { readAt: new Date() },
    });
    return NextResponse.json({ data: read });
  } catch (error) {
    return handleApiError(error);
  }
}
