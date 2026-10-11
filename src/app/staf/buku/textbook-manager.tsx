"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { summarizeCopies } from "@/lib/textbook";
import TextbookDetail from "./textbook-detail";

type Option = { value: string; label: string };
type CopyLoan = { id: string; studentName: string };
type Copy = {
  id: string;
  code: string;
  status: string;
  conditionNote: string | null;
  loans: CopyLoan[];
};
type Textbook = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  gradeLevel: string | null;
  description: string | null;
  subjectName: string | null;
  programName: string | null;
  fileName: string | null;
  copies: Copy[];
};

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function TextbookManager({
  subjects,
  programs,
  students,
  textbooks,
}: {
  subjects: Option[];
  programs: Option[];
  students: { id: string; name: string }[];
  textbooks: Textbook[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [description, setDescription] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!title.trim()) {
      setError("Judul wajib diisi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/academic/textbooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author || undefined,
          publisher: publisher || undefined,
          isbn: isbn || undefined,
          subjectId: subjectId || undefined,
          programId: programId || undefined,
          gradeLevel: gradeLevel || undefined,
          description: description || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setTitle("");
      setAuthor("");
      setPublisher("");
      setIsbn("");
      setGradeLevel("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Tambah Buku Ajar</h2>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Judul *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Penulis"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Penerbit"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
          <select
            className={inputClass}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">— Mapel —</option>
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">— Program —</option>
            {programs.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Jenjang (mis. Kelas 10)"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
        </div>
        <textarea
          className={`${inputClass} w-full min-h-[60px]`}
          placeholder="Deskripsi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="btn-primary" disabled={busy} onClick={create}>
          Simpan Buku
        </button>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Katalog Buku</h2>
        {textbooks.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada buku.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {textbooks.map((book) => {
              const summary = summarizeCopies(book.copies);
              return (
                <li key={book.id} className="py-3">
                  <div className="flex justify-between gap-4">
                    <div className="text-sm">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-gray-500">
                        {[book.author, book.publisher, book.isbn]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                        {book.subjectName ? ` · ${book.subjectName}` : ""}
                        {book.programName ? ` · ${book.programName}` : ""}
                        {book.fileName ? ` · e-book` : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        {summary.total} eksemplar · tersedia {summary.available} ·
                        dipinjam {summary.lent}
                      </p>
                    </div>
                    <button
                      className="text-teal-600 hover:underline text-sm shrink-0"
                      onClick={() =>
                        setOpenId(openId === book.id ? null : book.id)
                      }
                    >
                      {openId === book.id ? "Tutup" : "Kelola"}
                    </button>
                  </div>
                  {openId === book.id && (
                    <TextbookDetail
                      textbookId={book.id}
                      fileName={book.fileName}
                      copies={book.copies}
                      students={students}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
