# ADR-0014: SPP/billing, notifikasi, audit & analitik (Fase 5)

- **Status**: Diterima
- **Tanggal**: 2026-10-11
- **Terkait**: melanjutkan Fase 4 ([ADR-0013](0013-perpustakaan-inventaris.md))

## Konteks
Fase 5 PRD menutup lingkaran operasional: **tagihan SPP**, **notifikasi** ke pengguna, **audit trail** perubahan penting, dan **analitik** ringkas. Pembayaran gateway (Mayar) sudah dipakai untuk kursus; uang sekolah umumnya ditagih per siswa per periode dan sering dikonfirmasi manual oleh admin.

## Keputusan
- **SPP/billing**: `Invoice` (per siswa, opsional per term, `amount`, `dueAt`, status `DRAFT/UNPAID/PAID/CANCELLED/EXPIRED`). Pembuatan massal per kelas (generate) + tandai lunas/batal manual. Integrasi gateway pembayaran SPP ditunda.
- **Notifikasi**: `Notification` in-app (tipe `INVOICE/GRADE/ANNOUNCEMENT/ACTIVITY/SYSTEM`, judul, isi, tautan, `readAt`). Pembuatan lewat helper `notifyUser()`. Push/email ditunda (selaras `Announcement`).
- **Audit**: `AuditLog` (aktor, `action`, `entity`, `entityId`, `metadata` Json) + helper `recordAudit()` (best-effort, tidak menggagalkan aksi utama). Diterapkan pada aksi penting (tagihan, perubahan peran).
- **Analitik**: halaman ringkas di admin (jumlah siswa/guru/kelas, tingkat kehadiran, rata-rata nilai, tagihan & pemasukan, sirkulasi) dihitung dari agregat Prisma.

## Alasan
- Invoice sederhana + konfirmasi manual cukup untuk operasional sekolah awal dan tidak bergantung gateway.
- Notifikasi in-app konsisten dengan pengumuman (tanpa infrastruktur push/email).
- Audit best-effort memberi jejak tanpa menambah titik kegagalan pada aksi inti.

## Konsekuensi
- **Positif**: penagihan, pemberitahuan, jejak audit, dan dashboard KPI tersedia; fondasi untuk integrasi pembayaran/push menyusul.
- **Negatif**: konfirmasi pembayaran SPP masih manual; `metadata` audit tidak terstruktur (Json).
- **Lain-lain**: akses audit & SPP untuk ADMIN/SUPER_ADMIN (+STAFF untuk lihat SPP bila diperlukan); siswa/wali melihat tagihan miliknya. Migrasi additive.

## Alternatif yang dipertimbangkan
- **Integrasi Mayar untuk SPP** — menambah kompleksitas webhook/rekonsiliasi; ditunda (carry-over Mayar).
- **Push/email notifikasi** — butuh infrastruktur (Fase 5 lanjutan); ditunda.
- **Audit via DB trigger** — kurang fleksibel & sulit diuji di aplikasi; ditolak.
