import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { assessmentInput } from "@/lib/validation";
import { canManageClass } from "@/lib/academic-auth";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const classId = req.nextUrl.searchParams.get("classId");

  const assessments = await prisma.assessment.findMany({
    where: classId ? { classId } : undefined,
    include: {
      subject: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
      _count: { select: { grades: true, submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: assessments });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const parsed = parseBody(assessmentInput, await req.json());
  if (parsed.error) return parsed.error;

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(parsed.data.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak menambah aktivitas di kelas ini" },
      { status: 403 }
    );
  }

  try {
    const klass = await prisma.academicClass.findUnique({
      where: { id: parsed.data.classId },
      select: { subjectId: true, termId: true },
    });

    const assessment = await prisma.assessment.create({
      data: {
        ...parsed.data,
        subjectId: parsed.data.subjectId ?? klass?.subjectId ?? undefined,
        termId: parsed.data.termId ?? klass?.termId ?? undefined,
        createdById: authz.user.id,
      },
      include: {
        subject: { select: { id: true, name: true } },
        term: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ data: assessment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
