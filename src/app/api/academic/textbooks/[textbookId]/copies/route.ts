import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { textbookCopyInput } from "@/lib/validation";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

type Params = { params: Promise<{ textbookId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const { textbookId } = await params;
  const copies = await prisma.textbookCopy.findMany({
    where: { textbookId },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ data: copies });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  const { textbookId } = await params;
  const parsed = parseBody(textbookCopyInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const copy = await prisma.textbookCopy.create({
      data: {
        textbookId,
        code: parsed.data.code,
        conditionNote: parsed.data.conditionNote,
      },
    });
    return NextResponse.json({ data: copy }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
