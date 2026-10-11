import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { invoiceUpdateInput } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ invoiceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      student: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }

  const roles = [authz.user.role, ...(authz.user.roles ?? [])];
  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  let allowed = isManager || invoice.studentId === authz.user.id;
  if (!allowed && roles.includes("GUARDIAN")) {
    const link = await prisma.studentProfile.findFirst({
      where: { userId: invoice.studentId, guardian: { userId: authz.user.id } },
      select: { id: true },
    });
    allowed = Boolean(link);
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "Kamu tidak berhak melihat tagihan ini" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: invoice });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { invoiceId } = await params;
  const parsed = parseBody(invoiceUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  const data = { ...parsed.data };
  if (parsed.data.status === "PAID") {
    (data as { paidAt?: Date }).paidAt = new Date();
  } else if (parsed.data.status) {
    (data as { paidAt?: Date | null }).paidAt = null;
  }

  try {
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: { student: { select: { id: true, name: true } } },
    });

    if (parsed.data.status === "PAID") {
      await notifyUser({
        userId: updated.studentId,
        type: "INVOICE",
        title: "Tagihan lunas",
        body: `${updated.title} telah dibayar.`,
        link: "/siswa/spp",
      });
    }
    await recordAudit({
      actorId: authz.user.id,
      action: "update",
      entity: "Invoice",
      entityId: invoiceId,
      metadata: { status: parsed.data.status },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const { invoiceId } = await params;
  try {
    await prisma.invoice.delete({ where: { id: invoiceId } });
    await recordAudit({
      actorId: authz.user.id,
      action: "delete",
      entity: "Invoice",
      entityId: invoiceId,
    });
    return NextResponse.json({ message: "Tagihan dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
