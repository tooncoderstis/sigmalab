import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import RoleManager from "./role-manager";

export default async function SuperAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "SUPER_ADMIN")) redirect("/dashboard");

  const [
    userCount,
    programCount,
    classCount,
    sessionCount,
    recordCount,
    users,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.program.count(),
    prisma.academicClass.count(),
    prisma.attendanceSession.count(),
    prisma.attendanceRecord.count(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roles: { select: { role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const stats = [
    { label: "Pengguna", value: userCount },
    { label: "Program", value: programCount },
    { label: "Kelas", value: classCount },
    { label: "Sesi Presensi", value: sessionCount },
    { label: "Catatan Presensi", value: recordCount },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Super Admin
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ringkasan platform & manajemen peran pengguna.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Manajemen Peran</h2>
            <RoleManager
              users={users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                roles: u.roles.map((r) => r.role),
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
