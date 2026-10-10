import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { programInput, slugify } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET() {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { classes: true, subjects: true, students: true } } },
  });

  return NextResponse.json({ data: programs });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(programInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const program = await prisma.program.create({
      data: {
        ...parsed.data,
        slug: parsed.data.slug ?? slugify(parsed.data.name),
      },
    });

    return NextResponse.json({ data: program }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
