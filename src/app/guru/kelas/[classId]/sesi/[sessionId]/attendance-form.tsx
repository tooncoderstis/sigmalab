"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  status: string;
  note: string;
};

const STATUSES: { value: string; label: string }[] = [
  { value: "PRESENT", label: "Hadir" },
  { value: "LATE", label: "Terlambat" },
  { value: "SICK", label: "Sakit" },
  { value: "EXCUSED", label: "Izin" },
  { value: "ABSENT", label: "Alpa" },
];

export default function AttendanceForm({
  sessionId,
  roster,
}: {
  sessionId: string;
  roster: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(roster);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  async function submit() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/academic/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          records: rows.map((row) => ({
            studentId: row.id,
            status: row.status,
            note: row.note || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Gagal (${res.status})`);
      }
      setMessage("Presensi tersimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Belum ada siswa terdaftar di kelas ini.
      </p>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      {message && (
        <p className="rounded-lg bg-green-50 text-green-700 px-4 py-2 text-sm">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-2 pr-4 font-medium">{row.name}</td>
                <td className="py-2 pr-4">
                  <select
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                    value={row.status}
                    onChange={(e) => update(row.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <input
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                    value={row.note}
                    onChange={(e) => update(row.id, { note: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn-primary" disabled={busy} onClick={submit}>
        Simpan Presensi
      </button>
    </div>
  );
}
