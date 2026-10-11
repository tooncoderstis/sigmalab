import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { createDownloadUrl, isStorageConfigured } from "@/lib/storage";

type Params = { params: Promise<{ textbookId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Penyimpanan berkas belum dikonfigurasi" },
      { status: 503 }
    );
  }

  const { textbookId } = await params;
  const textbook = await prisma.textbook.findUnique({
    where: { id: textbookId },
    select: { fileKey: true, fileName: true },
  });

  if (!textbook?.fileKey) {
    return NextResponse.json(
      { error: "Buku ini tidak punya berkas digital" },
      { status: 404 }
    );
  }

  try {
    const url = await createDownloadUrl(
      textbook.fileKey,
      textbook.fileName ?? undefined
    );
    return NextResponse.json({ data: { url } });
  } catch (error) {
    return handleApiError(error);
  }
}
