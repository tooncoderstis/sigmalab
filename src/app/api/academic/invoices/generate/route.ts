import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { invoiceGenerateInput } from "@/lib/validation";
import { notifyUsers } from "@/lib/notify";
import { recordAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/billing";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(invoiceGenerateInput, await req.json());
  if (parsed.error) return parsed.error;

  const { classId, title, amount, dueAt, termId } = parsed.data;

  try {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId, status: "ACTIVE" },
      select: { studentId: true, class: { select: { termId: true } } },
    });

    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: "Kelas tidak punya siswa aktif" },
        { status: 400 }
      );
    }

    const resolvedTermId =
      termId ?? enrollments[0]?.class.termId ?? undefined;

    await prisma.invoice.createMany({
      data: enrollments.map((e) => ({
        studentId: e.studentId,
        termId: resolvedTermId,
        title,
        amount,
        dueAt,
        status: "UNPAID" as const,
        createdById: authz.user.id,
      })),
    });

    const studentIds = enrollments.map((e) => e.studentId);
    await notifyUsers(studentIds, {
      type: "INVOICE",
      title: "Tagihan baru",
      body: `${title} — ${formatRupiah(amount)}`,
      link: "/siswa/spp",
    });
    await recordAudit({
      actorId: authz.user.id,
      action: "generate",
      entity: "Invoice",
      metadata: { classId, count: studentIds.length, amount },
    });

    return NextResponse.json(
      { data: { count: studentIds.length } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
