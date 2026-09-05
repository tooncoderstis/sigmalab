"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkCompleteButton({
  lessonId,
  isCompleted,
  nextLessonUrl,
  dashboardUrl,
}: {
  lessonId: string;
  isCompleted: boolean;
  nextLessonUrl: string | null;
  dashboardUrl: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  const handleComplete = async () => {
    setLoading(true);

    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });

    setCompleted(true);
    setLoading(false);

    if (nextLessonUrl) {
      router.push(nextLessonUrl);
      router.refresh();
    } else {
      router.push(dashboardUrl);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="bg-green-600 text-white px-6 py-3 rounded font-medium hover:bg-green-700 disabled:opacity-50"
    >
      {loading
        ? "Menyimpan..."
        : completed
        ? nextLessonUrl
          ? "Lanjut ke Lesson Berikutnya"
          : "Selesai — Kembali ke Dashboard"
        : "Tandai Selesai"}
    </button>
  );
}