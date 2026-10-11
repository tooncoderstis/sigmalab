import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { distributionReturnInput } from "@/lib/validation";
import { lostTransition, returnTransition } from "@/lib/textbook";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ distributionId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { distributionId } = await params;
  const parsed = parseBody(distributionReturnInput, await req.json());
  if (parsed.error) return parsed.error;

  const existing = await prisma.textbookDistribution.findUnique({
    where: { id: distributionId },
    select: { id: true, copyId: true, status: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Distribusi tidak ditemukan" },
      { status: 404 }
    );
  }
  if (existing.status !== "LENT") {
    return NextResponse.json(
      { error: "Distribusi sudah selesai" },
      { status: 409 }
    );
  }

  const transition =
    parsed.data.status === "LOST" ? lostTransition() : returnTransition();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.textbookCopy.update({
        where: { id: existing.copyId },
        data: { status: transition.copyStatus },
      });
      return tx.textbookDistribution.update({
        where: { id: distributionId },
        data: {
          status: transition.distributionStatus,
          returnedAt: new Date(),
          note: parsed.data.note,
        },
        include: {
          student: { select: { id: true, name: true } },
          copy: { select: { id: true, code: true } },
        },
      });
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
