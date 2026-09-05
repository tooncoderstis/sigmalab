import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const payload = await req.json();

  const merchantRefId = payload?.data?.extraData?.merchantRefId;

  if (!merchantRefId) {
    return NextResponse.json({ error: "merchantRefId tidak ditemukan" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: merchantRefId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment tidak ditemukan" }, { status: 404 });
  }

  const eventType = payload?.event;

  if (eventType === "payment.received") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        rawWebhook: payload,
      },
    });

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId: payment.courseId,
        },
      },
      update: { status: "ACTIVE" },
      create: {
        userId: payment.userId,
        courseId: payment.courseId,
        status: "ACTIVE",
      },
    });
  }

  return NextResponse.json({ statusCode: 200, messages: "success" });
}