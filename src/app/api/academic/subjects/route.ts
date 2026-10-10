import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { subjectInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const programId = req.nextUrl.searchParams.get("programId") ?? undefined;

  const subjects = await prisma.subject.findMany({
    where: programId ? { programId } : undefined,
    include: { program: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: subjects });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(subjectInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const subject = await prisma.subject.create({ data: parsed.data });
    return NextResponse.json({ data: subject }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
