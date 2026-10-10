"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  checkInAt: string | null;
  checkOutAt: string | null;
};

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CheckIn({ checkInAt, checkOutAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "check-in" | "check-out") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/academic/teacher-attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Gagal (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm space-y-2">
      <div className="flex gap-4">
        <span>
          Masuk: <strong>{formatTime(checkInAt)}</strong>
        </span>
        <span>
          Keluar: <strong>{formatTime(checkOutAt)}</strong>
        </span>
      </div>
      <div className="flex gap-2">
        <button
          className="btn-primary btn-small"
          disabled={busy || Boolean(checkInAt)}
          onClick={() => submit("check-in")}
        >
          Check-in
        </button>
        <button
          className="btn-secondary btn-small"
          disabled={busy || !checkInAt || Boolean(checkOutAt)}
          onClick={() => submit("check-out")}
        >
          Check-out
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
