import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { canViewStudent } from "@/lib/academic-auth";
import { renderReportCardPdf } from "@/lib/report-card-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          studentProfile: {
            select: {
              nis: true,
              nisn: true,
              program: { select: { name: true } },
            },
          },
        },
      },
      term: {
        select: {
          name: true,
          academicYear: { select: { name: true } },
        },
      },
      entries: {
        include: { subject: { select: { name: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
  });

  if (!reportCard) {
    return NextResponse.json({ error: "Rapor tidak ditemukan" }, { status: 404 });
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const isTeacher = userHasRole(authz.user, "TEACHER");
  const allowed = await canViewStudent(reportCard.studentId, authz.user.id, {
    isManager,
    isTeacher,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak mengunduh rapor ini" },
      { status: 403 }
    );
  }

  // Siswa/wali hanya boleh melihat rapor yang sudah dipublikasikan.
  const isStaffViewer = isManager || isTeacher;
  if (!isStaffViewer && reportCard.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Rapor belum dipublikasikan" },
      { status: 403 }
    );
  }

  try {
    const buffer = await renderReportCardPdf({
      studentName: reportCard.student.name,
      nis: reportCard.student.studentProfile?.nis ?? null,
      nisn: reportCard.student.studentProfile?.nisn ?? null,
      programName: reportCard.student.studentProfile?.program?.name ?? null,
      termName: reportCard.term.name,
      academicYearName: reportCard.term.academicYear?.name ?? "-",
      homeroomNote: reportCard.homeroomNote,
      entries: reportCard.entries.map((entry) => ({
        subject: entry.subject.name,
        finalScore: entry.finalScore,
        predicate: entry.predicate,
        description: entry.description,
      })),
    });

    const fileName = `rapor-${reportCard.student.name
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase()}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${fileName}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
