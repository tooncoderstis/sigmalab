import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const entity = req.nextUrl.searchParams.get("entity") ?? undefined;
  const entityId = req.nextUrl.searchParams.get("entityId") ?? undefined;

  try {
    const logs = await prisma.auditLog.findMany({
      where: { entity, entityId },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}
