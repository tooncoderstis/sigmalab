"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  assignmentFileAccept,
  assignmentFileTypes,
  MAX_ASSIGNMENT_FILE_BYTES,
  formatFileSize,
} from "@/lib/assignment-file";

export default function UploadForm({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(f: File): string | null {
    if (!(assignmentFileTypes as readonly string[]).includes(f.type)) {
      return "Tipe berkas tidak diizinkan (PDF, Office, gambar, teks, atau ZIP).";
    }
    if (f.size > MAX_ASSIGNMENT_FILE_BYTES) {
      return `Ukuran berkas melebihi ${formatFileSize(MAX_ASSIGNMENT_FILE_BYTES)}.`;
    }
    return null;
  }

  async function submit() {
    if (!file) {
      setError("Pilih berkas terlebih dahulu.");
      return;
    }
    const invalid = validate(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const presignRes = await fetch("/api/academic/uploads/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        throw new Error(presignData.error ?? `Gagal menyiapkan unggahan (${presignRes.status})`);
      }

      const { key, uploadUrl } = presignData.data as {
        key: string;
        uploadUrl: string;
      };

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("Gagal mengunggah berkas ke penyimpanan.");
      }

      const saveRes = await fetch(
        `/api/academic/assessments/${assessmentId}/submissions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fileKey: key,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            notes: notes || undefined,
          }),
        }
      );
      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        throw new Error(saveData.error ?? `Gagal menyimpan tugas (${saveRes.status})`);
      }

      setMessage("Tugas berhasil dikumpulkan.");
      setFile(null);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-bold">Unggah Tugas</h2>
      {message && (
        <p className="rounded-lg bg-green-50 text-green-700 px-4 py-2 text-sm">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <label className="block space-y-1">
        <span className="block text-sm font-medium">Berkas</span>
        <input
          type="file"
          accept={assignmentFileAccept}
          className="block w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="block text-xs text-gray-500">
          Maks {formatFileSize(MAX_ASSIGNMENT_FILE_BYTES)}. PDF, Office, gambar, teks, atau ZIP.
        </span>
      </label>

      <label className="block space-y-1">
        <span className="block text-sm font-medium">Catatan (opsional)</span>
        <input
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button className="btn-primary" disabled={busy} onClick={submit}>
        {busy ? "Mengunggah..." : "Kumpulkan Tugas"}
      </button>
    </div>
  );
}
