import { auth } from "../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import ClassManager from "./class-manager";

export default async function AdminClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) redirect("/dashboard");

  const { classId } = await params;

  const [kelas, students, teachers] = await Promise.all([
    prisma.academicClass.findUnique({
      where: { id: classId },
      include: {
        program: true,
        term: { include: { academicYear: true } },
        enrollments: {
          include: { student: { select: { id: true, name: true, email: true } } },
          orderBy: { enrolledAt: "asc" },
        },
        assignments: {
          include: {
            teacher: { select: { id: true, name: true } },
            subject: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { roles: { some: { role: "STUDENT" } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.user.findMany({
      where: { roles: { some: { role: "TEACHER" } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  if (!kelas) notFound();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link
            href="/admin/akademik"
            className="text-sm text-teal-600 hover:underline"
          >
            ← Kembali
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{kelas.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {kelas.program.name} · {kelas.term.academicYear.name} — {kelas.term.name}
            {kelas.capacity ? ` · kapasitas ${kelas.capacity}` : ""}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <ClassManager
            classId={kelas.id}
            students={students}
            teachers={teachers}
            enrolled={kelas.enrollments.map((e) => ({
              id: e.id,
              studentId: e.studentId,
              name: e.student.name,
              email: e.student.email,
            }))}
            assignments={kelas.assignments.map((a) => ({
              id: a.id,
              teacherId: a.teacherId,
              name: a.teacher.name,
              subject: a.subject?.name ?? null,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
