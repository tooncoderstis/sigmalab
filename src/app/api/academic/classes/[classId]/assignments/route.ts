import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { teachingAssignmentInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ classId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { classId } = await params;

  const assignments = await prisma.teachingAssignment.findMany({
    where: { classId },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      subject: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: assignments });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { classId } = await params;
  const parsed = parseBody(teachingAssignmentInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const assignment = await prisma.teachingAssignment.create({
      data: { classId, ...parsed.data },
      include: {
        teacher: { select: { id: true, name: true } },
        subject: true,
      },
    });

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { classId } = await params;
  const assignmentId = req.nextUrl.searchParams.get("assignmentId");

  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId wajib diisi" }, { status: 400 });
  }

  try {
    await prisma.teachingAssignment.delete({
      where: { id: assignmentId, classId },
    });

    return NextResponse.json({ message: "Penugasan guru dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
