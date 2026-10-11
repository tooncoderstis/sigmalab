import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { bookLoanReturnInput } from "@/lib/validation";
import { computeFine } from "@/lib/library";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ loanId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { loanId } = await params;
  const parsed = parseBody(bookLoanReturnInput, await req.json());
  if (parsed.error) return parsed.error;

  const existing = await prisma.bookLoan.findUnique({
    where: { id: loanId },
    select: { id: true, copyId: true, status: true, dueAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Peminjaman tidak ditemukan" }, { status: 404 });
  }
  if (existing.status === "RETURNED" || existing.status === "LOST") {
    return NextResponse.json(
      { error: "Peminjaman sudah selesai" },
      { status: 409 }
    );
  }

  const lost = parsed.data.status === "LOST";
  const returnedAt = new Date();
  const fine = lost ? 0 : computeFine(existing.dueAt, returnedAt);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.libraryCopy.update({
        where: { id: existing.copyId },
        data: { status: lost ? "LOST" : "AVAILABLE" },
      });
      return tx.bookLoan.update({
        where: { id: loanId },
        data: {
          status: lost ? "LOST" : "RETURNED",
          returnedAt,
          fine,
          note: parsed.data.note,
        },
        include: {
          member: { select: { id: true, name: true } },
          copy: { select: { id: true, code: true } },
        },
      });
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
