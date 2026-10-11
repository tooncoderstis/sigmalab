import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { announcementUpdateInput } from "@/lib/validation";
import { getAudienceContext } from "@/lib/audience-context";
import { contentMatches } from "@/lib/audience";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ announcementId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { announcementId } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: {
      author: { select: { id: true, name: true } },
      targets: true,
      reads: { where: { userId: authz.user.id }, select: { id: true } },
    },
  });

  if (!announcement) {
    return NextResponse.json(
      { error: "Pengumuman tidak ditemukan" },
      { status: 404 }
    );
  }

  const ctx = await getAudienceContext(authz.user);
  const visible = contentMatches(
    { audienceAll: announcement.audienceAll, targets: announcement.targets },
    ctx
  );
  if (!visible || (announcement.status !== "PUBLISHED" && !ctx.isManager)) {
    return NextResponse.json(
      { error: "Kamu tidak berhak melihat pengumuman ini" },
      { status: 403 }
    );
  }

  const { reads, ...rest } = announcement;
  return NextResponse.json({ data: { ...rest, read: reads.length > 0 } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { announcementId } = await params;
  const parsed = parseBody(announcementUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  const { targets, status, ...rest } = parsed.data;
  const data: Prisma.AnnouncementUpdateInput = { ...rest };
  if (status !== undefined) {
    data.status = status;
    data.publishedAt = status === "PUBLISHED" ? new Date() : null;
  }
  if (targets !== undefined) {
    data.targets = { deleteMany: {}, create: targets };
  }

  try {
    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data,
      include: { targets: true },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { announcementId } = await params;

  try {
    await prisma.announcement.delete({ where: { id: announcementId } });
    return NextResponse.json({ message: "Pengumuman dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
