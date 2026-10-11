import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { gradeBulkInput } from "@/lib/validation";
import { canManageClass } from "@/lib/academic-auth";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ assessmentId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const { assessmentId } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, classId: true, maxScore: true },
  });
  if (!assessment) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 }
    );
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(assessment.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak menilai aktivitas ini" },
      { status: 403 }
    );
  }

  const parsed = parseBody(gradeBulkInput, await req.json());
  if (parsed.error) return parsed.error;

  const tooHigh = parsed.data.grades.find((g) => g.score > assessment.maxScore);
  if (tooHigh) {
    return NextResponse.json(
      { error: `Nilai melebihi skor maksimum (${assessment.maxScore})` },
      { status: 400 }
    );
  }

  try {
    const results = await prisma.$transaction(
      parsed.data.grades.map((grade) =>
        prisma.grade.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId,
              studentId: grade.studentId,
            },
          },
          create: {
            assessmentId,
            studentId: grade.studentId,
            score: grade.score,
            feedback: grade.feedback,
            gradedById: authz.user.id,
          },
          update: {
            score: grade.score,
            feedback: grade.feedback,
            gradedById: authz.user.id,
            gradedAt: new Date(),
          },
        })
      )
    );

    await prisma.assignmentSubmission.updateMany({
      where: {
        assessmentId,
        studentId: { in: parsed.data.grades.map((g) => g.studentId) },
        status: "SUBMITTED",
      },
      data: { status: "GRADED" },
    });

    return NextResponse.json({ data: results, count: results.length });
  } catch (error) {
    return handleApiError(error);
  }
}
