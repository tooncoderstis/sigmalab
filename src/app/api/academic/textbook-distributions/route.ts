import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { distributionInput, distributionStatusValues } from "@/lib/validation";
import { borrowTransition } from "@/lib/textbook";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const studentId = req.nextUrl.searchParams.get("studentId") ?? undefined;
  const textbookId = req.nextUrl.searchParams.get("textbookId") ?? undefined;
  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam &&
    (distributionStatusValues as readonly string[]).includes(statusParam)
      ? (statusParam as (typeof distributionStatusValues)[number])
      : undefined;

  const distributions = await prisma.textbookDistribution.findMany({
    where: {
      studentId,
      status: status ?? undefined,
      copy: textbookId ? { textbookId } : undefined,
    },
    include: {
      student: { select: { id: true, name: true } },
      copy: {
        select: {
          id: true,
          code: true,
          textbook: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { distributedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: distributions });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const parsed = parseBody(distributionInput, await req.json());
  if (parsed.error) return parsed.error;

  const { copyId, studentId, classId, dueAt, note } = parsed.data;

  try {
    const copy = await prisma.textbookCopy.findUnique({
      where: { id: copyId },
      select: { id: true, status: true },
    });
    if (!copy) {
      return NextResponse.json({ error: "Eksemplar tidak ditemukan" }, { status: 404 });
    }

    const transition = borrowTransition(copy.status);
    if (!transition.allowed) {
      return NextResponse.json(
        { error: `Eksemplar tidak tersedia (status ${copy.status})` },
        { status: 409 }
      );
    }

    const distribution = await prisma.$transaction(async (tx) => {
      await tx.textbookCopy.update({
        where: { id: copyId },
        data: { status: transition.copyStatus },
      });
      return tx.textbookDistribution.create({
        data: {
          copyId,
          studentId,
          classId,
          dueAt,
          note,
          status: transition.distributionStatus,
          createdById: authz.user.id,
        },
        include: {
          student: { select: { id: true, name: true } },
          copy: { select: { id: true, code: true } },
        },
      });
    });

    return NextResponse.json({ data: distribution }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
