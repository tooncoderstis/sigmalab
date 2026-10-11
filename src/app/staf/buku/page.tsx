import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import TextbookManager from "./textbook-manager";

export default async function StafBukuPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STAFF", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [subjects, programs, students, textbooks] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.program.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { studentProfile: { isNot: null } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 1000,
    }),
    prisma.textbook.findMany({
      include: {
        subject: { select: { name: true } },
        program: { select: { name: true } },
        copies: {
          include: {
            distributions: {
              where: { status: "LENT" },
              include: { student: { select: { id: true, name: true } } },
            },
          },
          orderBy: { code: "asc" },
        },
      },
      orderBy: { title: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/staf" className="text-sm text-teal-600 hover:underline">
            ← Ruang Staf
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Buku Ajar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola katalog buku, eksemplar, dan distribusi.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <TextbookManager
            subjects={subjects.map((s) => ({ value: s.id, label: s.name }))}
            programs={programs.map((p) => ({ value: p.id, label: p.name }))}
            students={students}
            textbooks={textbooks.map((b) => ({
              id: b.id,
              title: b.title,
              author: b.author,
              publisher: b.publisher,
              isbn: b.isbn,
              gradeLevel: b.gradeLevel,
              description: b.description,
              subjectName: b.subject?.name ?? null,
              programName: b.program?.name ?? null,
              fileName: b.fileName,
              copies: b.copies.map((c) => ({
                id: c.id,
                code: c.code,
                status: c.status,
                conditionNote: c.conditionNote,
                loans: c.distributions.map((d) => ({
                  id: d.id,
                  studentName: d.student.name,
                })),
              })),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
