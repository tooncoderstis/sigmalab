import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import LibraryManager from "./library-manager";

export default async function StafPerpustakaanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "STAFF", "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [members, books] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 2000,
    }),
    prisma.libraryBook.findMany({
      include: {
        copies: {
          include: {
            loans: {
              where: { status: { in: ["LENT", "OVERDUE"] } },
              include: { member: { select: { id: true, name: true } } },
            },
          },
          orderBy: { code: "asc" },
        },
      },
      orderBy: { title: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <Link href="/staf" className="text-sm text-teal-600 hover:underline">
            ← Ruang Staf
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Perpustakaan</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Katalog buku, eksemplar, dan sirkulasi peminjaman.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <LibraryManager
            members={members}
            books={books.map((b) => ({
              id: b.id,
              title: b.title,
              author: b.author,
              publisher: b.publisher,
              isbn: b.isbn,
              category: b.category,
              copies: b.copies.map((c) => ({
                id: c.id,
                code: c.code,
                status: c.status,
                loans: c.loans.map((l) => ({
                  id: l.id,
                  memberName: l.member.name,
                })),
              })),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
