import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { createDownloadUrl, isStorageConfigured } from "@/lib/storage";

const downloadInput = z.object({ submissionId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Penyimpanan berkas belum dikonfigurasi" },
      { status: 503 }
    );
  }

  const parsed = parseBody(downloadInput, await req.json());
  if (parsed.error) return parsed.error;

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: parsed.data.submissionId },
    select: {
      fileKey: true,
      fileName: true,
      studentId: true,
      assessment: { select: { classId: true } },
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Berkas tidak ditemukan" },
      { status: 404 }
    );
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const isOwner = submission.studentId === authz.user.id;
  let allowed = isManager || isOwner;

  if (!allowed && userHasRole(authz.user, "TEACHER")) {
    const teach = await prisma.teachingAssignment.findFirst({
      where: {
        classId: submission.assessment.classId,
        teacherId: authz.user.id,
      },
      select: { id: true },
    });
    allowed = Boolean(teach);
  }

  if (!allowed) {
    const guardian = await prisma.studentProfile.findFirst({
      where: { userId: submission.studentId, guardian: { userId: authz.user.id } },
      select: { id: true },
    });
    allowed = Boolean(guardian);
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak mengunduh berkas ini" },
      { status: 403 }
    );
  }

  try {
    const url = await createDownloadUrl(submission.fileKey, submission.fileName);
    return NextResponse.json({ data: { url } });
  } catch (error) {
    return handleApiError(error);
  }
}
