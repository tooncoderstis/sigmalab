# Changelog

Semua perubahan penting didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com) dan proyek ini menganut [Semantic Versioning](https://semver.org).

Status terkini: [`STATUS.md`](STATUS.md).

## [Unreleased]

## [0.4.0] - 2026-10-11
### Added
- Fase 3 (kurikulum/RPP & buku ajar): entitas `LessonPlan`, `Textbook`, `TextbookCopy`, `TextbookDistribution` + enum `LessonPlanStatus`, `CopyStatus`, `DistributionStatus` (ADR-0012).
- API akademik: `lesson-plans` (+`[lessonPlanId]`), `textbooks` (+`[textbookId]`, `[textbookId]/copies`, `[textbookId]/file`), `textbook-copies/[copyId]`, `textbook-distributions` (+`[distributionId]`), `uploads/textbook/presign`.
- Area peran baru **`/staf`** (STAFF) dengan manajemen buku ajar: katalog, eksemplar, distribusi/kembalikan, unggah e-book (S3); aturan `proxy.ts` untuk `/staf`.
- UI guru: RPP per kelas (`guru/kelas/[classId]/rpp`); UI siswa/wali: daftar buku & RPP terbit.
- Uji: unit `textbook` + validasi Fase 3; route `lesson-plans`, `textbooks`, `textbook-distributions`.

## [0.3.0] - 2026-10-11
### Added
- Fase 2B/2C (pengumuman & kegiatan sekolah): entitas `Announcement`, `AnnouncementTarget`, `AnnouncementRead`, `SchoolActivity`, `ActivityTarget` + enum `AnnouncementStatus` (ADR-0011).
- Audiens fleksibel (semua / per-peran / per-kelas / per-program) via `src/lib/audience.ts` + konteks user (`audience-context.ts`); wali ikut audiens kelas/program anaknya.
- API akademik: `announcements` (+`[id]`, `[id]/read`) dan `activities` (+`[id]`) dengan guard peran manager.
- UI: admin kelola & terbitkan pengumuman/kegiatan; feed pengumuman (badge baru + tandai dibaca) dan kegiatan mendatang di halaman guru, siswa, dan wali.
- Uji: unit `matchesAudience` + validasi; route create pengumuman, tandai dibaca, dan create kegiatan.

### Fixed
- Docker image: set `HOSTNAME=0.0.0.0` agar Next standalone tidak mengikat ke hostname container — memperbaiki healthcheck (`curl 127.0.0.1`) dan routing di EasyPanel Swarm (penyebab deploy task dianggap unhealthy).
- `deploy/easypanel-docker/build-push.ps1`: build dengan `--provenance=false --sbom=false` (single-arch, tanpa attestation) agar lebih portabel saat pull.

## [0.2.0] - 2026-10-11
### Added
- Fase 2A (penilaian, tugas, nilai & rapor): entitas `Assessment`, `AssignmentSubmission`, `Grade`, `ReportCard`, `ReportCardEntry` + enums (ADR-0010).
- API akademik: `assessments`, `assessments/[assessmentId]` (ubah/hapus/terbit), `assessments/[assessmentId]/grades` (input nilai massal), `assessments/[assessmentId]/submissions`, `uploads/presign` & `uploads/download`, `report-cards` (hasilkan), `report-cards/[reportCardId]` (terbit) dan `.../pdf` (rapor PDF).
- Unggah berkas tugas siswa ke object storage S3-compatible (Cloudflare R2/MinIO) via presigned URL + validasi tipe/ukuran (ADR-0009, merevisi ADR-0004).
- Rapor PDF server-side dengan `@react-pdf/renderer`; nilai akhir berbobot & predikat A/B/C/D di `src/lib/report-card.ts`.
- UI: guru (daftar aktivitas + input nilai + unduh berkas), siswa (kumpul tugas + nilai + rapor), wali (nilai & rapor), admin (kelola & terbitkan rapor).
- Uji: unit komputasi nilai/predikat & skema validasi Fase 2; route handler assessments/grades/presign/report-cards; uji render PDF.
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
- Dependensi baru: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@react-pdf/renderer`; `@react-pdf/renderer` di-`serverExternalPackages`.
- Env baru: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

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

