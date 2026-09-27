import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const payload = await req.json();

  const merchantRefId = payload?.data?.extraData?.merchantRefId;

  if (!merchantRefId) {
    return NextResponse.json({ received: true, note: "no merchantRefId, ignored" });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: merchantRefId },
  });

  if (!payment) {
    return NextResponse.json({ received: true, note: "payment not found, ignored" });
  }

  const status = payload?.data?.status;

  if (status === "SUCCESS" || status === "paid") {
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

  return NextResponse.json({ received: true });
}