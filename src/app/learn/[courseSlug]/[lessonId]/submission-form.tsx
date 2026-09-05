"use client";

import { useState } from "react";

type ExistingSubmission = {
  status: string;
  feedback: string | null;
  repoUrl: string | null;
  notes: string | null;
};

export default function SubmissionForm({
  lessonId,
  existingSubmission,
  nextLessonUrl,
  dashboardUrl,
}: {
  lessonId: string;
  existingSubmission: ExistingSubmission | null;
  nextLessonUrl: string | null;
  dashboardUrl: string;
}) {
  const [repoUrl, setRepoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!repoUrl.trim()) {
      setError("Link submission wajib diisi");
      return;
    }

    setError("");
    setLoading(true);

    const res = await fetch("/api/submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, repoUrl, notes }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal submit");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  const status = existingSubmission?.status;

  if (status === "APPROVED") {
    return (
      <div className="bg-green-50 border border-green-200 p-5 rounded-lg">
        <p className="font-semibold text-green-800 mb-1">
          Submission kamu sudah disetujui! 🎉
        </p>
        {existingSubmission?.feedback && (
          <p className="text-sm text-gray-700 mt-2">
            Feedback: {existingSubmission.feedback}
          </p>
        )}
        <a
          href={nextLessonUrl || dashboardUrl}
          className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700"
        >
          {nextLessonUrl ? "Lanjut ke Lesson Berikutnya" : "Kembali ke Dashboard"}
        </a>
      </div>
    );
  }

  if (status === "PENDING" && !submitted) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg">
        <p className="font-medium text-yellow-800">
          Submission kamu sedang menunggu review dari mentor.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Link: {existingSubmission?.repoUrl}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5">
      {status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
          <p className="text-sm font-medium text-red-700">
            Submission sebelumnya ditolak.
          </p>
          {existingSubmission?.feedback && (
            <p className="text-sm text-red-600 mt-1">
              Feedback: {existingSubmission.feedback}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Silakan submit ulang di bawah ini.
          </p>
        </div>
      )}

      {submitted ? (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
          <p className="text-sm text-yellow-800">
            Submission terkirim, menunggu review mentor.
          </p>
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium mb-1">
            Link Repo / Google Drive
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium mb-1">
            Catatan (opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Submission"}
          </button>
        </>
      )}
    </div>
  );
}