import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import SppManager from "./spp-manager";

export default async function AdminSppPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [students, classes, invoices] = await Promise.all([
    prisma.user.findMany({
      where: { studentProfile: { isNot: null } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 2000,
    }),
    prisma.academicClass.findMany({
      select: { id: true, name: true, term: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.invoice.findMany({
      include: {
        student: { select: { name: true } },
        term: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
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
          <h1 className="text-2xl md:text-3xl font-bold mt-2">SPP / Tagihan</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Terbitkan dan kelola tagihan siswa.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <SppManager
            students={students}
            classes={classes.map((c) => ({
              id: c.id,
              label: `${c.name}${c.term ? ` (${c.term.name})` : ""}`,
            }))}
            invoices={invoices.map((inv) => ({
              id: inv.id,
              studentName: inv.student.name,
              title: inv.title,
              amount: inv.amount,
              status: inv.status,
              dueAt: inv.dueAt ? inv.dueAt.toISOString() : null,
              termName: inv.term?.name ?? null,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
