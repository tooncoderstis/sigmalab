"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  question: string;
  options: unknown;
};

export default function QuizForm({
  quizId,
  lessonId,
  questions,
  passingScore,
  nextLessonUrl,
  dashboardUrl,
}: {
  quizId: string;
  lessonId: string;
  questions: Question[];
  passingScore: number;
  nextLessonUrl: string | null;
  dashboardUrl: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError("Jawab semua soal dulu sebelum submit");
      return;
    }

    setError("");
    setLoading(true);

    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, answers, lessonId }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const handleContinue = () => {
    if (nextLessonUrl) {
      router.push(nextLessonUrl);
      router.refresh();
    } else {
      router.push(dashboardUrl);
    }
  };

  return (
    <div className="space-y-6">
      {questions.map((q, idx) => {
        const options = q.options as string[];
        return (
          <div key={q.id} className="bg-white rounded-lg shadow p-5">
            <p className="font-medium mb-3">
              {idx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {options.map((opt, optIdx) => (
                <label
                  key={optIdx}
                  className={
                    "flex items-center gap-2 p-2 rounded border cursor-pointer " +
                    (answers[q.id] === optIdx
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200")
                  }
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === optIdx}
                    onChange={() => handleSelect(q.id, optIdx)}
                    disabled={!!result}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menghitung..." : "Submit Jawaban"}
        </button>
      ) : (
        <div
          className={
            "p-5 rounded-lg " +
            (result.passed
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200")
          }
        >
          <p className="font-semibold mb-1">
            Skor kamu: {result.score} ({result.correctCount}/{result.total} benar)
          </p>
          <p className="text-sm mb-4">
            {result.passed
              ? "Selamat, kamu lulus!"
              : "Belum lulus, minimal skor " + passingScore + ". Coba lagi."}
          </p>

          {result.passed ? (
            <button
              onClick={handleContinue}
              className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700"
            >
              {nextLessonUrl ? "Lanjut ke Lesson Berikutnya" : "Selesai"}
            </button>
          ) : (
            <button
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded font-medium hover:bg-gray-700"
            >
              Coba Lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
}