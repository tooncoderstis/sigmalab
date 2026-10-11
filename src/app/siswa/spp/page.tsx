import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import { formatRupiah, isInvoiceOverdue } from "@/lib/billing";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf",
  UNPAID: "Belum bayar",
  PAID: "Lunas",
  CANCELLED: "Batal",
  EXPIRED: "Kedaluwarsa",
};

export default async function SiswaSppPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STUDENT", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const invoices = await prisma.invoice.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/siswa" className="text-sm text-teal-600 hover:underline">
            ← Ruang Siswa
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">SPP / Tagihan</h1>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <div className="card p-6">
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada tagihan.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoices.map((inv) => {
                  const overdue = isInvoiceOverdue(inv.status, inv.dueAt);
                  return (
                    <li
                      key={inv.id}
                      className="py-3 flex justify-between items-center gap-4 text-sm"
                    >
                      <div>
                        <p className="font-medium">{inv.title}</p>
                        <p className="text-gray-500">
                          {formatRupiah(inv.amount)}
                          {inv.dueAt
                            ? ` · jatuh tempo ${new Date(inv.dueAt).toLocaleDateString("id-ID")}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={
                          inv.status === "PAID"
                            ? "text-green-600 font-medium"
                            : overdue
                              ? "text-red-600 font-medium"
                              : "text-gray-600 font-medium"
                        }
                      >
                        {overdue && inv.status === "UNPAID"
                          ? "Terlambat"
                          : (STATUS_LABEL[inv.status] ?? inv.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
