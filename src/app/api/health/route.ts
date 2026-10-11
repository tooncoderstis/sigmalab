import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStorageConfigured } from "@/lib/storage";

export async function GET() {
  const storage = isStorageConfigured() ? "up" : "unconfigured";
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up", storage });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json(
      { status: "degraded", db: "down", storage },
      { status: 503 }
    );
  }
}
