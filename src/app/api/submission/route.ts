import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { lessonId, repoUrl, notes } = await req.json();

  if (!lessonId || !repoUrl) {
    return NextResponse.json(
      { error: "Link submission wajib diisi" },
      { status: 400 }
    );
  }

  const submission = await prisma.submission.create({
    data: {
      userId: session.user.id,
      lessonId,
      repoUrl,
      notes: notes || null,
      status: "PENDING",
    },
  });

  return NextResponse.json({ message: "Submission berhasil dikirim", submission });
}