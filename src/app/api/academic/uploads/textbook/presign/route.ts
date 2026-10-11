import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { textbookFileInput } from "@/lib/validation";
import {
  buildStorageKey,
  createUploadUrl,
  isStorageConfigured,
} from "@/lib/storage";

const MANAGERS = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGERS);
  if (authz.error) return authz.error;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Penyimpanan berkas belum dikonfigurasi" },
      { status: 503 }
    );
  }

  const parsed = parseBody(textbookFileInput, await req.json());
  if (parsed.error) return parsed.error;

  const { textbookId, fileName, mimeType, fileSize } = parsed.data;

  const textbook = await prisma.textbook.findUnique({
    where: { id: textbookId },
    select: { id: true },
  });
  if (!textbook) {
    return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
  }

  try {
    const key = buildStorageKey("textbooks", fileName, textbookId);
    const uploadUrl = await createUploadUrl(key, mimeType, fileSize);
    return NextResponse.json({ data: { key, uploadUrl } });
  } catch (error) {
    return handleApiError(error);
  }
}
