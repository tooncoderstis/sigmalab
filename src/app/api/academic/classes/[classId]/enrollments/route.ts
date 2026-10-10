import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { classEnrollmentInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ classId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { classId } = await params;

  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  return NextResponse.json({ data: enrollments });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { classId } = await params;
  const parsed = parseBody(classEnrollmentInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const klass = await prisma.academicClass.findUnique({
      where: { id: classId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!klass) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    if (klass.capacity && klass._count.enrollments >= klass.capacity) {
      return NextResponse.json(
        { error: "Kapasitas kelas sudah penuh" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.classEnrollment.create({
      data: { classId, studentId: parsed.data.studentId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { classId } = await params;
  const parsed = parseBody(classEnrollmentInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    await prisma.classEnrollment.delete({
      where: {
        classId_studentId: { classId, studentId: parsed.data.studentId },
      },
    });

    return NextResponse.json({ message: "Siswa dikeluarkan dari kelas" });
  } catch (error) {
    return handleApiError(error);
  }
}
