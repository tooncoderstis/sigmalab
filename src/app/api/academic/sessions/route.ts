import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { attendanceSessionInput } from "@/lib/validation";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const classId = req.nextUrl.searchParams.get("classId") ?? undefined;
  const teacherId = req.nextUrl.searchParams.get("teacherId") ?? undefined;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      ...(classId ? { classId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      _count: { select: { records: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: sessions });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const parsed = parseBody(attendanceSessionInput, await req.json());
  if (parsed.error) return parsed.error;

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const teacherId = parsed.data.teacherId ?? authz.user.id;

  if (!isManager && teacherId !== authz.user.id) {
    return NextResponse.json(
      { error: "Guru hanya bisa membuat sesi untuk dirinya sendiri" },
      { status: 403 }
    );
  }

  try {
    const klass = await prisma.academicClass.findUnique({
      where: { id: parsed.data.classId },
      select: { id: true },
    });
    if (!klass) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const session = await prisma.attendanceSession.create({
      data: {
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        teacherId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        topic: parsed.data.topic,
        createdById: authz.user.id,
      },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
