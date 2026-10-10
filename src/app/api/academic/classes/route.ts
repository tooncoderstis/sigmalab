import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { classInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const termId = req.nextUrl.searchParams.get("termId") ?? undefined;
  const programId = req.nextUrl.searchParams.get("programId") ?? undefined;

  const classes = await prisma.academicClass.findMany({
    where: {
      ...(termId ? { termId } : {}),
      ...(programId ? { programId } : {}),
    },
    include: {
      program: true,
      term: { include: { academicYear: true } },
      subject: true,
      homeroomTeacher: { select: { id: true, name: true } },
      _count: { select: { enrollments: true, assignments: true, sessions: true } },
    },
    orderBy: [{ termId: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: classes });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(classInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const created = await prisma.academicClass.create({
      data: parsed.data,
      include: { program: true, term: true, subject: true },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
