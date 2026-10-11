import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { inventoryMovementInput } from "@/lib/validation";
import { applyMovement } from "@/lib/inventory";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const parsed = parseBody(inventoryMovementInput, await req.json());
  if (parsed.error) return parsed.error;

  const { itemId, type, quantity, note } = parsed.data;

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { id: true, quantity: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    const nextQty = applyMovement(item.quantity, type, quantity);

    const movement = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: nextQty },
      });
      return tx.inventoryMovement.create({
        data: { itemId, type, quantity, note, byId: authz.user.id },
      });
    });

    return NextResponse.json(
      { data: { movement, quantity: nextQty } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
