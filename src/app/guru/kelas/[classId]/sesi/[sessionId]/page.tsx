import { auth } from "../../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import AttendanceForm from "./attendance-form";

export default async function SessionAttendancePage({
  params,
}: {
  params: Promise<{ classId: string; sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "TEACHER", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const { classId, sessionId } = await params;

  const record = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          enrollments: {
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
            orderBy: { enrolledAt: "asc" },
          },
        },
      },
      records: true,
    },
  });

  if (!record || record.classId !== classId) notFound();

  const statusByStudent = new Map(
    record.records.map((r) => [r.studentId, { status: r.status, note: r.note }])
  );

  const roster = record.class.enrollments.map((e) => ({
    id: e.student.id,
    name: e.student.name,
    email: e.student.email,
    status: statusByStudent.get(e.student.id)?.status ?? "PRESENT",
    note: statusByStudent.get(e.student.id)?.note ?? "",
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link
            href={`/guru/kelas/${classId}`}
            className="text-sm text-teal-600 hover:underline"
          >
            ← Kembali ke kelas
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">
            Presensi {record.class.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(record.date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {record.topic ? ` · ${record.topic}` : ""}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <AttendanceForm sessionId={sessionId} roster={roster} />
        </div>
      </section>
    </div>
  );
}
