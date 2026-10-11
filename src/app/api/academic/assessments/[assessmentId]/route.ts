import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { assessmentUpdateInput } from "@/lib/validation";
import { canManageClass } from "@/lib/academic-auth";
import { deleteObject } from "@/lib/storage";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ assessmentId: string }> };

async function loadAssessment(assessmentId: string) {
  return prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, classId: true },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { assessmentId } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      subject: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
      grades: true,
      submissions: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { submittedAt: "asc" },
      },
      class: {
        select: {
          id: true,
          name: true,
          enrollments: {
            orderBy: { enrolledAt: "asc" },
            include: { student: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: assessment });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const { assessmentId } = await params;
  const existing = await loadAssessment(assessmentId);
  if (!existing) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 }
    );
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(existing.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak mengubah aktivitas ini" },
      { status: 403 }
    );
  }

  const parsed = parseBody(assessmentUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: parsed.data,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const { assessmentId } = await params;
  const existing = await loadAssessment(assessmentId);
  if (!existing) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 }
    );
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(existing.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak menghapus aktivitas ini" },
      { status: 403 }
    );
  }

  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assessmentId },
      select: { fileKey: true },
    });

    await prisma.assessment.delete({ where: { id: assessmentId } });

    await Promise.all(
      submissions.map((s) =>
        deleteObject(s.fileKey).catch(() => undefined)
      )
    );

    return NextResponse.json({ message: "Aktivitas dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
