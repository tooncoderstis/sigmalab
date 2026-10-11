import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import FeedSections from "@/components/feed-sections";

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  SICK: "Sakit",
  EXCUSED: "Izin",
  ABSENT: "Alpa",
};

export default async function WaliPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "GUARDIAN", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const guardian = await prisma.guardianProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const studentIds = guardian?.students.map((s) => s.user.id) ?? [];

  const records = studentIds.length
    ? await prisma.attendanceRecord.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          session: { include: { class: true } },
          student: { select: { id: true, name: true } },
        },
        orderBy: { markedAt: "desc" },
        take: 100,
      })
    : [];

  const [assessments, reportCards] = await Promise.all([
    studentIds.length
      ? prisma.assessment.findMany({
          where: {
            published: true,
            class: { enrollments: { some: { studentId: { in: studentIds } } } },
          },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            grades: {
              where: { studentId: { in: studentIds } },
              include: { student: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
    studentIds.length
      ? prisma.reportCard.findMany({
          where: { studentId: { in: studentIds }, status: "PUBLISHED" },
          include: {
            student: { select: { name: true } },
            term: { include: { academicYear: true } },
          },
          orderBy: { generatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Ruang Wali Murid
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pantau kehadiran anak Anda.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-6">
          <FeedSections user={session.user} />
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Anak Terhubung</h2>
            {!guardian || guardian.students.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada siswa yang terhubung ke akun wali ini. Hubungi admin
                instansi.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {guardian.students.map((s) => (
                  <li key={s.id} className="py-2 text-sm">
                    <span className="font-medium">{s.user.name}</span>{" "}
                    <span className="text-gray-400">({s.user.email})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Presensi Terbaru</h2>
            {records.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada data presensi.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {records.map((r) => (
                  <li
                    key={r.id}
                    className="py-2 flex justify-between items-center text-sm"
                  >
                    <span>
                      {r.student.name} · {r.session.class.name} ·{" "}
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

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Nilai Terbaru</h2>
            {assessments.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada nilai terbit.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {assessments.flatMap((a) =>
                  a.grades.length === 0
                    ? [
                        <li key={a.id} className="py-2 text-sm text-gray-500">
                          {a.class.name} · {a.subject?.name ?? "Tanpa mapel"} —{" "}
                          {a.title}: belum ada nilai
                        </li>,
                      ]
                    : a.grades.map((g) => (
                        <li
                          key={`${a.id}-${g.id}`}
                          className="py-2 flex justify-between items-center text-sm"
                        >
                          <span>
                            {g.student.name} · {a.class.name} · {a.title}
                          </span>
                          <span className="font-medium">
                            {g.score} / {a.maxScore}
                          </span>
                        </li>
                      ))
                )}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Rapor</h2>
            {reportCards.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada rapor terbit.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportCards.map((rc) => (
                  <li
                    key={rc.id}
                    className="py-2 flex justify-between items-center text-sm"
                  >
                    <span>
                      {rc.student.name} · {rc.term.academicYear.name} —{" "}
                      {rc.term.name}
                    </span>
                    <a
                      href={`/api/academic/report-cards/${rc.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 hover:underline"
                    >
                      Unduh
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
