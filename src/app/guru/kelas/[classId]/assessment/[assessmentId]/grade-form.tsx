"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  name: string;
  score: string;
  feedback: string;
};

type Submission = {
  id: string;
  studentId: string;
  fileName: string;
  status: string;
};

export default function GradeForm({
  assessmentId,
  maxScore,
  published,
  roster,
  submissions,
}: {
  assessmentId: string;
  maxScore: number;
  published: boolean;
  roster: Row[];
  submissions: Submission[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(roster);
  const [isPublished, setIsPublished] = useState(published);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submissionByStudent = new Map(submissions.map((s) => [s.studentId, s]));

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  async function submitGrades() {
    const grades = rows
      .filter((row) => row.score.trim() !== "")
      .map((row) => ({
        studentId: row.id,
        score: Number(row.score),
        feedback: row.feedback || undefined,
      }));

    if (grades.length === 0) {
      setError("Isi minimal satu nilai.");
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/academic/assessments/${assessmentId}/grades`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ grades }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Gagal (${res.status})`);
      }
      setMessage("Nilai tersimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/academic/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ published: !isPublished }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Gagal (${res.status})`);
      }
      setIsPublished((v) => !v);
      setMessage(!isPublished ? "Nilai diterbitkan." : "Nilai disembunyikan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function download(submissionId: string) {
    setError(null);
    try {
      const res = await fetch("/api/academic/uploads/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      window.open(data.data.url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
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
              <th className="py-2 pr-4">Nilai (maks {maxScore})</th>
              <th className="py-2 pr-4">Umpan balik</th>
              <th className="py-2">Berkas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const submission = submissionByStudent.get(row.id);
              return (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-4 font-medium">{row.name}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                      value={row.score}
                      onChange={(e) => update(row.id, { score: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                      value={row.feedback}
                      onChange={(e) => update(row.id, { feedback: e.target.value })}
                    />
                  </td>
                  <td className="py-2">
                    {submission ? (
                      <button
                        type="button"
                        className="text-teal-600 hover:underline"
                        onClick={() => download(submission.id)}
                      >
                        {submission.fileName}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy} onClick={submitGrades}>
          Simpan Nilai
        </button>
        <button
          className="btn-secondary"
          disabled={busy}
          onClick={togglePublish}
        >
          {isPublished ? "Sembunyikan Nilai" : "Terbitkan Nilai"}
        </button>
        <span className="text-xs text-gray-500">
          {isPublished
            ? "Nilai terlihat oleh siswa & wali."
            : "Nilai masih disembunyikan dari siswa & wali."}
        </span>
      </div>
    </div>
  );
}
