import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { lessonPlanInput } from "@/lib/validation";
import { canManageClass } from "@/lib/academic-auth";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) {
    return NextResponse.json({ error: "classId wajib" }, { status: 400 });
  }

  const plans = await prisma.lessonPlan.findMany({
    where: { classId },
    include: {
      author: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { meetingNo: "asc" },
  });

  return NextResponse.json({ data: plans });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const parsed = parseBody(lessonPlanInput, await req.json());
  if (parsed.error) return parsed.error;

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(parsed.data.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak membuat RPP di kelas ini" },
      { status: 403 }
    );
  }

  try {
    const klass = await prisma.academicClass.findUnique({
      where: { id: parsed.data.classId },
      select: { subjectId: true, termId: true },
    });

    const plan = await prisma.lessonPlan.create({
      data: {
        ...parsed.data,
        subjectId: parsed.data.subjectId ?? klass?.subjectId ?? undefined,
        termId: parsed.data.termId ?? klass?.termId ?? undefined,
        authorId: authz.user.id,
      },
      include: { subject: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
