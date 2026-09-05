import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Kamu harus login dulu" },
      { status: 401 }
    );
  }

  const { courseId } = await req.json();

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId wajib diisi" },
      { status: 400 }
    );
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  if (course.isPremium) {
    return NextResponse.json(
      { error: "Kelas ini berbayar, silakan lakukan pembayaran dulu" },
      { status: 402 }
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { message: "Kamu sudah terdaftar di kelas ini" },
      { status: 200 }
    );
  }

  await prisma.enrollment.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ message: "Berhasil enroll" }, { status: 201 });
}