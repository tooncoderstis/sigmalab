# ADR-0013: Perpustakaan & inventaris ATK/sarpras (Fase 4)

- **Status**: Diterima
- **Tanggal**: 2026-10-11
- **Terkait**: melanjutkan Fase 3 ([ADR-0012](0012-kurikulum-rpp-textbook.md))

## Konteks
Fase 4 PRD mencakup **sirkulasi perpustakaan** (peminjaman/pengembalian buku) dan **inventaris ATK/sarpras** (stok barang). Pola eksemplar per judul & transisi status sudah dipakai untuk buku ajar (ADR-0012). Peran `STAFF` sudah ada sebagai pengelola non-akademik.

## Keputusan
- **Perpustakaan**: `LibraryBook` (katalog) → `LibraryCopy` (eksemplar berkode, status memakai `CopyStatus` yang sudah ada) → `BookLoan` (peminjaman: `LENT/RETURNED/OVERDUE/LOST`, `dueAt`, `returnedAt`, `fine`). Denda dihitung fungsi murni.
- **Inventaris**: `InventoryItem` (kategori `ATK/SARPRAS/LAINNYA`, `unit`, `quantity`, `minQuantity`) + `InventoryMovement` (`IN`/`OUT`/`ADJUST`) sebagai jejak; stok material di `InventoryItem.quantity` dan diperbarui dalam transaksi.
- Pengelolaan oleh **STAFF/ADMIN/SUPER_ADMIN** di area `/staf` (`/staf/perpustakaan`, `/staf/inventaris`). Peminjam adalah `User` (siswa/guru/staf).
- Denda & perhitungan keterlambatan di `src/lib/library.ts` (murni, teruji).

## Alasan
- Memisahkan perpustakaan dari buku ajar menjaga semantik (sirkulasi umum vs distribusi buku pelajaran) meski keduanya memakai pola eksemplar.
- Menyimpan stok + jejak pergerakan memberi rekap cepat sekaligus audit perubahan stok.
- Reuse `CopyStatus` mengurangi duplikasi model/enum.

## Konsekuensi
- **Positif**: sirkulasi perpustakaan & inventaris berfungsi dengan pola UI/RBAC yang konsisten; jejak pergerakan stok.
- **Negatif**: dua model "buku" (Textbook vs LibraryBook) — dibedakan jelas di dokumentasi.
- **Lain-lain**: migrasi additive; biaya denda default Rp1.000/hari (konstanta dapat diubah). Tanpa integrasi eksternal.

## Alternatif yang dipertimbangkan
- **Menyatukan LibraryBook dengan Textbook** — mengaburkan tujuan & melanggar keputusan ADR-0012; ditolak.
- **Stok tanpa jejak pergerakan** — sulit diaudit; ditolak.
- **Reservasi/booking buku** — kebutuhan belum terbukti; ditunda.
