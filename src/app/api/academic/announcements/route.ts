import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { announcementInput } from "@/lib/validation";
import { getAudienceContext } from "@/lib/audience-context";
import { announcementWhere } from "@/lib/audience";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const ctx = await getAudienceContext(authz.user);
  const manage = req.nextUrl.searchParams.get("manage") === "1" && ctx.isManager;

  const where: Prisma.AnnouncementWhereInput = manage
    ? {}
    : {
        AND: [
          { status: "PUBLISHED" },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          announcementWhere(ctx),
        ],
      };

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      targets: true,
      reads: { where: { userId: authz.user.id }, select: { id: true } },
      _count: { select: { reads: true } },
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const data = announcements.map(({ reads, ...a }) => ({
    ...a,
    read: reads.length > 0,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(announcementInput, await req.json());
  if (parsed.error) return parsed.error;

  const { targets, status, ...rest } = parsed.data;

  try {
    const announcement = await prisma.announcement.create({
      data: {
        ...rest,
        status: status ?? "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId: authz.user.id,
        targets: { create: targets ?? [] },
      },
      include: { targets: true },
    });
    return NextResponse.json({ data: announcement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
