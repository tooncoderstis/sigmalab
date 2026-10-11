import { auth } from "../../../../../../auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import RppManager from "./rpp-manager";

export default async function GuruRppPage({
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

  const plans = await prisma.lessonPlan.findMany({
    where: { classId },
    orderBy: { meetingNo: "asc" },
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
            RPP — {kelas.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {kelas.program.name} · {kelas.term.academicYear.name} — {kelas.term.name}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <RppManager
            classId={kelas.id}
            plans={plans.map((p) => ({
              id: p.id,
              meetingNo: p.meetingNo,
              title: p.title,
              objectives: p.objectives,
              activities: p.activities,
              resources: p.resources,
              assessment: p.assessment,
              scheduledDate: p.scheduledDate ? p.scheduledDate.toISOString() : null,
              status: p.status,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
