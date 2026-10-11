import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { bookLoanInput, loanStatusValues } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const memberId = req.nextUrl.searchParams.get("memberId") ?? undefined;
  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && (loanStatusValues as readonly string[]).includes(statusParam)
      ? (statusParam as (typeof loanStatusValues)[number])
      : undefined;

  const loans = await prisma.bookLoan.findMany({
    where: { memberId, status },
    include: {
      member: { select: { id: true, name: true } },
      copy: {
        select: {
          id: true,
          code: true,
          book: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { borrowedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: loans });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const parsed = parseBody(bookLoanInput, await req.json());
  if (parsed.error) return parsed.error;

  const { copyId, memberId, dueAt, note } = parsed.data;

  try {
    const copy = await prisma.libraryCopy.findUnique({
      where: { id: copyId },
      select: { id: true, status: true },
    });
    if (!copy) {
      return NextResponse.json({ error: "Eksemplar tidak ditemukan" }, { status: 404 });
    }
    if (copy.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: `Eksemplar tidak tersedia (status ${copy.status})` },
        { status: 409 }
      );
    }

    const loan = await prisma.$transaction(async (tx) => {
      await tx.libraryCopy.update({
        where: { id: copyId },
        data: { status: "LENT" },
      });
      return tx.bookLoan.create({
        data: { copyId, memberId, dueAt, note, createdById: authz.user.id },
        include: {
          member: { select: { id: true, name: true } },
          copy: { select: { id: true, code: true } },
        },
      });
    });

    return NextResponse.json({ data: loan }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
