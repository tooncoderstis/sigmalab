import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { courseId } = await req.json();

  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      amount: course.price,
      status: "PENDING",
    },
  });

  const merchantRefId = payment.id;

  let mayarRes: Response;
  let mayarData: { statusCode?: number; data?: { transactionId: string; id: string; link: string } };

  try {
    mayarRes = await fetch(process.env.MAYAR_BASE_URL + "/invoices/create", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.MAYAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: session.user.name,
        email: session.user.email,
        mobile: "081234567890",
        description: "Pembelian kelas: " + course.title,
        items: [
          {
            quantity: 1,
            rate: course.price,
            description: course.title,
          },
        ],
        extraData: {
          merchantRefId,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    mayarData = await mayarRes.json();
  } catch (err) {
    console.error("Mayar request failed:", err);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Gagal menghubungi server pembayaran" },
      { status: 502 }
    );
  }

  if (!mayarRes.ok || mayarData.statusCode !== 200 || !mayarData.data) {
    console.error("Mayar API error:", JSON.stringify(mayarData));
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Gagal membuat invoice pembayaran" },
      { status: 500 }
    );
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      merchantRefId,
      mayarTransactionId: mayarData.data.transactionId,
      mayarInvoiceId: mayarData.data.id,
      paymentLinkUrl: mayarData.data.link,
    },
  });

  return NextResponse.json({ paymentLinkUrl: mayarData.data.link });
}