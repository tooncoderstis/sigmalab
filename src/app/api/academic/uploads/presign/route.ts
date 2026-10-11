import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { presignInput } from "@/lib/validation";
import { isEnrolledInClass } from "@/lib/academic-auth";
import { buildAssignmentKey, createUploadUrl, isStorageConfigured } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const authz = await requireApiRole("STUDENT", "ADMIN", "SUPER_ADMIN");
  if (authz.error) return authz.error;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Penyimpanan berkas belum dikonfigurasi" },
      { status: 503 }
    );
  }

  const parsed = parseBody(presignInput, await req.json());
  if (parsed.error) return parsed.error;

  const { assessmentId, fileName, mimeType, fileSize } = parsed.data;

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

  try {
    const key = buildAssignmentKey(assessmentId, authz.user.id, fileName);
    const uploadUrl = await createUploadUrl(key, mimeType, fileSize);
    return NextResponse.json({ data: { key, uploadUrl } });
  } catch (error) {
    return handleApiError(error);
  }
}
