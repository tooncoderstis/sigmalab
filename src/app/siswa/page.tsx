import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  SICK: "Sakit",
  EXCUSED: "Izin",
  ABSENT: "Alpa",
};

export default async function SiswaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STUDENT", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  const [enrollments, records] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: { studentId: userId },
      include: {
        class: {
          include: {
            program: true,
            term: { include: { academicYear: true } },
          },
        },
      },
      orderBy: { enrolledAt: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId: userId },
      include: { session: { include: { class: true } } },
      orderBy: { markedAt: "desc" },
      take: 50,
    }),
  ]);

  const summary = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Ruang Siswa
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Halo, {session.user.name}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Kelas Saya</h2>
              {enrollments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Belum terdaftar di kelas akademik.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {enrollments.map((e) => (
                    <li key={e.id} className="py-3">
                      <p className="font-medium">{e.class.name}</p>
                      <p className="text-sm text-gray-500">
                        {e.class.program.name} · {e.class.term.academicYear.name} —{" "}
                        {e.class.term.name}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Riwayat Presensi</h2>
              {records.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada presensi.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="py-2 flex justify-between items-center text-sm"
                    >
                      <span>
                        {r.session.class.name} ·{" "}
                        {new Date(r.session.date).toLocaleDateString("id-ID")}
                      </span>
                      <span className="font-medium">
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-6 h-fit">
            <h2 className="text-lg font-bold mb-4">Ringkasan Kehadiran</h2>
            <ul className="space-y-2 text-sm">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <li key={key} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-semibold">{summary[key] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
