import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { userHasRole } from "@/lib/rbac";
import { formatRupiah, summarizeInvoices } from "@/lib/billing";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default async function AdminAnalitikPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!userHasRole(session.user, "ADMIN", "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  const [
    students,
    teachers,
    classes,
    subjects,
    attendanceTotal,
    attendancePresent,
    entries,
    invoices,
    libraryBooks,
    activeLoans,
    textbooks,
    activeDistributions,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.academicClass.count(),
    prisma.subject.count(),
    prisma.attendanceRecord.count(),
    prisma.attendanceRecord.count({ where: { status: "PRESENT" } }),
    prisma.reportCardEntry.findMany({ select: { finalScore: true } }),
    prisma.invoice.findMany({ select: { status: true, amount: true } }),
    prisma.libraryBook.count(),
    prisma.bookLoan.count({ where: { status: { in: ["LENT", "OVERDUE"] } } }),
    prisma.textbook.count(),
    prisma.textbookDistribution.count({ where: { status: "LENT" } }),
  ]);

  const attendanceRate =
    attendanceTotal > 0
      ? Math.round((attendancePresent / attendanceTotal) * 1000) / 10
      : 0;
  const avgScore =
    entries.length > 0
      ? Math.round(
          (entries.reduce((sum, e) => sum + e.finalScore, 0) / entries.length) * 10
        ) / 10
      : 0;
  const invoiceSummary = summarizeInvoices(invoices);

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
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Analitik</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ringkasan operasional instansi.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-3">Akademik</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Siswa" value={String(students)} />
              <Stat label="Guru" value={String(teachers)} />
              <Stat label="Kelas" value={String(classes)} />
              <Stat label="Mapel" value={String(subjects)} />
              <Stat label="Kehadiran" value={`${attendanceRate}%`} />
              <Stat label="Rata-rata nilai" value={String(avgScore)} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3">Keuangan (SPP)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Jumlah tagihan" value={String(invoiceSummary.count)} />
              <Stat label="Total tagihan" value={formatRupiah(invoiceSummary.totalAmount)} />
              <Stat label="Terbayar" value={formatRupiah(invoiceSummary.paidAmount)} />
              <Stat
                label="Belum terbayar"
                value={formatRupiah(invoiceSummary.unpaidAmount)}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3">Perpustakaan & Buku</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Buku perpustakaan" value={String(libraryBooks)} />
              <Stat label="Peminjaman aktif" value={String(activeLoans)} />
              <Stat label="Judul buku ajar" value={String(textbooks)} />
              <Stat label="Distribusi aktif" value={String(activeDistributions)} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
