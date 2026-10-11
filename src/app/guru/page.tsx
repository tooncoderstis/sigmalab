import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import FeedSections from "@/components/feed-sections";
import CheckIn from "./check-in";

function startOfDayUtc(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

export default async function GuruPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "TEACHER", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const userId = session.user.id;
  const today = startOfDayUtc(new Date());

  const [classes, attendance] = await Promise.all([
    prisma.academicClass.findMany({
      where: {
        OR: [
          { homeroomTeacherId: userId },
          { assignments: { some: { teacherId: userId } } },
        ],
      },
      include: {
        program: true,
        term: { include: { academicYear: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: userId, date: today } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Ruang Guru
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Halo, {session.user.name}
            </p>
          </div>
          <CheckIn
            checkInAt={attendance?.checkInAt?.toISOString() ?? null}
            checkOutAt={attendance?.checkOutAt?.toISOString() ?? null}
          />
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <h2 className="text-lg font-bold mb-4">Kelas Saya</h2>
          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Belum ada kelas yang ditugaskan.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((kelas) => (
                <Link
                  key={kelas.id}
                  href={`/guru/kelas/${kelas.id}`}
                  className="card p-6 hover:shadow-lg transition-all"
                >
                  <h3 className="font-bold text-lg">{kelas.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {kelas.program.name} · {kelas.term.academicYear.name} —{" "}
                    {kelas.term.name}
                  </p>
                  <div className="flex gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{kelas._count.enrollments} siswa</span>
                    <span>{kelas._count.sessions} sesi</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-6">
          <FeedSections user={session.user} />
        </div>
      </section>
    </div>
  );
}
