"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnrollButton({
  courseId,
  courseSlug,
  firstLessonId,
  isPremium,
  price,
  isLoggedIn,
  alreadyEnrolled,
}: {
  courseId: string;
  courseSlug: string;
  firstLessonId: string | null;
  isPremium: boolean;
  price: number;
  isLoggedIn: boolean;
  alreadyEnrolled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (alreadyEnrolled) {
      if (firstLessonId) {
        router.push(`/learn/${courseSlug}/${firstLessonId}`);
      } else {
        router.push("/dashboard");
      }
      return;
    }

    if (isPremium) {
      router.push(`/checkout/${courseId}`);
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal enroll");
      setLoading(false);
      return;
    }

    if (firstLessonId) {
      router.push(`/learn/${courseSlug}/${firstLessonId}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  let label = "Mulai Belajar Gratis";
  if (isPremium) label = `Beli Kelas — Rp ${price.toLocaleString("id-ID")}`;
  if (alreadyEnrolled) label = "Lanjutkan Belajar";
  if (loading) label = "Memproses...";

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}