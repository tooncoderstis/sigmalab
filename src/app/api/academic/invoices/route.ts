import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { invoiceInput, invoiceStatusValues } from "@/lib/validation";
import { notifyUser } from "@/lib/notify";
import { recordAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/billing";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

async function viewerStudentIds(
  userId: string,
  roles: string[]
): Promise<string[] | null> {
  // null = manager (tanpa batasan)
  if (roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")) return null;

  const ids = new Set<string>();
  if (roles.includes("STUDENT")) ids.add(userId);
  if (roles.includes("GUARDIAN")) {
    const guardian = await prisma.guardianProfile.findUnique({
      where: { userId },
      select: { students: { select: { userId: true } } },
    });
    guardian?.students.forEach((s) => ids.add(s.userId));
  }
  return Array.from(ids);
}

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const roles = [authz.user.role, ...(authz.user.roles ?? [])];
  const allowed = await viewerStudentIds(authz.user.id, roles);

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && (invoiceStatusValues as readonly string[]).includes(statusParam)
      ? (statusParam as (typeof invoiceStatusValues)[number])
      : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      status,
      studentId: allowed ? { in: allowed } : undefined,
    },
    include: {
      student: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 300,
  });

  return NextResponse.json({ data: invoices });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(invoiceInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const invoice = await prisma.invoice.create({
      data: {
        ...parsed.data,
        status: "UNPAID",
        createdById: authz.user.id,
      },
      include: { student: { select: { id: true, name: true } } },
    });

    await notifyUser({
      userId: invoice.studentId,
      type: "INVOICE",
      title: "Tagihan baru",
      body: `${invoice.title} — ${formatRupiah(invoice.amount)}`,
      link: "/siswa/spp",
    });
    await recordAudit({
      actorId: authz.user.id,
      action: "create",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { amount: invoice.amount },
    });

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
