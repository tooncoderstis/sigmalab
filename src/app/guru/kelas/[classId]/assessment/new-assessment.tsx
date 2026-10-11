"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

const TYPES = [
  { value: "TUGAS", label: "Tugas" },
  { value: "ULANGAN", label: "Ulangan" },
  { value: "UTS", label: "UTS" },
  { value: "UAS", label: "UAS" },
  { value: "PRAKTIK", label: "Praktik" },
  { value: "PROYEK", label: "Proyek" },
];

export default function NewAssessment({ classId }: { classId: string }) {
  const router = useRouter();
  const [type, setType] = useState("TUGAS");
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [weight, setWeight] = useState("1");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/academic/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId,
          type,
          title: title.trim(),
          maxScore: Number(maxScore) || 100,
          weight: Number(weight) || 1,
          dueAt: dueAt ? new Date(`${dueAt}T00:00:00.000Z`).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Gagal (${res.status})`);
      }
      setTitle("");
      setDueAt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6 space-y-4">
      <h2 className="text-lg font-bold">Buat Aktivitas Penilaian</h2>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Jenis</span>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 flex-1 min-w-[200px]">
          <span className="block text-sm font-medium">Judul</span>
          <input
            className={`${inputClass} w-full`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Skor maks</span>
          <input
            type="number"
            min="1"
            className={`${inputClass} w-24`}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Bobot</span>
          <input
            type="number"
            min="1"
            className={`${inputClass} w-20`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Tenggat</span>
          <input
            type="date"
            className={inputClass}
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </label>
        <button className="btn-primary" disabled={busy} onClick={submit}>
          Buat
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </section>
  );
}
