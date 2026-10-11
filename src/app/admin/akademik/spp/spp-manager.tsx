"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatRupiah, summarizeInvoices } from "@/lib/billing";

type Invoice = {
  id: string;
  studentName: string;
  title: string;
  amount: number;
  status: string;
  dueAt: string | null;
  termName: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf",
  UNPAID: "Belum bayar",
  PAID: "Lunas",
  CANCELLED: "Batal",
  EXPIRED: "Kedaluwarsa",
};

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function SppManager({
  students,
  classes,
  invoices,
}: {
  students: { id: string; name: string }[];
  classes: { id: string; label: string }[];
  invoices: Invoice[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [title, setTitle] = useState("SPP Bulanan");
  const [amount, setAmount] = useState("250000");
  const [dueAt, setDueAt] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = summarizeInvoices(invoices);

  async function send(url: string, method: string, payload?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
    return data;
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  function base() {
    return {
      title: title.trim() || "SPP",
      amount: Number(amount) || 0,
      dueAt: dueAt ? new Date(`${dueAt}T00:00:00.000Z`).toISOString() : undefined,
    };
  }

  async function createOne() {
    if (!studentId || !title.trim()) {
      setError("Siswa dan judul wajib.");
      return;
    }
    await run(() =>
      send("/api/academic/invoices", "POST", { studentId, ...base() })
    );
  }

  async function generateClass() {
    if (!classId) {
      setError("Pilih kelas.");
      return;
    }
    await run(() =>
      send("/api/academic/invoices/generate", "POST", { classId, ...base() })
    );
  }

  async function setStatus(invoice: Invoice, status: string) {
    await run(() =>
      send(`/api/academic/invoices/${invoice.id}`, "PATCH", { status })
    );
  }

  async function remove(invoice: Invoice) {
    await run(() => send(`/api/academic/invoices/${invoice.id}`, "DELETE"));
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-bold">Terbitkan Tagihan</h2>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Judul tagihan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className={inputClass}
            type="number"
            min="0"
            placeholder="Nominal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="date"
            className={inputClass}
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="block text-sm font-medium">Tagih per siswa</span>
            <select
              className={inputClass}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary" disabled={busy} onClick={createOne}>
            Terbitkan
          </button>
          <label className="space-y-1">
            <span className="block text-sm font-medium">Atau generate per kelas</span>
            <select
              className={inputClass}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.length === 0 && <option value="">— belum ada kelas —</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn-secondary"
            disabled={busy || classes.length === 0}
            onClick={generateClass}
          >
            Generate Kelas
          </button>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">Daftar Tagihan</h2>
          <p className="text-sm text-gray-500">
            {summary.count} tagihan · lunas {formatRupiah(summary.paidAmount)} ·
            belum {formatRupiah(summary.unpaidAmount)}
          </p>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada tagihan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Siswa</th>
                  <th className="py-2 pr-4">Tagihan</th>
                  <th className="py-2 pr-4">Nominal</th>
                  <th className="py-2 pr-4">Jatuh tempo</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 pr-4">{inv.studentName}</td>
                    <td className="py-2 pr-4">{inv.title}</td>
                    <td className="py-2 pr-4">{formatRupiah(inv.amount)}</td>
                    <td className="py-2 pr-4">
                      {inv.dueAt
                        ? new Date(inv.dueAt).toLocaleDateString("id-ID")
                        : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          inv.status === "PAID" ? "text-green-600" : "text-gray-600"
                        }
                      >
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-3">
                        {inv.status === "UNPAID" && (
                          <button
                            className="text-teal-600 hover:underline text-xs disabled:opacity-50"
                            disabled={busy}
                            onClick={() => setStatus(inv, "PAID")}
                          >
                            Lunas
                          </button>
                        )}
                        {inv.status !== "CANCELLED" && (
                          <button
                            className="text-amber-600 hover:underline text-xs disabled:opacity-50"
                            disabled={busy}
                            onClick={() => setStatus(inv, "CANCELLED")}
                          >
                            Batal
                          </button>
                        )}
                        <button
                          className="text-red-600 hover:underline text-xs disabled:opacity-50"
                          disabled={busy}
                          onClick={() => remove(inv)}
                        >
                          Hapus
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
