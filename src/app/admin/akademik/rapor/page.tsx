import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import ReportCardManager from "./report-card-manager";

export default async function AdminRaporPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [terms, students, reportCards] = await Promise.all([
    prisma.term.findMany({
      include: { academicYear: true },
      orderBy: [{ academicYearId: "desc" }, { name: "asc" }],
    }),
    prisma.user.findMany({
      where: { studentProfile: { isNot: null } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.reportCard.findMany({
      include: {
        student: { select: { name: true } },
        term: { include: { academicYear: true } },
      },
      orderBy: { generatedAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link
            href="/admin/akademik"
            className="text-sm text-teal-600 hover:underline"
          >
            ← Manajemen Akademik
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Rapor</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hasilkan, tinjau, dan terbitkan rapor siswa per term.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          {students.length === 0 ? (
            <div className="card p-6">
              <p className="text-sm text-gray-500">
                Belum ada siswa. Tambahkan siswa terlebih dahulu di Manajemen
                Akademik.
              </p>
            </div>
          ) : (
            <ReportCardManager
              terms={terms.map((t) => ({
                id: t.id,
                name: t.name,
                year: t.academicYear.name,
              }))}
              students={students}
              reportCards={reportCards.map((rc) => ({
                id: rc.id,
                studentName: rc.student.name,
                termLabel: `${rc.term.academicYear.name} — ${rc.term.name}`,
                status: rc.status,
              }))}
            />
          )}
        </div>
      </section>
    </div>
  );
}
