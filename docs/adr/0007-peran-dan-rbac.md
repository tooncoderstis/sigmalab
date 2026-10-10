# ADR-0007: Peran multi-peran & RBAC

- **Status**: Diterima
- **Tanggal**: 2026-10-10

## Konteks
SigmaLab diperluas dari portal belajar B2C menjadi portal belajar universal + manajemen sekolah/instansi (LMS + SIS). Satu pengguna sering memegang lebih dari satu peran (mis. guru yang juga wali murid, admin yang juga guru). Skema lama menyimpan **satu** peran di `User.role` (`LEARNER`/`REVIEWER`/`ADMIN`) dan tidak punya penjagaan rute.

## Keputusan
- Menambah tabel relasi **`UserRole`** (`@@unique([userId, role])`) sehingga satu user bisa punya **banyak peran**.
- `User.role` **tetap dipertahankan** sebagai "peran utama" untuk kompatibilitas & pengecekan cepat.
- Enum `Role` diperluas: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `GUARDIAN`, `STAFF` (selain `LEARNER`, `REVIEWER`, `ADMIN` yang sudah ada).
- Sesi menyertakan `role` (utama) dan `roles` (daftar lengkap).
- Otorisasi berlapis: **`proxy.ts`** (pengganti `middleware` di Next 16) untuk redirect rute berbasis peran, **dan** helper `requireApiRole()`/`userHasRole()` di setiap route handler & server component. Proxy bukan satu-satunya garis pertahanan.

## Alasan
- Banyak peran adalah kebutuhan nyata instansi; memaksakan satu peran akan memicu workaround.
- Mempertahankan `User.role` menghindari migrasi data besar dan menjaga fitur marketplace tetap jalan.
- Next 16 mengganti `middleware` menjadi `proxy` (runtime Node.js) — mengikuti konvensi baru sejak awal.
- Pengecekan di route handler wajib karena proxy bisa dilewati (mis. Server Function pada rute yang di-exclude).

## Konsekuensi
- **Positif**: model peran fleksibel; penjagaan rute & API eksplisit; migrasi non-destruktif (backfill `UserRole` dari `User.role`).
- **Negatif**: `auth.ts` perlu memuat daftar peran; token JWT perlu di-refresh bila peran berubah diam-diam.
- **Lain-lain**: pembuatan `SUPER_ADMIN` pertama lewat skrip `npm run grant:role <email> SUPER_ADMIN --primary`.

## Alternatif yang dipertimbangkan
- **Tetap peran tunggal + flag kapabilitas** — cepat, tetapi kaku dan sulit diaudit untuk kasus multi-peran.
- **Hanya proxy, tanpa cek di route** — berisiko; docs Next menganjurkan verifikasi di tiap handler.
