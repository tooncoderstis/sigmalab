import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { libraryCopyInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ bookId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { bookId } = await params;
  const copies = await prisma.libraryCopy.findMany({
    where: { bookId },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ data: copies });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { bookId } = await params;
  const parsed = parseBody(libraryCopyInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const copy = await prisma.libraryCopy.create({
      data: {
        bookId,
        code: parsed.data.code,
        conditionNote: parsed.data.conditionNote,
      },
    });
    return NextResponse.json({ data: copy }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
