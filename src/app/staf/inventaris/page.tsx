import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import InventoryManager from "./inventory-manager";

export default async function StafInventarisPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STAFF", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 500,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/staf" className="text-sm text-teal-600 hover:underline">
            ← Ruang Staf
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">
            Inventaris ATK &amp; Sarpras
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola stok barang dan catat pergerakan.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <InventoryManager
            items={items.map((it) => ({
              id: it.id,
              name: it.name,
              category: it.category,
              unit: it.unit,
              quantity: it.quantity,
              minQuantity: it.minQuantity,
              location: it.location,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
