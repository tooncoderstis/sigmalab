"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NotificationReadButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    try {
      await fetch(
        `/api/academic/notifications/${notificationId}/read`,
        { method: "POST" }
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="text-teal-600 hover:underline text-xs disabled:opacity-50"
      disabled={busy}
      onClick={mark}
    >
      Tandai dibaca
    </button>
  );
}
