import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import { roleValues } from "@/lib/validation";
import AnnouncementManager from "./announcement-manager";

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

export default async function AdminPengumumanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [classes, programs, announcements] = await Promise.all([
    prisma.academicClass.findMany({
      select: { id: true, name: true, term: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.program.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.announcement.findMany({
      include: { targets: true, _count: { select: { reads: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
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
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Pengumuman</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Buat dan atur pengumuman untuk warga sekolah.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <AnnouncementManager
            options={{
              roles: roleValues.map((r) => ({ value: r, label: ROLE_LABEL[r] ?? r })),
              classes: classes.map((c) => ({
                value: c.id,
                label: `${c.name}${c.term ? ` (${c.term.name})` : ""}`,
              })),
              programs: programs.map((p) => ({ value: p.id, label: p.name })),
            }}
            announcements={announcements.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              status: a.status,
              pinned: a.pinned,
              audienceAll: a.audienceAll,
              targets: a.targets.map((t) => ({
                role: t.role ?? undefined,
                classId: t.classId ?? undefined,
                programId: t.programId ?? undefined,
              })),
              readCount: a._count.reads,
              publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
