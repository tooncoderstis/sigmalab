"use client";

import { useState } from "react";

export default function FileDownloadButton({
  submissionId,
  label = "Unduh",
}: {
  submissionId: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="text-teal-600 hover:underline text-sm disabled:opacity-50"
        disabled={busy}
        onClick={download}
      >
        {busy ? "Menyiapkan..." : label}
      </button>
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </span>
  );
}
