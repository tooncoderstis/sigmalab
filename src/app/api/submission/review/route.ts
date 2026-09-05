import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "REVIEWER") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { submissionId, decision, feedback } = await req.json();

  if (!submissionId || !["APPROVED", "REJECTED"].includes(decision)) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const submission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: decision,
      feedback: feedback || null,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
    },
  });

  if (decision === "APPROVED") {
    await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: submission.userId,
          lessonId: submission.lessonId,
        },
      },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: {
        userId: submission.userId,
        lessonId: submission.lessonId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ message: "Review tersimpan" });
}