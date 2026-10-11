import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { lessonPlanUpdateInput } from "@/lib/validation";
import { canManageClass } from "@/lib/academic-auth";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ lessonPlanId: string }> };

async function loadPlan(id: string) {
  return prisma.lessonPlan.findUnique({
    where: { id },
    select: { id: true, classId: true },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { lessonPlanId } = await params;
  const plan = await prisma.lessonPlan.findUnique({
    where: { id: lessonPlanId },
    include: {
      author: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "RPP tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: plan });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const { lessonPlanId } = await params;
  const existing = await loadPlan(lessonPlanId);
  if (!existing) {
    return NextResponse.json({ error: "RPP tidak ditemukan" }, { status: 404 });
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(existing.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak mengubah RPP ini" },
      { status: 403 }
    );
  }

  const parsed = parseBody(lessonPlanUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.lessonPlan.update({
      where: { id: lessonPlanId },
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

  const { lessonPlanId } = await params;
  const existing = await loadPlan(lessonPlanId);
  if (!existing) {
    return NextResponse.json({ error: "RPP tidak ditemukan" }, { status: 404 });
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const allowed = await canManageClass(existing.classId, authz.user.id, isManager);
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak menghapus RPP ini" },
      { status: 403 }
    );
  }

  try {
    await prisma.lessonPlan.delete({ where: { id: lessonPlanId } });
    return NextResponse.json({ message: "RPP dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
