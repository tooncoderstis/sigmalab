"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isLowStock } from "@/lib/inventory";

type Item = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  location: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  ATK: "ATK",
  SARPRAS: "Sarpras",
  LAINNYA: "Lainnya",
};

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function InventoryManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ATK");
  const [unit, setUnit] = useState("pcs");
  const [minQuantity, setMinQuantity] = useState("0");
  const [location, setLocation] = useState("");
  const [movementItemId, setMovementItemId] = useState(items[0]?.id ?? "");
  const [movementType, setMovementType] = useState("IN");
  const [movementQty, setMovementQty] = useState("1");
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

  async function create() {
    if (!name.trim()) {
      setError("Nama barang wajib.");
      return;
    }
    await run(async () => {
      await send("/api/academic/inventory-items", "POST", {
        name: name.trim(),
        category,
        unit: unit || undefined,
        minQuantity: Number(minQuantity) || 0,
        location: location || undefined,
      });
      setName("");
      setLocation("");
      setMinQuantity("0");
    });
  }

  async function move() {
    if (!movementItemId) {
      setError("Pilih barang.");
      return;
    }
    await run(() =>
      send("/api/academic/inventory-movements", "POST", {
        itemId: movementItemId,
        type: movementType,
        quantity: Number(movementQty) || 0,
      })
    );
  }

  async function remove(id: string) {
    await run(() => send(`/api/academic/inventory-items/${id}`, "DELETE"));
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-bold">Tambah Barang</h2>
        {error && (
          <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Nama barang *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ATK">ATK</option>
            <option value="SARPRAS">Sarpras</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
          <input
            className={inputClass}
            placeholder="Satuan (mis. pcs, rim)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <input
            className={inputClass}
            type="number"
            min="0"
            placeholder="Stok minimum"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Lokasi"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button className="btn-primary" disabled={busy} onClick={create}>
          Simpan Barang
        </button>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="text-lg font-bold">Catat Pergerakan Stok</h2>
        <div className="flex flex-wrap items-end gap-3">
          <select
            className={inputClass}
            value={movementItemId}
            onChange={(e) => setMovementItemId(e.target.value)}
          >
            {items.length === 0 && <option value="">— belum ada barang —</option>}
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} ({it.quantity} {it.unit})
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
          >
            <option value="IN">Masuk (IN)</option>
            <option value="OUT">Keluar (OUT)</option>
            <option value="ADJUST">Set (ADJUST)</option>
          </select>
          <input
            type="number"
            min="0"
            className={`${inputClass} w-24`}
            value={movementQty}
            onChange={(e) => setMovementQty(e.target.value)}
          />
          <button
            className="btn-secondary"
            disabled={busy || items.length === 0}
            onClick={move}
          >
            Catat
          </button>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-bold mb-4">Daftar Inventaris</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada barang.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Nama</th>
                  <th className="py-2 pr-4">Kategori</th>
                  <th className="py-2 pr-4">Stok</th>
                  <th className="py-2 pr-4">Min</th>
                  <th className="py-2 pr-4">Lokasi</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 pr-4 font-medium">{it.name}</td>
                    <td className="py-2 pr-4">
                      {CATEGORY_LABEL[it.category] ?? it.category}
                    </td>
                    <td className="py-2 pr-4">
                      {it.quantity} {it.unit}
                      {isLowStock(it.quantity, it.minQuantity) && (
                        <span className="ml-2 text-amber-600 text-xs">stok rendah</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{it.minQuantity}</td>
                    <td className="py-2 pr-4">{it.location ?? "—"}</td>
                    <td className="py-2">
                      <button
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                        disabled={busy}
                        onClick={() => remove(it.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
