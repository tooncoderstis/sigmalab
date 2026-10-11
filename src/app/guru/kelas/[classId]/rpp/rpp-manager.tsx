"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Plan = {
  id: string;
  meetingNo: number;
  title: string;
  objectives: string | null;
  activities: string | null;
  resources: string | null;
  assessment: string | null;
  scheduledDate: string | null;
  status: string;
};

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

function toDateInput(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function RppManager({
  classId,
  plans,
}: {
  classId: string;
  plans: Plan[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [meetingNo, setMeetingNo] = useState(
    String((plans.at(-1)?.meetingNo ?? 0) + 1)
  );
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [activities, setActivities] = useState("");
  const [resources, setResources] = useState("");
  const [assessment, setAssessment] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setEditingId(null);
    setTitle("");
    setObjectives("");
    setActivities("");
    setResources("");
    setAssessment("");
    setScheduledDate("");
    setMeetingNo(String((plans.at(-1)?.meetingNo ?? 0) + 1));
  }

  function load(plan: Plan) {
    setEditingId(plan.id);
    setMeetingNo(String(plan.meetingNo));
    setTitle(plan.title);
    setObjectives(plan.objectives ?? "");
    setActivities(plan.activities ?? "");
    setResources(plan.resources ?? "");
    setAssessment(plan.assessment ?? "");
    setScheduledDate(toDateInput(plan.scheduledDate));
  }

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

  async function submit() {
    if (!title.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    const payload = {
      meetingNo: Number(meetingNo) || 1,
      title: title.trim(),
      objectives: objectives || undefined,
      activities: activities || undefined,
      resources: resources || undefined,
      assessment: assessment || undefined,
      scheduledDate: scheduledDate
        ? new Date(`${scheduledDate}T00:00:00.000Z`).toISOString()
        : undefined,
    };

    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await send(`/api/academic/lesson-plans/${editingId}`, "PATCH", payload);
      } else {
        await send("/api/academic/lesson-plans", "POST", { classId, ...payload });
      }
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(plan: Plan) {
    setBusy(true);
    setError(null);
    try {
      await send(`/api/academic/lesson-plans/${plan.id}`, "PATCH", {
        status: plan.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function remove(plan: Plan) {
    setBusy(true);
    setError(null);
    try {
      await send(`/api/academic/lesson-plans/${plan.id}`, "DELETE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-bold">
          {editingId ? "Ubah RPP" : "Buat RPP"}
        </h2>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1">
            <span className="block text-sm font-medium">Pertemuan</span>
            <input
              type="number"
              min="1"
              className={`${inputClass} w-24`}
              value={meetingNo}
              onChange={(e) => setMeetingNo(e.target.value)}
            />
          </label>
          <label className="space-y-1 flex-1 min-w-[200px]">
            <span className="block text-sm font-medium">Judul / Topik</span>
            <input
              className={`${inputClass} w-full`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-sm font-medium">Jadwal</span>
            <input
              type="date"
              className={inputClass}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ["Tujuan", objectives, setObjectives],
            ["Kegiatan", activities, setActivities],
            ["Sumber/Media", resources, setResources],
            ["Penilaian", assessment, setAssessment],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="space-y-1">
              <span className="block text-sm font-medium">{label as string}</span>
              <textarea
                className={`${inputClass} w-full min-h-[70px]`}
                value={value as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
              />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy} onClick={submit}>
            {editingId ? "Simpan Perubahan" : "Simpan"}
          </button>
          {editingId && (
            <button className="btn-secondary" disabled={busy} onClick={reset}>
              Batal
            </button>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Daftar RPP</h2>
        {plans.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada RPP.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {plans.map((plan) => (
              <li key={plan.id} className="py-3 flex justify-between gap-4">
                <div className="text-sm">
                  <p className="font-medium">
                    Pertemuan {plan.meetingNo}: {plan.title}{" "}
                    <span
                      className={
                        plan.status === "PUBLISHED"
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      · {plan.status === "PUBLISHED" ? "Terbit" : "Draf"}
                    </span>
                  </p>
                  {plan.objectives && (
                    <p className="text-gray-500 line-clamp-2">{plan.objectives}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  <button
                    className="text-teal-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => load(plan)}
                  >
                    Ubah
                  </button>
                  <button
                    className="text-teal-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => toggleStatus(plan)}
                  >
                    {plan.status === "PUBLISHED" ? "Tarik" : "Terbitkan"}
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => remove(plan)}
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
