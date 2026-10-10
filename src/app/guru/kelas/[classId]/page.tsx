import { auth } from "../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import NewSession from "./new-session";

export default async function GuruClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "TEACHER", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const { classId } = await params;
  const userId = session.user.id;
  const isManager = userHasRole(session.user, "ADMIN", "SUPER_ADMIN");

  const kelas = await prisma.academicClass.findUnique({
    where: { id: classId },
    include: {
      program: true,
      term: { include: { academicYear: true } },
      assignments: { where: { teacherId: userId }, select: { id: true } },
      sessions: {
        include: {
          teacher: { select: { name: true } },
          _count: { select: { records: true } },
        },
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });

  if (!kelas) notFound();

  const canAccess =
    isManager ||
    kelas.homeroomTeacherId === userId ||
    kelas.assignments.length > 0;

  if (!canAccess) redirect("/guru");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/guru" className="text-sm text-teal-600 hover:underline">
            ← Kembali
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{kelas.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {kelas.program.name} · {kelas.term.academicYear.name} — {kelas.term.name}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-8">
          <NewSession classId={kelas.id} />

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Sesi Presensi</h2>
            {kelas.sessions.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada sesi.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {kelas.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="py-3 flex justify-between items-center"
                  >
                    <div className="text-sm">
                      <p className="font-medium">
                        {new Date(s.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {s.topic ? ` — ${s.topic}` : ""}
                      </p>
                      <p className="text-gray-500">
                        {s.teacher.name} · {s._count.records} siswa tercatat
                      </p>
                    </div>
                    <Link
                      href={`/guru/kelas/${kelas.id}/sesi/${s.id}`}
                      className="text-teal-600 text-sm hover:underline"
                    >
                      Isi Presensi
                    </Link>
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
