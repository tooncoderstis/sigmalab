"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActiveLoan = { id: string; memberName: string };
type Copy = {
  id: string;
  code: string;
  status: string;
  loans: ActiveLoan[];
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Tersedia",
  LENT: "Dipinjam",
  LOST: "Hilang",
  DAMAGED: "Rusak",
  RETIRED: "Ditarik",
};

export default function LibraryDetail({
  bookId,
  copies,
  members,
}: {
  bookId: string;
  copies: Copy[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await send(`/api/academic/library-books/${bookId}/copies`, "POST", {
        code: code.trim(),
      });
      setCode("");
    });
  }

  async function borrow(copyId: string) {
    if (!memberId) {
      setError("Pilih peminjam.");
      return;
    }
    await run(() =>
      send("/api/academic/book-loans", "POST", {
        copyId,
        memberId,
        dueAt: dueAt ? new Date(`${dueAt}T00:00:00.000Z`).toISOString() : undefined,
      })
    );
  }

  async function finish(loanId: string, status: "RETURNED" | "LOST") {
    await run(() =>
      send(`/api/academic/book-loans/${loanId}`, "PATCH", { status })
    );
  }

  async function removeCopy(copyId: string) {
    await run(() => send(`/api/academic/library-copies/${copyId}`, "DELETE"));
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
          placeholder="Kode eksemplar"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn-secondary btn-small" disabled={busy} onClick={addCopy}>
          Tambah Eksemplar
        </button>
        <span className="text-xs text-gray-500">Peminjam default & tenggat:</span>
        <select
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
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
                  {loan ? ` · dipinjam: ${loan.memberName}` : ""}
                </span>
                <span className="flex items-center gap-3">
                  {copy.status === "AVAILABLE" && (
                    <button
                      className="text-teal-600 hover:underline text-xs disabled:opacity-50"
                      disabled={busy}
                      onClick={() => borrow(copy.id)}
                    >
                      Pinjamkan
                    </button>
                  )}
                  {loan && (
                    <>
                      <button
                        className="text-teal-600 hover:underline text-xs disabled:opacity-50"
                        disabled={busy}
                        onClick={() => finish(loan.id, "RETURNED")}
                      >
                        Kembalikan
                      </button>
                      <button
                        className="text-amber-600 hover:underline text-xs disabled:opacity-50"
                        disabled={busy}
                        onClick={() => finish(loan.id, "LOST")}
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
