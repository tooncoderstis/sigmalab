import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { assignmentSubmissionInput } from "@/lib/validation";
import { isEnrolledInClass } from "@/lib/academic-auth";
import { deleteObject } from "@/lib/storage";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ assessmentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const { assessmentId } = await params;

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assessmentId },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { submittedAt: "asc" },
  });

  return NextResponse.json({ data: submissions });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole("STUDENT", "ADMIN", "SUPER_ADMIN");
  if (authz.error) return authz.error;

  const { assessmentId } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, classId: true },
  });
  if (!assessment) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 }
    );
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  if (!isManager) {
    const enrolled = await isEnrolledInClass(assessment.classId, authz.user.id);
    if (!enrolled) {
      return NextResponse.json(
        { error: "Kamu tidak terdaftar di kelas ini" },
        { status: 403 }
      );
    }
  }

  const parsed = parseBody(assignmentSubmissionInput, await req.json());
  if (parsed.error) return parsed.error;

  const expectedPrefix = `assignments/${assessmentId}/${authz.user.id}/`;
  if (!parsed.data.fileKey.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Kunci berkas tidak valid untuk pengguna ini" },
      { status: 400 }
    );
  }

  try {
    const previous = await prisma.assignmentSubmission.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId: authz.user.id,
        },
      },
      select: { fileKey: true },
    });

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId: authz.user.id,
        },
      },
      create: {
        assessmentId,
        studentId: authz.user.id,
        ...parsed.data,
      },
      update: {
        ...parsed.data,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    if (previous && previous.fileKey !== parsed.data.fileKey) {
      deleteObject(previous.fileKey).catch(() => undefined);
    }

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
