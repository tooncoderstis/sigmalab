# STATUS — SigmaLab

> **Sumber kebenaran status & progres.** Baca file ini dulu sebelum melanjutkan pekerjaan.
> Riwayat rilis: [`CHANGELOG.md`](CHANGELOG.md) · Keputusan: [`docs/adr/`](docs/adr/) · Kebutuhan: [`PRD.md`](PRD.md).
> **Jangan simpan kredensial di file ini.**

- **Terakhir diperbarui**: 2026-10-11
- **Versi terbaru**: tag source `v0.4.0` (Fase 1–3); deploy produksi menyusul
- **Platform**: Next.js 16.3 (App Router, TS) + Prisma 5 + PostgreSQL + NextAuth v5 · Node 22 · Payment: Mayar (sandbox) · Deploy: EasyPanel VPS (Docker image)

## TL;DR (konteks 30 detik)
Perluasan arah: SigmaLab dari portal belajar **berbasis project** (B2C) menjadi **portal belajar universal + manajemen sekolah/instansi** (LMS + SIS ringan). Fondasi lama (auth, katalog, enrollment, progres, kuis, pembayaran Mayar) **dipertahankan**; `Course` menjadi materi opsional bagi kelas akademik. Keputusan: **satu instansi per deploy**, **multi-peran** (`UserRole`), `SUPER_ADMIN` (vendor) + `ADMIN` (instansi). **Fase 1 = akademik inti + presensi** (kelas, siswa, guru, program, tahun ajaran/term, presensi siswa & guru). Nilai/rapor mulai Fase 2. Redesain UI di-hold (track terpisah).

## Checklist Tahap
| Tahap | Judul | Status |
|---|---|---|
| 0 | Setup & Fondasi (auth, katalog, enrollment, progres, kuis, payment) | ✅ |
| A | Dokumentasi inti (PRD/STATUS/CHANGELOG/ADR/runbook) | ✅ |
| B | Bootstrap agen (AGENTS/opencode) | ✅ |
| C | Repo hygiene & health files | ✅ |
| D | CI & testing (Vitest + Playwright) | ✅ |
| E | Deploy EasyPanel (Docker image + runbook) | ✅ |
| F | Commit & rilis 0.1.0 | ✅ |
| G | Fase 1: akademik inti + presensi (kelas, siswa, guru, program, term, presensi) | ✅ |
| H | Fase 2: penilaian & rapor, kegiatan sekolah, pengumuman | ✅ |
| I | Fase 3: kurikulum/RPP + ketersediaan & distribusi textbook | ✅ |
| J | Fase 4: perpustakaan + inventaris ATK/sarpras | ⬜ |
| K | Fase 5: SPP, notifikasi, audit, analitik | ⬜ |

## Kondisi saat ini
- Semua hijau di lokal: `npm run build`, `npm run lint` (1 warning lama), `npm run typecheck`, `npm test`.
- **Fase 1 (akademik inti + presensi) selesai**: multi-peran & RBAC, struktur akademik, presensi siswa (per sesi) & guru, plus UI admin/guru/siswa/wali/super-admin.
- **Fase 2A (penilaian, tugas, nilai, rapor) selesai**: assessment per kelas/mapel, unggah berkas tugas via S3-compatible (R2/MinIO) presigned URL, input nilai berbobot, rapor PDF (`@react-pdf/renderer`) dengan alur draf→terbit, UI guru/siswa/wali/admin. Lihat ADR-0009 & ADR-0010.
- **Fase 2B/2C (pengumuman & kegiatan) selesai**: pengumuman Markdown (draf→terbit, pin, kedaluwarsa, tanda-dibaca) dan kegiatan sekolah, dengan audiens fleksibel (semua/per-peran/per-kelas/per-program) + feed di halaman guru/siswa/wali. Lihat ADR-0011.
- **Fase 3 (kurikulum/RPP + buku ajar) selesai**: RPP per kelas per pertemuan (draf→terbit), katalog buku dengan eksemplar (copy) & distribusi ke siswa, area peran `/staf`, unggah e-book via S3 (opsional). Lihat ADR-0012.
- Migrasi DB non-destruktif (`phase1_academic_core`, `session_subject_relation`, `phase2a_grading`, `phase2b_announcements_activities`, `phase3_curriculum_textbook`) + backfill `UserRole`.
- **⚠️ DB produksi bersama sudah termigrasi Fase 1 & Fase 2A**: `DATABASE_URL` lokal menunjuk DB yang **sama** dengan service produksi (`.../sigmalabdb`).
- **Sudah di-commit & push** ke `origin/main`, termasuk tag rilis `v0.2.0`.
- **Deploy produksi BERHASIL**: EasyPanel service `sigmalab` (project `m`) kini menjalankan image `aasatech/sigmalab:0.4.0` (Fase 1–3); `GET /api/health` → 200 dan route terproteksi Fase 1–3 merespons. Catatan: image butuh `ENV HOSTNAME=0.0.0.0` (perbaikan Dockerfile) agar healthcheck/routing berfungsi.
- **Env produksi masih perlu dibenahi**: `MAYAR_BASE_URL` masih `api.mayar.club` (stale) dan **belum ada env S3**, sehingga unggah berkas tugas belum aktif (endpoint balas 503). Mayar masih **sandbox**.

## Yang belum selesai / menunggu
| Item | Catatan |
|---|---|
| Verifikasi signature webhook Mayar | Keamanan pembayaran — carry-over |
| API key Mayar Read & Write | Key saat ini scope `{read:true}` |
| Fitur project-based (brief/rubrik/submission/review) | Inti produk, belum diprioritaskan |
| Sertifikat & verifikasi publik | Model ada, flow belum |
| Perpustakaan, ATK/sarpras | Fase 4 |
| SPP/billing, notifikasi, audit, analitik | Fase 5 |
| Redesain UI | Di-hold, track terpisah (strategi milik pemilik produk) |

## Cara menjalankan & menguji
```sh
npm install            # install dependensi (+ prisma generate via postinstall)
npx prisma migrate dev # jalankan migrasi DB (butuh DATABASE_URL)
npm run dev            # server dev di http://localhost:3000
npm run build          # build produksi
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest (unit + route handler)
npm run test:e2e       # Playwright (butuh build dulu)
npm run grant:role <email> SUPER_ADMIN --primary  # bootstrap peran (multi-peran)
```

## Rilis
```sh
powershell -File deploy/easypanel-docker/build-push.ps1 -Image <registry>/<image> -Tag 0.1.0 -Push
```
Deploy di EasyPanel (Source: Docker Image). Detail: [`docs/runbooks/`](docs/runbooks/).

## Referensi cepat
- PRD: `PRD.md` · Changelog: `CHANGELOG.md` · ADR: `docs/adr/README.md` · Runbook: `docs/runbooks/`
