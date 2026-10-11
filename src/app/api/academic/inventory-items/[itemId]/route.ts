import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { inventoryItemUpdateInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ itemId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { itemId } = await params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      movements: {
        include: { by: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: item });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { itemId } = await params;
  const parsed = parseBody(inventoryItemUpdateInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
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

  const { itemId } = await params;
  try {
    await prisma.inventoryItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: "Barang dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
