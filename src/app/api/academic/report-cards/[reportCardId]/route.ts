import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { reportCardUpdateInput } from "@/lib/validation";
import { canViewStudent } from "@/lib/academic-auth";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ reportCardId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { reportCardId } = await params;

  const reportCard = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: {
            select: { nis: true, nisn: true, program: { select: { name: true } } },
          },
        },
      },
      term: {
        select: {
          id: true,
          name: true,
          academicYear: { select: { name: true } },
        },
      },
      entries: {
        include: { subject: { select: { id: true, name: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
  });

  if (!reportCard) {
    return NextResponse.json({ error: "Rapor tidak ditemukan" }, { status: 404 });
  }

  const allowed = await canViewStudent(reportCard.studentId, authz.user.id, {
    isManager: userHasRole(authz.user, "ADMIN", "SUPER_ADMIN"),
    isTeacher: userHasRole(authz.user, "TEACHER"),
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak melihat rapor ini" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: reportCard });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const { reportCardId } = await params;

  const existing = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Rapor tidak ditemukan" }, { status: 404 });
  }

  const parsed = parseBody(reportCardUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const { status, homeroomNote } = parsed.data;
    const updated = await prisma.reportCard.update({
      where: { id: reportCardId },
      data: {
        status,
        homeroomNote,
        publishedAt:
          status === undefined
            ? undefined
            : status === "PUBLISHED"
              ? new Date()
              : null,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
