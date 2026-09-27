import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";
import Link from "next/link";

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

  const totalCoursesEnrolled = enrollmentsWithProgress.length;
  const totalCoursesCompleted = enrollmentsWithProgress.filter(
    (e) => e.percent === 100
  ).length;
  const averageProgress = enrollmentsWithProgress.length
    ? Math.round(
        enrollmentsWithProgress.reduce((sum, e) => sum + e.percent, 0) /
          enrollmentsWithProgress.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header Section */}
      <section className="section-padding bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Halo, {session.user.name} 👋
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                {session.user.email}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {totalCoursesEnrolled > 0 && (
        <section className="section-padding-small bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900/50 dark:to-gray-950/50">
          <div className="container-max">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat 1: Courses Enrolled */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Kursus Terdaftar
                    </p>
                    <p className="text-2xl md:text-3xl font-bold gradient-text mt-2">
                      {totalCoursesEnrolled}
                    </p>
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
              </div>

              {/* Stat 2: Courses Completed */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Kursus Selesai
                    </p>
                    <p className="text-2xl md:text-3xl font-bold gradient-text mt-2">
                      {totalCoursesCompleted}
                    </p>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>

              {/* Stat 3: Average Progress */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Rata-rata Progress
                    </p>
                    <p className="text-2xl md:text-3xl font-bold gradient-text mt-2">
                      {averageProgress}%
                    </p>
                  </div>
                  <div className="text-4xl">⚡</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-max">
          {enrollmentsWithProgress.length === 0 ? (
            <div className="card p-12 text-center space-y-4">
              <div className="text-5xl mb-4">📖</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Belum Ada Kursus
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Mulai belajar dengan mendaftar ke salah satu kursus kami yang
                tersedia
              </p>
              <Link href="/courses" className="btn-primary inline-block mt-4">
                Lihat Semua Kursus
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Kursus Saya
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollmentsWithProgress.map((enrollment) => {
                  const isCompleted = enrollment.percent === 100;
                  const continueLink = enrollment.firstLessonId
                    ? `/learn/${enrollment.course.slug}/${enrollment.firstLessonId}`
                    : `/courses/${enrollment.course.slug}`;

                  return (
                    <div key={enrollment.id} className="card overflow-hidden hover:shadow-lg transition-all">
                      {/* Header with Status */}
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-lg line-clamp-2">
                            {enrollment.course.title}
                          </h3>
                          {isCompleted && (
                            <div className="badge-success bg-white/20 text-white border-none">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Info */}
                      <div className="p-6 space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Progress
                            </p>
                            <p className="text-sm font-bold gradient-text">
                              {enrollment.percent}%
                            </p>
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                              style={{ width: `${enrollment.percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              Selesai
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {enrollment.completedCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              Total
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {enrollment.totalLessons}
                            </p>
                          </div>
                        </div>

                        {/* Completion Message */}
                        {isCompleted && (
                          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-2 rounded-lg text-center">
                            🎉 Kursus Selesai! Download Sertifikat Anda
                          </div>
                        )}

                        {/* CTA Button */}
                        <Link
                          href={continueLink}
                          className="block text-center btn-primary py-2 text-sm"
                        >
                          {isCompleted ? "Lihat Kursus" : "Lanjutkan Belajar"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Browse More Courses CTA */}
              <div className="text-center mt-12">
                <Link href="/courses" className="btn-secondary btn-large">
                  Daftar Kursus Baru
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
