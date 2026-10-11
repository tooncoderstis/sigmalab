import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import AdminForms from "./forms";

export default async function AdminAkademikPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [programs, years, terms, classes] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.academicYear.findMany({ orderBy: { name: "desc" } }),
    prisma.term.findMany({
      include: { academicYear: true },
      orderBy: [{ academicYearId: "desc" }, { name: "asc" }],
    }),
    prisma.academicClass.findMany({
      include: {
        program: true,
        term: { include: { academicYear: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Manajemen Akademik
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kelola tahun ajaran, program, kelas, dan pengguna instansi.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href="/admin/akademik/rapor"
              className="btn-secondary btn-small inline-block"
            >
              Rapor &amp; Penilaian
            </Link>
            <Link
              href="/admin/akademik/pengumuman"
              className="btn-secondary btn-small inline-block"
            >
              Pengumuman
            </Link>
            <Link
              href="/admin/akademik/kegiatan"
              className="btn-secondary btn-small inline-block"
            >
              Kegiatan Sekolah
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-10">
          <AdminForms
            programs={programs.map((p) => ({ id: p.id, label: p.name }))}
            years={years.map((y) => ({ id: y.id, label: y.name }))}
            terms={terms.map((t) => ({
              id: t.id,
              label: `${t.academicYear.name} — ${t.name}`,
            }))}
          />

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Daftar Kelas</h2>
            {classes.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada kelas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 pr-4">Kelas</th>
                      <th className="py-2 pr-4">Program</th>
                      <th className="py-2 pr-4">Term</th>
                      <th className="py-2 pr-4">Siswa</th>
                      <th className="py-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((kelas) => (
                      <tr
                        key={kelas.id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-2 pr-4 font-medium">{kelas.name}</td>
                        <td className="py-2 pr-4">{kelas.program.name}</td>
                        <td className="py-2 pr-4">
                          {kelas.term.academicYear.name} — {kelas.term.name}
                        </td>
                        <td className="py-2 pr-4">
                          {kelas._count.enrollments}
                          {kelas.capacity ? ` / ${kelas.capacity}` : ""}
                        </td>
                        <td className="py-2">
                          <Link
                            href={`/admin/akademik/kelas/${kelas.id}`}
                            className="text-teal-600 hover:underline"
                          >
                            Kelola
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
