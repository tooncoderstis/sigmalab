import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { libraryBookInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const search = req.nextUrl.searchParams.get("q")?.trim();

  const books = await prisma.libraryBook.findMany({
    where: search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { author: { contains: search, mode: "insensitive" } },
            { isbn: { contains: search } },
          ],
        }
      : undefined,
    include: { copies: { select: { id: true, code: true, status: true } } },
    orderBy: { title: "asc" },
    take: 200,
  });

  return NextResponse.json({ data: books });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const parsed = parseBody(libraryBookInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const book = await prisma.libraryBook.create({ data: parsed.data });
    return NextResponse.json({ data: book }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
