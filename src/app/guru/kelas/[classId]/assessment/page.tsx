import { auth } from "../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import NewAssessment from "./new-assessment";

const TYPE_LABEL: Record<string, string> = {
  TUGAS: "Tugas",
  ULANGAN: "Ulangan",
  UTS: "UTS",
  UAS: "UAS",
  PRAKTIK: "Praktik",
  PROYEK: "Proyek",
};

export default async function GuruAssessmentListPage({
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
    },
  });

  if (!kelas) notFound();

  const canAccess =
    isManager || kelas.homeroomTeacherId === userId || kelas.assignments.length > 0;
  if (!canAccess) redirect("/guru");

  const assessments = await prisma.assessment.findMany({
    where: { classId },
    include: {
      subject: { select: { name: true } },
      _count: { select: { grades: true, submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link
            href={`/guru/kelas/${kelas.id}`}
            className="text-sm text-teal-600 hover:underline"
          >
            ← Kembali ke kelas
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">
            Penilaian — {kelas.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {kelas.program.name} · {kelas.term.academicYear.name} — {kelas.term.name}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-8">
          <NewAssessment classId={kelas.id} />

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Daftar Aktivitas</h2>
            {assessments.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada aktivitas.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {assessments.map((a) => (
                  <li
                    key={a.id}
                    className="py-3 flex justify-between items-center gap-4"
                  >
                    <div className="text-sm">
                      <p className="font-medium">
                        <span className="badge-success mr-2">
                          {TYPE_LABEL[a.type] ?? a.type}
                        </span>
                        {a.title}
                      </p>
                      <p className="text-gray-500">
                        {a.subject?.name ?? "Tanpa mapel"} · skor maks {a.maxScore}{" "}
                        · bobot {a.weight} · {a._count.grades} dinilai ·{" "}
                        {a._count.submissions} kumpul
                        {a.published ? " · 📢 nilai terbit" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/guru/kelas/${kelas.id}/assessment/${a.id}`}
                      className="text-teal-600 text-sm hover:underline shrink-0"
                    >
                      Input Nilai
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
