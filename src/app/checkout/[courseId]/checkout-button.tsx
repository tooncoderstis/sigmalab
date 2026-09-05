"use client";

import { useState } from "react";

export default function CheckoutButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal membuat pembayaran");
      setLoading(false);
      return;
    }

    window.location.href = data.paymentLinkUrl;
  };

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Bayar Sekarang"}
      </button>
    </div>
  );
}