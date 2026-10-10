import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { termInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const academicYearId = req.nextUrl.searchParams.get("academicYearId") ?? undefined;

  const terms = await prisma.term.findMany({
    where: academicYearId ? { academicYearId } : undefined,
    include: { academicYear: true, _count: { select: { classes: true } } },
    orderBy: [{ academicYearId: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: terms });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(termInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const term = await prisma.$transaction(async (tx) => {
      if (parsed.data.isActive) {
        await tx.term.updateMany({ data: { isActive: false } });
      }
      return tx.term.create({ data: parsed.data });
    });

    return NextResponse.json({ data: term }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
