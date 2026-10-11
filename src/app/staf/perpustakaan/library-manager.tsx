"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LibraryDetail from "./library-detail";

type ActiveLoan = { id: string; memberName: string };
type Copy = {
  id: string;
  code: string;
  status: string;
  loans: ActiveLoan[];
};
type Book = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  category: string | null;
  copies: Copy[];
};

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function LibraryManager({
  members,
  books,
}: {
  members: { id: string; name: string }[];
  books: Book[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
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
      const res = await fetch("/api/academic/library-books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author || undefined,
          publisher: publisher || undefined,
          isbn: isbn || undefined,
          category: category || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setTitle("");
      setAuthor("");
      setPublisher("");
      setIsbn("");
      setCategory("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-bold">Tambah Buku Perpustakaan</h2>
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
          <input
            className={inputClass}
            placeholder="Kategori (mis. Fiksi)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <button className="btn-primary" disabled={busy} onClick={create}>
          Simpan Buku
        </button>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Katalog Perpustakaan</h2>
        {books.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada buku.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {books.map((book) => {
              const available = book.copies.filter(
                (c) => c.status === "AVAILABLE"
              ).length;
              return (
                <li key={book.id} className="py-3">
                  <div className="flex justify-between gap-4">
                    <div className="text-sm">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-gray-500">
                        {[book.author, book.publisher, book.isbn, book.category]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {book.copies.length} eksemplar · tersedia {available}
                      </p>
                    </div>
                    <button
                      className="text-teal-600 hover:underline text-sm shrink-0"
                      onClick={() => setOpenId(openId === book.id ? null : book.id)}
                    >
                      {openId === book.id ? "Tutup" : "Kelola"}
                    </button>
                  </div>
                  {openId === book.id && (
                    <LibraryDetail
                      bookId={book.id}
                      copies={book.copies}
                      members={members}
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
