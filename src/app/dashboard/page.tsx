import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: true },
          },
        },
      },
    },
  });

  const progressRecords = await prisma.progress.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
    },
    select: { lessonId: true },
  });

  const completedLessonIds = new Set(progressRecords.map((p) => p.lessonId));

  const enrollmentsWithProgress = enrollments.map((enrollment) => {
    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    const completedCount = allLessons.filter((l) =>
      completedLessonIds.has(l.id)
    ).length;
    const percent =
      totalLessons === 0
        ? 0
        : Math.round((completedCount / totalLessons) * 100);

    const firstLesson = allLessons[0] ?? null;

    return {
      ...enrollment,
      totalLessons,
      completedCount,
      percent,
      firstLessonId: firstLesson?.id ?? null,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Halo, {session.user.name} 👋
            </h1>
            <p className="text-gray-600">{session.user.email}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Kelas Kamu</h2>

          {enrollmentsWithProgress.length === 0 ? (
            <p className="text-gray-500">
              Kamu belum terdaftar di kelas manapun.
            </p>
          ) : (
            <ul className="space-y-4">
              {enrollmentsWithProgress.map((enrollment) => (
                <li key={enrollment.id} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <a
                      href={
                        enrollment.firstLessonId
                          ? "/learn/" +
                            enrollment.course.slug +
                            "/" +
                            enrollment.firstLessonId
                          : "/courses/" + enrollment.course.slug
                      }
                      className="font-medium hover:underline"
                    >
                      {enrollment.course.title}
                    </a>
                    <span className="text-sm text-gray-500">
                      {enrollment.percent}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: enrollment.percent + "%" }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {enrollment.completedCount} dari {enrollment.totalLessons}{" "}
                    lesson selesai
                    {enrollment.percent === 100 && " — Selesai! 🎉"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}