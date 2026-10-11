import { auth } from "../../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import GradeForm from "./grade-form";

const TYPE_LABEL: Record<string, string> = {
  TUGAS: "Tugas",
  ULANGAN: "Ulangan",
  UTS: "UTS",
  UAS: "UAS",
  PRAKTIK: "Praktik",
  PROYEK: "Proyek",
};

export default async function GuruAssessmentDetailPage({
  params,
}: {
  params: Promise<{ classId: string; assessmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "TEACHER", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const { classId, assessmentId } = await params;
  const userId = session.user.id;
  const isManager = userHasRole(session.user, "ADMIN", "SUPER_ADMIN");

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      subject: { select: { name: true } },
      grades: true,
      submissions: {
        select: {
          id: true,
          studentId: true,
          fileName: true,
          status: true,
        },
      },
      class: {
        include: {
          assignments: { where: { teacherId: userId }, select: { id: true } },
          enrollments: {
            orderBy: { enrolledAt: "asc" },
            include: { student: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!assessment) notFound();

  const canAccess =
    isManager ||
    assessment.class.homeroomTeacherId === userId ||
    assessment.class.assignments.length > 0;
  if (!canAccess) redirect("/guru");

  const gradeByStudent = new Map(
    assessment.grades.map((g) => [g.studentId, g])
  );

  const roster = assessment.class.enrollments.map((e) => {
    const grade = gradeByStudent.get(e.student.id);
    return {
      id: e.student.id,
      name: e.student.name,
      score: grade ? String(grade.score) : "",
      feedback: grade?.feedback ?? "",
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link
            href={`/guru/kelas/${classId}/assessment`}
            className="text-sm text-teal-600 hover:underline"
          >
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">
            {assessment.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {TYPE_LABEL[assessment.type] ?? assessment.type} ·{" "}
            {assessment.subject?.name ?? "Tanpa mapel"} · {assessment.class.name}
            {assessment.dueAt
              ? ` · tenggat ${new Date(assessment.dueAt).toLocaleDateString("id-ID")}`
              : ""}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <GradeForm
            assessmentId={assessment.id}
            maxScore={assessment.maxScore}
            published={assessment.published}
            roster={roster}
            submissions={assessment.submissions}
          />
        </div>
      </section>
    </div>
  );
}
