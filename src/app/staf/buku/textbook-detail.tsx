"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatFileSize, MAX_ASSIGNMENT_FILE_BYTES } from "@/lib/assignment-file";

type CopyLoan = { id: string; studentName: string };
type Copy = {
  id: string;
  code: string;
  status: string;
  conditionNote: string | null;
  loans: CopyLoan[];
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Tersedia",
  LENT: "Dipinjam",
  LOST: "Hilang",
  DAMAGED: "Rusak",
  RETIRED: "Ditarik",
};

export default function TextbookDetail({
  textbookId,
  fileName,
  copies,
  students,
}: {
  textbookId: string;
  fileName: string | null;
  copies: Copy[];
  students: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function send(url: string, method: string, payload?: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
    return data;
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function addCopy() {
    if (!code.trim()) {
      setError("Kode eksemplar wajib.");
      return;
    }
    await run(async () => {
      await send(`/api/academic/textbooks/${textbookId}/copies`, "POST", {
        code: code.trim(),
      });
      setCode("");
    });
  }

  async function removeCopy(copyId: string) {
    await run(() => send(`/api/academic/textbook-copies/${copyId}`, "DELETE"));
  }

  async function distribute(copyId: string) {
    if (!studentId) {
      setError("Pilih siswa.");
      return;
    }
    await run(() =>
      send("/api/academic/textbook-distributions", "POST", { copyId, studentId })
    );
  }

  async function finishLoan(distributionId: string, status: "RETURNED" | "LOST") {
    await run(() =>
      send(`/api/academic/textbook-distributions/${distributionId}`, "PATCH", {
        status,
      })
    );
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/academic/uploads/textbook/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          textbookId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const presign = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        throw new Error(presign.error ?? `Gagal menyiapkan unggahan (${presignRes.status})`);
      }
      const put = await fetch(presign.data.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Gagal mengunggah ke penyimpanan.");
      await send(`/api/academic/textbooks/${textbookId}`, "PATCH", {
        fileKey: presign.data.key,
        fileName: file.name,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3 space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm w-40"
          placeholder="Kode eksemplar (mis. B01)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className="btn-secondary btn-small"
          disabled={busy}
          onClick={addCopy}
        >
          Tambah Eksemplar
        </button>
        <label className="text-xs text-gray-500 inline-flex items-center gap-2">
          <span>E-book:</span>
          <input
            type="file"
            className="text-xs"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
          {fileName ? (
            <span className="text-teal-600">{fileName}</span>
          ) : (
            <span className="text-gray-400">belum ada</span>
          )}
        </label>
        <span className="text-[10px] text-gray-400">
          maks {formatFileSize(MAX_ASSIGNMENT_FILE_BYTES)}
        </span>
      </div>

      {copies.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada eksemplar.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {copies.map((copy) => {
            const loan = copy.loans[0];
            return (
              <li
                key={copy.id}
                className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  <span className="font-medium">{copy.code}</span> ·{" "}
                  {STATUS_LABEL[copy.status] ?? copy.status}
                  {loan ? ` · dipinjam: ${loan.studentName}` : ""}
                </span>
                <span className="flex items-center gap-3">
                  {copy.status === "AVAILABLE" && (
                    <>
                      <select
                        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="text-teal-600 hover:underline text-xs disabled:opacity-50"
                        disabled={busy}
                        onClick={() => distribute(copy.id)}
                      >
                        Distribusikan
                      </button>
                    </>
                  )}
                  {loan && (
                    <>
                      <button
                        className="text-teal-600 hover:underline text-xs disabled:opacity-50"
                        disabled={busy}
                        onClick={() => finishLoan(loan.id, "RETURNED")}
                      >
                        Kembalikan
                      </button>
                      <button
                        className="text-amber-600 hover:underline text-xs disabled:opacity-50"
                        disabled={busy}
                        onClick={() => finishLoan(loan.id, "LOST")}
                      >
                        Hilang
                      </button>
                    </>
                  )}
                  <button
                    className="text-red-600 hover:underline text-xs disabled:opacity-50"
                    disabled={busy}
                    onClick={() => removeCopy(copy.id)}
                  >
                    Hapus
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
