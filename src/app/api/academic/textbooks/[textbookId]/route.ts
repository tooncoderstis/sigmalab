import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { textbookUpdateInput } from "@/lib/validation";
import { deleteObject } from "@/lib/storage";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ textbookId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { textbookId } = await params;
  const textbook = await prisma.textbook.findUnique({
    where: { id: textbookId },
    include: {
      subject: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      copies: {
        include: {
          distributions: {
            where: { status: "LENT" },
            include: { student: { select: { id: true, name: true } } },
          },
        },
        orderBy: { code: "asc" },
      },
    },
  });

  if (!textbook) {
    return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: textbook });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { textbookId } = await params;
  const parsed = parseBody(textbookUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.textbook.update({
      where: { id: textbookId },
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

  const { textbookId } = await params;

  try {
    const textbook = await prisma.textbook.findUnique({
      where: { id: textbookId },
      select: { fileKey: true },
    });
    if (!textbook) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }

    await prisma.textbook.delete({ where: { id: textbookId } });
    if (textbook.fileKey) {
      deleteObject(textbook.fileKey).catch(() => undefined);
    }

    return NextResponse.json({ message: "Buku dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
