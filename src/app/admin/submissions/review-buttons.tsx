"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewButtons({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReview = async (decision: "APPROVED" | "REJECTED") => {
    setLoading(true);

    await fetch("/api/submission/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, decision, feedback }),
    });

    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-4">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Feedback untuk learner (opsional)"
        rows={2}
        className="w-full border rounded px-3 py-2 mb-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleReview("APPROVED")}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => handleReview("REJECTED")}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}