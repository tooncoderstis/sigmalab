import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { activityUpdateInput } from "@/lib/validation";
import { getAudienceContext } from "@/lib/audience-context";
import { contentMatches } from "@/lib/audience";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ activityId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { activityId } = await params;

  const activity = await prisma.schoolActivity.findUnique({
    where: { id: activityId },
    include: {
      author: { select: { id: true, name: true } },
      targets: true,
    },
  });

  if (!activity) {
    return NextResponse.json(
      { error: "Kegiatan tidak ditemukan" },
      { status: 404 }
    );
  }

  const ctx = await getAudienceContext(authz.user);
  const visible = contentMatches(
    { audienceAll: activity.audienceAll, targets: activity.targets },
    ctx
  );
  if (!visible) {
    return NextResponse.json(
      { error: "Kamu tidak berhak melihat kegiatan ini" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: activity });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { activityId } = await params;
  const parsed = parseBody(activityUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  const { targets, ...rest } = parsed.data;
  const data: Prisma.SchoolActivityUpdateInput = { ...rest };
  if (targets !== undefined) {
    data.targets = { deleteMany: {}, create: targets };
  }

  try {
    const updated = await prisma.schoolActivity.update({
      where: { id: activityId },
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

  const { activityId } = await params;

  try {
    await prisma.schoolActivity.delete({ where: { id: activityId } });
    return NextResponse.json({ message: "Kegiatan dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
