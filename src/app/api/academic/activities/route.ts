import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { activityInput } from "@/lib/validation";
import { getAudienceContext } from "@/lib/audience-context";
import { activityWhere } from "@/lib/audience";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const ctx = await getAudienceContext(authz.user);
  const upcoming = req.nextUrl.searchParams.get("upcoming") === "1";

  const filters: Prisma.SchoolActivityWhereInput[] = [activityWhere(ctx)];
  if (upcoming) filters.push({ startAt: { gte: new Date() } });

  const activities = await prisma.schoolActivity.findMany({
    where: { AND: filters },
    include: {
      author: { select: { id: true, name: true } },
      targets: true,
    },
    orderBy: { startAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: activities });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(activityInput, await req.json());
  if (parsed.error) return parsed.error;

  const { targets, ...rest } = parsed.data;

  try {
    const activity = await prisma.schoolActivity.create({
      data: {
        ...rest,
        authorId: authz.user.id,
        targets: { create: targets ?? [] },
      },
      include: { targets: true },
    });
    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
