import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import { roleValues } from "@/lib/validation";
import ActivityManager from "./activity-manager";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEACHER: "Guru",
  STUDENT: "Siswa",
  GUARDIAN: "Wali Murid",
  STAFF: "Staf",
  LEARNER: "Peserta",
  REVIEWER: "Reviewer",
};

export default async function AdminKegiatanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [classes, programs, activities] = await Promise.all([
    prisma.academicClass.findMany({
      select: { id: true, name: true, term: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.program.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.schoolActivity.findMany({
      include: { targets: true },
      orderBy: { startAt: "desc" },
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
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Kegiatan Sekolah</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola agenda dan kegiatan sekolah.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <ActivityManager
            options={{
              roles: roleValues.map((r) => ({ value: r, label: ROLE_LABEL[r] ?? r })),
              classes: classes.map((c) => ({
                value: c.id,
                label: `${c.name}${c.term ? ` (${c.term.name})` : ""}`,
              })),
              programs: programs.map((p) => ({ value: p.id, label: p.name })),
            }}
            activities={activities.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              startAt: a.startAt.toISOString(),
              endAt: a.endAt ? a.endAt.toISOString() : null,
              location: a.location,
              category: a.category,
              audienceAll: a.audienceAll,
              targets: a.targets.map((t) => ({
                role: t.role ?? undefined,
                classId: t.classId ?? undefined,
                programId: t.programId ?? undefined,
              })),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
