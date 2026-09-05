import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewButtons from "./review-buttons";

export default async function AdminSubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "REVIEWER") {
    redirect("/dashboard");
  }

  const submissions = await prisma.submission.findMany({
    where: { status: "PENDING" },
    include: {
      user: true,
      lesson: { include: { module: { include: { course: true } } } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Antrian Review Submission</h1>

        {submissions.length === 0 ? (
          <p className="text-gray-500">Tidak ada submission yang menunggu.</p>
        ) : (
          <ul className="space-y-4">
            {submissions.map((sub) => (
              <li key={sub.id} className="bg-white rounded-lg shadow p-5">
                <p className="font-medium">{sub.lesson.title}</p>
                <p className="text-sm text-gray-500">
                  {sub.lesson.module.course.title} — dikirim oleh {sub.user.name}
                </p>
                <a
                  href={sub.repoUrl ?? "#"}
                  target="_blank"
                  className="text-blue-600 text-sm hover:underline block mt-2"
                >
                  {sub.repoUrl}
                </a>
                {sub.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    Catatan: {sub.notes}
                  </p>
                )}

                <ReviewButtons submissionId={sub.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}