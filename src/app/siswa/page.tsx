import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import { getAnnouncementFeed, getUpcomingActivities } from "@/lib/feeds";
import AnnouncementFeed from "@/components/announcement-feed";

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

  const classIds = (
    await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      select: { classId: true },
    })
  ).map((e) => e.classId);

  const [enrollments, records, assessments, reportCards] = await Promise.all([
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
    classIds.length
      ? prisma.assessment.findMany({
          where: { classId: { in: classIds }, published: true },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            grades: { where: { studentId: userId }, select: { score: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.reportCard.findMany({
      where: { studentId: userId, status: "PUBLISHED" },
      include: { term: { include: { academicYear: true } } },
      orderBy: { generatedAt: "desc" },
    }),
  ]);

  const summary = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const feedUser = {
    id: userId,
    role: session.user.role,
    roles: session.user.roles ?? [],
  };
  const [feed, activities] = await Promise.all([
    getAnnouncementFeed(feedUser),
    getUpcomingActivities(feedUser),
  ]);

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
              <h2 className="text-lg font-bold mb-4">Pengumuman</h2>
              <AnnouncementFeed announcements={feed} />
            </div>

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

            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Tugas &amp; Nilai</h2>
              {assessments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Belum ada tugas atau nilai yang dipublikasikan.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {assessments.map((a) => (
                    <li
                      key={a.id}
                      className="py-3 flex justify-between items-center gap-4 text-sm"
                    >
                      <div>
                        <Link
                          href={`/siswa/tugas/${a.id}`}
                          className="font-medium text-teal-600 hover:underline"
                        >
                          {a.title}
                        </Link>
                        <p className="text-gray-500">
                          {a.class.name} · {a.subject?.name ?? "Tanpa mapel"}
                        </p>
                      </div>
                      <span className="font-semibold shrink-0">
                        {a.grades[0] ? `${a.grades[0].score} / ${a.maxScore}` : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-6">
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

            <div className="card p-6 h-fit">
              <h2 className="text-lg font-bold mb-4">Kegiatan Mendatang</h2>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada kegiatan.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {activities.map((act) => (
                    <li key={act.id}>
                      <p className="font-medium">{act.title}</p>
                      <p className="text-gray-500">
                        {new Date(act.startAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {act.location ? ` · ${act.location}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-6 h-fit">
              <h2 className="text-lg font-bold mb-2">Buku &amp; RPP</h2>
              <Link
                href="/siswa/buku"
                className="text-teal-600 hover:underline text-sm"
              >
                Lihat buku &amp; RPP →
              </Link>
            </div>

            <div className="card p-6 h-fit">
              <h2 className="text-lg font-bold mb-2">SPP / Tagihan</h2>
              <Link
                href="/siswa/spp"
                className="text-teal-600 hover:underline text-sm"
              >
                Lihat tagihan →
              </Link>
            </div>

            <div className="card p-6 h-fit">
              <h2 className="text-lg font-bold mb-4">Rapor</h2>
              {reportCards.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada rapor terbit.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {reportCards.map((rc) => (
                    <li key={rc.id} className="flex justify-between items-center">
                      <span>
                        {rc.term.academicYear.name} — {rc.term.name}
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
        </div>
      </section>
    </div>
  );
}
