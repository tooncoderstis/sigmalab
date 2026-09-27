# Changelog

Semua perubahan penting didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com) dan proyek ini menganut [Semantic Versioning](https://semver.org).

Status terkini: [`STATUS.md`](STATUS.md).

## [Unreleased]

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

