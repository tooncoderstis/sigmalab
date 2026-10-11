"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TermOption = { id: string; name: string; year: string };
type StudentOption = { id: string; name: string; email: string };
type ReportRow = {
  id: string;
  studentName: string;
  termLabel: string;
  status: string;
};

export default function ReportCardManager({
  terms,
  students,
  reportCards,
}: {
  terms: TermOption[];
  students: StudentOption[];
  reportCards: ReportRow[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [termId, setTermId] = useState(terms[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!studentId || !termId) {
      setError("Pilih siswa dan term.");
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/academic/report-cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, termId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setMessage("Rapor dihasilkan/diperbarui.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(rc: ReportRow) {
    setBusy(true);
    setError(null);
    try {
      const nextStatus = rc.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await fetch(`/api/academic/report-cards/${rc.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Hasilkan Rapor</h2>
        <p className="text-sm text-gray-500">
          Nilai akhir dihitung dari aktivitas yang sudah dipublikasikan pada term
          terpilih.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="space-y-1">
            <span className="block text-sm font-medium">Siswa</span>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-w-[220px]"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-sm font-medium">Term</span>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.year} — {t.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary" disabled={busy} onClick={generate}>
            Hasilkan
          </button>
        </div>
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Daftar Rapor</h2>
        {reportCards.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada rapor.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {reportCards.map((rc) => (
              <li
                key={rc.id}
                className="py-3 flex justify-between items-center gap-4 text-sm"
              >
                <span>
                  <span className="font-medium">{rc.studentName}</span> ·{" "}
                  {rc.termLabel} ·{" "}
                  <span
                    className={
                      rc.status === "PUBLISHED"
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {rc.status === "PUBLISHED" ? "Terbit" : "Draf"}
                  </span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/api/academic/report-cards/${rc.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 hover:underline"
                  >
                    PDF
                  </a>
                  <button
                    className="text-teal-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => toggle(rc)}
                  >
                    {rc.status === "PUBLISHED" ? "Tarik" : "Terbitkan"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
