import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";

const STATUS_LABEL: Record<string, string> = {
  LENT: "Dipinjam",
  RETURNED: "Dikembalikan",
  LOST: "Hilang",
};

export default async function SiswaBukuPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STUDENT", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  const classIds = (
    await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      select: { classId: true },
    })
  ).map((e) => e.classId);

  const [loans, plans] = await Promise.all([
    prisma.textbookDistribution.findMany({
      where: { studentId: userId },
      include: { copy: { include: { textbook: { select: { title: true } } } } },
      orderBy: { distributedAt: "desc" },
    }),
    classIds.length
      ? prisma.lessonPlan.findMany({
          where: { classId: { in: classIds }, status: "PUBLISHED" },
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
          orderBy: [{ class: { name: "asc" } }, { meetingNo: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/siswa" className="text-sm text-teal-600 hover:underline">
            ← Ruang Siswa
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Buku &amp; RPP</h1>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Buku Saya</h2>
            {loans.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada buku dipinjam.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {loans.map((loan) => (
                  <li
                    key={loan.id}
                    className="py-2 flex justify-between items-center text-sm"
                  >
                    <span>
                      {loan.copy.textbook.title}{" "}
                      <span className="text-gray-400">({loan.copy.code})</span>
                    </span>
                    <span className="font-medium">
                      {STATUS_LABEL[loan.status] ?? loan.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">RPP Terbit</h2>
            {plans.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada RPP terbit.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {plans.map((plan) => (
                  <li key={plan.id} className="py-2 text-sm">
                    <p className="font-medium">
                      {plan.class.name}
                      {plan.subject ? ` · ${plan.subject.name}` : ""} —
                      Pertemuan {plan.meetingNo}
                    </p>
                    <p className="text-gray-500">{plan.title}</p>
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
