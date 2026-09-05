import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { quizId, answers, lessonId } = await req.json();

  if (!quizId || !answers || !lessonId) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  const passingScore = lesson?.passingScore ?? 80;

  let correctCount = 0;
  for (const question of quiz.questions) {
    if (answers[question.id] === question.correctOption) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= passingScore;

  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId: quiz.id,
      answers,
      score,
      passed,
    },
  });

  if (passed) {
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: {
        userId: session.user.id,
        lessonId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    score,
    passed,
    correctCount,
    total: quiz.questions.length,
  });
}