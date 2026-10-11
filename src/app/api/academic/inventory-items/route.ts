import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { inventoryItemInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const category = req.nextUrl.searchParams.get("category") ?? undefined;

  const items = await prisma.inventoryItem.findMany({
    where: {
      category:
        category === "ATK" || category === "SARPRAS" || category === "LAINNYA"
          ? category
          : undefined,
    },
    orderBy: { name: "asc" },
    take: 500,
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const parsed = parseBody(inventoryItemInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const item = await prisma.inventoryItem.create({ data: parsed.data });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
