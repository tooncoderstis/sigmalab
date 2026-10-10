import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Data sudah ada (duplikat)" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Referensi tidak valid" },
        { status: 400 }
      );
    }
  }

  console.error("API error:", error);
  return NextResponse.json(
    { error: "Terjadi kesalahan server" },
    { status: 500 }
  );
}
