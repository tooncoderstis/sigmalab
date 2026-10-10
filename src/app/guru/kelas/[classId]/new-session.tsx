"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function NewSession({ classId }: { classId: string }) {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState("");
  const [startTime, setStartTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/academic/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId,
          date: new Date(`${date}T00:00:00.000Z`).toISOString(),
          topic: topic || undefined,
          startTime: startTime || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Gagal (${res.status})`);
      }
      setTopic("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6 space-y-4">
      <h2 className="text-lg font-bold">Buat Sesi Baru</h2>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Tanggal</span>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Jam mulai</span>
          <input
            type="time"
            className={inputClass}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label className="space-y-1 flex-1 min-w-[200px]">
          <span className="block text-sm font-medium">Topik</span>
          <input
            className={`${inputClass} w-full`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>
        <button className="btn-primary" disabled={busy} onClick={submit}>
          Buat Sesi
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </section>
  );
}
