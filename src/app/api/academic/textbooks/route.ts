import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { textbookInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const search = req.nextUrl.searchParams.get("q")?.trim();

  const textbooks = await prisma.textbook.findMany({
    where: search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { author: { contains: search, mode: "insensitive" } },
            { isbn: { contains: search } },
          ],
        }
      : undefined,
    include: {
      subject: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      copies: { select: { id: true, code: true, status: true, conditionNote: true } },
    },
    orderBy: { title: "asc" },
    take: 200,
  });

  return NextResponse.json({ data: textbooks });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const parsed = parseBody(textbookInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const textbook = await prisma.textbook.create({
      data: { ...parsed.data, createdById: authz.user.id },
      include: { subject: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ data: textbook }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
