# Changelog

Semua perubahan penting didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com) dan proyek ini menganut [Semantic Versioning](https://semver.org).

Status terkini: [`STATUS.md`](STATUS.md).

## [Unreleased]
### Added
- Fase 1 (akademik inti): tahun ajaran & term, program (sekolah/bimbel/kuliah), mapel, kelas (rombel), keanggotaan siswa, dan penugasan guru (ADR-0008).
- Presensi siswa per sesi (HADIR/TERLAMBAT/ALPA/SAKIT/IZIN) dan presensi harian guru (check-in/check-out).
- Peran multi-peran via `UserRole` (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `GUARDIAN`, `STAFF`, + `LEARNER`/`REVIEWER`) dan RBAC berlapis: `proxy.ts` (pengganti `middleware` Next 16) + `requireApiRole()` di route handler (ADR-0007).
- API akademik: `years`, `terms`, `programs`, `subjects`, `classes`, enrollments, assignments, users, sessions, teacher-attendance, user-roles (validasi zod + guard peran).
- UI: Manajemen Akademik (admin), Ruang Guru (kelas + presensi + check-in), Ruang Siswa, Ruang Wali, Super Admin (manajemen peran); tautan navigasi berbasis peran.
- Skrip `npm run grant:role <email> <ROLE> [--primary]` untuk bootstrap peran.
- Dependensi `zod` untuk validasi input server-side.
- Uji: unit (`roles`, `validation`) + route handler akademik; smoke e2e penjagaan rute.
### Changed
- Sesi NextAuth memuat `role` (utama) dan `roles` (daftar multi-peran); `User`/`JWT` di-augmentasi.
- Migrasi DB non-destruktif + backfill `UserRole` dari `User.role` untuk user lama.

## [0.1.0] - 2026-09-27
### Added
- Autentikasi kredensial (NextAuth v5, JWT) dengan role LEARNER/REVIEWER/ADMIN.
- Katalog & detail kursus (kategori, level, gratis/premium).
- Enrollment kursus dan pelacakan progres per lesson.
- Kuis per lesson dengan penyimpanan attempt & skor.
- Submission tugas + alur review (APPROVED/REJECTED + feedback).
- Pembayaran kursus premium via Mayar (invoice + webhook).
- Halaman belajar (`/learn`) dengan form kuis, submission, dan tandai selesai.
- Dashboard peserta.
- Dokumentasi proyek: `PRD.md`, `STATUS.md`, `CHANGELOG.md`, `docs/adr/`, `docs/runbooks/`.
- Quality gate: Vitest (unit/route), Playwright (e2e smoke), CI GitHub Actions, dan endpoint `/api/health`.
- Deploy: `deploy/easypanel-docker/` (Dockerfile Node 22 + `entrypoint.sh` dengan opsi `RUN_MIGRATIONS`, `build-push.ps1`, `RUNBOOK.md`).
### Changed
- `MAYAR_BASE_URL` dari host sandbox lama `api.mayar.club` → `api.mayar.io` (host lama tidak lagi dapat diakses dari server deploy).
- Halaman katalog: penyaringan kursus dihitung dengan `useMemo` (menghapus `setState` di dalam effect).
- Navigasi internal memakai `next/link`; `@types/node` dinaikkan ke `^22`.
- Runtime diseragamkan ke **Node 22** (CI + Docker image) agar selaras dengan tooling testing.
### Fixed
- `POST /api/payment/create` tidak lagi crash saat koneksi ke Mayar gagal: fetch dibungkus `try/catch` + timeout 15s, mengembalikan `502` alih-alih unhandled error.

