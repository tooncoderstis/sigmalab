"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AudienceEditor, {
  type AudienceValue,
  targetLabel,
  type Target,
} from "@/components/audience-editor";

type Option = { value: string; label: string };

type Activity = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  category: string | null;
  audienceAll: boolean;
  targets: Target[];
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function ActivityManager({
  options,
  activities,
}: {
  options: { roles: Option[]; classes: Option[]; programs: Option[] };
  activities: Activity[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState<AudienceValue>({
    audienceAll: true,
    targets: [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStartAt("");
    setEndAt("");
    setLocation("");
    setCategory("");
    setAudience({ audienceAll: true, targets: [] });
  }

  function loadForEdit(a: Activity) {
    setEditingId(a.id);
    setTitle(a.title);
    setDescription(a.description ?? "");
    setStartAt(toLocalInput(a.startAt));
    setEndAt(toLocalInput(a.endAt));
    setLocation(a.location ?? "");
    setCategory(a.category ?? "");
    setAudience({ audienceAll: a.audienceAll, targets: a.targets });
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
    if (!title.trim() || !startAt) {
      setError("Judul dan waktu mulai wajib diisi.");
      return;
    }
    if (!audience.audienceAll && audience.targets.length === 0) {
      setError("Pilih audiens (semua atau minimal satu target).");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      location: location || undefined,
      category: category || undefined,
      audienceAll: audience.audienceAll,
      targets: audience.audienceAll ? [] : audience.targets,
    };

    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await send(`/api/academic/activities/${editingId}`, "PATCH", payload);
      } else {
        await send("/api/academic/activities", "POST", payload);
      }
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Activity) {
    setBusy(true);
    setError(null);
    try {
      await send(`/api/academic/activities/${a.id}`, "DELETE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  const targetOptions = {
    roles: options.roles,
    classes: options.classes,
    programs: options.programs,
  };

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">
          {editingId ? "Ubah Kegiatan" : "Buat Kegiatan"}
        </h2>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <input
          className={`${inputClass} w-full`}
          placeholder="Judul kegiatan"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={`${inputClass} w-full min-h-[80px]`}
          placeholder="Deskripsi (opsional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1">
            <span className="block text-sm font-medium">Mulai</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-sm font-medium">Selesai (opsional)</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-sm font-medium">Lokasi</span>
            <input
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-sm font-medium">Kategori</span>
            <input
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
        </div>
        <AudienceEditor
          value={audience}
          onChange={setAudience}
          options={targetOptions}
        />
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy} onClick={submit}>
            {editingId ? "Simpan Perubahan" : "Simpan"}
          </button>
          {editingId && (
            <button className="btn-secondary" disabled={busy} onClick={resetForm}>
              Batal
            </button>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Daftar Kegiatan</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada kegiatan.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {activities.map((a) => (
              <li key={a.id} className="py-3 flex justify-between gap-4">
                <div className="text-sm">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-gray-500">
                    {new Date(a.startAt).toLocaleString("id-ID")}
                    {a.location ? ` · ${a.location}` : ""}
                    {a.category ? ` · ${a.category}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.audienceAll
                      ? "Semua audiens"
                      : a.targets
                          .map((t) => targetLabel(t, targetOptions))
                          .join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  <button
                    className="text-teal-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => loadForEdit(a)}
                  >
                    Ubah
                  </button>
                  <button
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => remove(a)}
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
