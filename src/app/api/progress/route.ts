import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { lessonId } = await req.json();

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId wajib diisi" }, { status: 400 });
  }

  await prisma.progress.upsert({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId },
    },
    update: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      lessonId,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ message: "Progress tersimpan" });
}