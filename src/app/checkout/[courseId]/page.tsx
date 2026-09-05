import { prisma } from "@/lib/prisma";
import { auth } from "../../../../auth";
import { redirect, notFound } from "next/navigation";
import CheckoutButton from "./checkout-button";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) notFound();

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  if (existing) {
    redirect(`/courses/${course.slug}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Checkout</h1>

        <div className="border rounded p-4 mb-6">
          <p className="font-medium">{course.title}</p>
          <p className="text-2xl font-bold mt-2">
            Rp {course.price.toLocaleString("id-ID")}
          </p>
        </div>

        <CheckoutButton courseId={course.id} />
      </div>
    </div>
  );
}