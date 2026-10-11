import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

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
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Audit Trail</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Jejak perubahan penting pada sistem.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <div className="card p-6">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada catatan audit.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 pr-4">Waktu</th>
                      <th className="py-2 pr-4">Aktor</th>
                      <th className="py-2 pr-4">Aksi</th>
                      <th className="py-2 pr-4">Entitas</th>
                      <th className="py-2">Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 pr-4">{log.actor?.name ?? "sistem"}</td>
                        <td className="py-2 pr-4">{log.action}</td>
                        <td className="py-2 pr-4">
                          {log.entity}
                          {log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}
                        </td>
                        <td className="py-2 text-gray-500">
                          {log.metadata ? JSON.stringify(log.metadata) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
