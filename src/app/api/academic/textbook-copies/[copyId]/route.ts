import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { textbookCopyUpdateInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ copyId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { copyId } = await params;
  const parsed = parseBody(textbookCopyUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.textbookCopy.update({
      where: { id: copyId },
      data: parsed.data,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { copyId } = await params;
  try {
    const active = await prisma.textbookDistribution.findFirst({
      where: { copyId, status: "LENT" },
      select: { id: true },
    });
    if (active) {
      return NextResponse.json(
        { error: "Eksemplar sedang dipinjam; kembalikan dulu" },
        { status: 409 }
      );
    }
    await prisma.textbookCopy.delete({ where: { id: copyId } });
    return NextResponse.json({ message: "Eksemplar dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
