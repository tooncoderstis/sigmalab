import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { libraryBookUpdateInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ bookId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { bookId } = await params;
  const book = await prisma.libraryBook.findUnique({
    where: { id: bookId },
    include: {
      copies: {
        include: {
          loans: {
            where: { status: { in: ["LENT", "OVERDUE"] } },
            include: { member: { select: { id: true, name: true } } },
          },
        },
        orderBy: { code: "asc" },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: book });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { bookId } = await params;
  const parsed = parseBody(libraryBookUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.libraryBook.update({
      where: { id: bookId },
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

  const { bookId } = await params;
  try {
    await prisma.libraryBook.delete({ where: { id: bookId } });
    return NextResponse.json({ message: "Buku dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
