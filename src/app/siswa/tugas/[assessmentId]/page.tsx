import { auth } from "../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import UploadForm from "./upload-form";
import FileDownloadButton from "@/components/file-download-button";

const TYPE_LABEL: Record<string, string> = {
  TUGAS: "Tugas",
  ULANGAN: "Ulangan",
  UTS: "UTS",
  UAS: "UAS",
  PRAKTIK: "Praktik",
  PROYEK: "Proyek",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Terkumpul",
  GRADED: "Sudah dinilai",
  RETURNED: "Dikembalikan",
};

export default async function SiswaTugasPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STUDENT", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const { assessmentId } = await params;
  const userId = session.user.id;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      subject: { select: { name: true } },
      class: {
        select: {
          id: true,
          name: true,
          term: { select: { name: true, academicYear: { select: { name: true } } } },
        },
      },
    },
  });

  if (!assessment) notFound();

  const isManager = userHasRole(session.user, "ADMIN", "SUPER_ADMIN");
  if (!isManager) {
    const enrolled = await prisma.classEnrollment.findFirst({
      where: {
        classId: assessment.classId,
        studentId: userId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!enrolled) redirect("/siswa");
  }

  const [submission, grade] = await Promise.all([
    prisma.assignmentSubmission.findUnique({
      where: {
        assessmentId_studentId: { assessmentId, studentId: userId },
      },
      select: { id: true, fileName: true, status: true, submittedAt: true },
    }),
    prisma.grade.findUnique({
      where: {
        assessmentId_studentId: { assessmentId, studentId: userId },
      },
      select: { score: true, feedback: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/siswa" className="text-sm text-teal-600 hover:underline">
            ← Kembali
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{assessment.title}</h1>
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
        <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {assessment.description && (
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-2">Instruksi</h2>
                <p className="text-sm whitespace-pre-wrap">{assessment.description}</p>
              </div>
            )}

            {submission ? (
              <div className="card p-6 space-y-2">
                <h2 className="text-lg font-bold">Tugas Terkumpul</h2>
                <p className="text-sm">
                  Berkas:{" "}
                  <FileDownloadButton
                    submissionId={submission.id}
                    label={submission.fileName}
                  />
                </p>
                <p className="text-sm text-gray-500">
                  Status: {STATUS_LABEL[submission.status] ?? submission.status} ·{" "}
                  {new Date(submission.submittedAt).toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-500">
                  Kamu dapat mengumpulkan ulang untuk mengganti berkas selama belum
                  dinilai.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada berkas terkumpul.</p>
            )}

            <UploadForm assessmentId={assessment.id} />
          </div>

          <div className="card p-6 h-fit">
            <h2 className="text-lg font-bold mb-4">Nilai</h2>
            {assessment.published && grade ? (
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Skor</span>
                  <span className="font-semibold">
                    {grade.score} / {assessment.maxScore}
                  </span>
                </li>
                {grade.feedback && (
                  <li className="text-gray-600 dark:text-gray-400">
                    Umpan balik: {grade.feedback}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Nilai belum dipublikasikan.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
