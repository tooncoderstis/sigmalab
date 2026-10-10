import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { classInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ classId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { classId } = await params;

  const klass = await prisma.academicClass.findUnique({
    where: { id: classId },
    include: {
      program: true,
      term: { include: { academicYear: true } },
      subject: true,
      homeroomTeacher: { select: { id: true, name: true, email: true } },
      enrollments: {
        orderBy: { enrolledAt: "asc" },
        include: { student: { select: { id: true, name: true, email: true } } },
      },
      assignments: {
        include: {
          teacher: { select: { id: true, name: true } },
          subject: true,
        },
      },
    },
  });

  if (!klass) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: klass });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { classId } = await params;
  const parsed = parseBody(classInput.partial(), await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.academicClass.update({
      where: { id: classId },
      data: parsed.data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { classId } = await params;

  try {
    await prisma.academicClass.delete({ where: { id: classId } });
    return NextResponse.json({ message: "Kelas dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
