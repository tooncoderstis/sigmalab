import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { userHasRole } from "@/lib/rbac";

export default async function StafPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STAFF", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Ruang Staf
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kelola buku ajar &amp; sarana.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/staf/buku" className="card p-6 hover:shadow-lg transition-all">
            <h2 className="font-bold text-lg">Buku Ajar</h2>
            <p className="text-sm text-gray-500 mt-1">
              Katalog buku, eksemplar, dan distribusi ke siswa.
            </p>
          </Link>
          <Link
            href="/staf/perpustakaan"
            className="card p-6 hover:shadow-lg transition-all"
          >
            <h2 className="font-bold text-lg">Perpustakaan</h2>
            <p className="text-sm text-gray-500 mt-1">
              Katalog &amp; sirkulasi peminjaman buku.
            </p>
          </Link>
          <Link
            href="/staf/inventaris"
            className="card p-6 hover:shadow-lg transition-all"
          >
            <h2 className="font-bold text-lg">Inventaris</h2>
            <p className="text-sm text-gray-500 mt-1">
              Stok ATK &amp; sarpras beserta pergerakan.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
