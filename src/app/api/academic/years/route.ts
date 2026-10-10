import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { academicYearInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET() {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const years = await prisma.academicYear.findMany({
    include: { terms: { orderBy: { name: "asc" } } },
    orderBy: { name: "desc" },
  });

  return NextResponse.json({ data: years });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(academicYearInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const year = await prisma.$transaction(async (tx) => {
      if (parsed.data.isActive) {
        await tx.academicYear.updateMany({ data: { isActive: false } });
      }
      return tx.academicYear.create({ data: parsed.data });
    });

    return NextResponse.json({ data: year }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
