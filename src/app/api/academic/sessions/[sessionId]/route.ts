import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { attendanceBulkInput } from "@/lib/validation";

type Params = { params: Promise<{ sessionId: string }> };

async function canManageSession(
  sessionId: string,
  userId: string,
  isManager: boolean
) {
  if (isManager) return true;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, classId: true },
  });
  if (!session) return false;
  if (session.teacherId === userId) return true;

  const assignment = await prisma.teachingAssignment.findFirst({
    where: { classId: session.classId, teacherId: userId },
    select: { id: true },
  });
  return Boolean(assignment);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { sessionId } = await params;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          enrollments: {
            orderBy: { enrolledAt: "asc" },
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      teacher: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      records: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: session });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole("TEACHER", "ADMIN", "SUPER_ADMIN");
  if (authz.error) return authz.error;

  const { sessionId } = await params;

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageSession(sessionId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak mengisi presensi sesi ini" },
      { status: 403 }
    );
  }

  const parsed = parseBody(attendanceBulkInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const results = await prisma.$transaction(
      parsed.data.records.map((record) =>
        prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: record.studentId },
          },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status,
            note: record.note,
            markedById: authz.user.id,
          },
          update: {
            status: record.status,
            note: record.note,
            markedById: authz.user.id,
            markedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({ data: results, count: results.length });
  } catch (error) {
    return handleApiError(error);
  }
}
