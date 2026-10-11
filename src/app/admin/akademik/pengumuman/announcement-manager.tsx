"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AudienceEditor, {
  type AudienceValue,
  targetLabel,
  type Target,
} from "@/components/audience-editor";

type Option = { value: string; label: string };

type Announcement = {
  id: string;
  title: string;
  body: string;
  status: string;
  pinned: boolean;
  audienceAll: boolean;
  targets: Target[];
  readCount: number;
  publishedAt: string | null;
};

export default function AnnouncementManager({
  options,
  announcements,
}: {
  options: { roles: Option[]; classes: Option[]; programs: Option[] };
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [audience, setAudience] = useState<AudienceValue>({
    audienceAll: true,
    targets: [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetOptions = {
    roles: options.roles.map((r) => ({ value: r.value, label: r.label })),
    classes: options.classes.map((c) => ({ value: c.value, label: c.label })),
    programs: options.programs.map((p) => ({ value: p.value, label: p.label })),
  };

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

  async function create() {
    if (!title.trim() || !body.trim()) {
      setError("Judul dan isi wajib diisi.");
      return;
    }
    if (!audience.audienceAll && audience.targets.length === 0) {
      setError("Pilih audiens (semua atau minimal satu target).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await send("/api/academic/announcements", "POST", {
        title: title.trim(),
        body,
        status: publishNow ? "PUBLISHED" : "DRAFT",
        audienceAll: audience.audienceAll,
        targets: audience.audienceAll ? [] : audience.targets,
      });
      setTitle("");
      setBody("");
      setAudience({ audienceAll: true, targets: [] });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(a: Announcement) {
    setBusy(true);
    setError(null);
    try {
      await send(`/api/academic/announcements/${a.id}`, "PATCH", {
        status: a.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function togglePin(a: Announcement) {
    setBusy(true);
    setError(null);
    try {
      await send(`/api/academic/announcements/${a.id}`, "PATCH", {
        pinned: !a.pinned,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Announcement) {
    setBusy(true);
    setError(null);
    try {
      await send(`/api/academic/announcements/${a.id}`, "DELETE");
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
        <h2 className="text-lg font-bold">Buat Pengumuman</h2>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <input
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          placeholder="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[120px]"
          placeholder="Isi pengumuman (mendukung Markdown)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <AudienceEditor
          value={audience}
          onChange={setAudience}
          options={targetOptions}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
          />
          Terbitkan langsung
        </label>
        <button className="btn-primary" disabled={busy} onClick={create}>
          Simpan
        </button>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Daftar Pengumuman</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada pengumuman.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {announcements.map((a) => (
              <li key={a.id} className="py-3 flex justify-between gap-4">
                <div className="text-sm min-w-0">
                  <p className="font-medium">
                    {a.pinned ? "📌 " : ""}
                    {a.title}{" "}
                    <span
                      className={
                        a.status === "PUBLISHED"
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      · {a.status === "PUBLISHED" ? "Terbit" : "Draf"}
                    </span>
                  </p>
                  <p className="text-gray-500">
                    {a.audienceAll
                      ? "Semua audiens"
                      : a.targets.length > 0
                        ? a.targets
                            .map((t) => targetLabel(t, targetOptions))
                            .join(", ")
                        : "Tanpa audiens"}{" "}
                    · dibaca {a.readCount}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  <button
                    className="text-teal-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => togglePin(a)}
                  >
                    {a.pinned ? "Lepas pin" : "Pin"}
                  </button>
                  <button
                    className="text-teal-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => toggleStatus(a)}
                  >
                    {a.status === "PUBLISHED" ? "Tarik" : "Terbitkan"}
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
