# STATUS — SigmaLab

> **Sumber kebenaran status & progres.** Baca file ini dulu sebelum melanjutkan pekerjaan.
> Riwayat rilis: [`CHANGELOG.md`](CHANGELOG.md) · Keputusan: [`docs/adr/`](docs/adr/) · Kebutuhan: [`PRD.md`](PRD.md).
> **Jangan simpan kredensial di file ini.**

- **Terakhir diperbarui**: 2026-09-27
- **Versi terbaru**: tag source `v0.1.0` (image produksi belum dibangun/di-tag)
- **Platform**: Next.js 16.3 (App Router, TS) + Prisma 5 + PostgreSQL + NextAuth v5 · Node 22 · Payment: Mayar (sandbox) · Deploy: EasyPanel VPS (Docker image)

## TL;DR (konteks 30 detik)
Portal belajar **berbasis project** (B2C). Fondasi sudah jalan: auth, katalog, enrollment, progres, kuis, dan pembayaran Mayar. Tahap penguatan fondasi (docs/CI/DoD/deploy) **selesai dan ter-push** (`v0.1.0`). Berikutnya: masuk **Fase 2 PRD** — fitur inti project-based (project brief + rubrik, submission, review/feedback). Redesain UI di-hold (track terpisah).

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
| G | Fase 2 PRD: project brief + submission + review | ⬜ |
| H | Fase 3 PRD: sertifikat + review kursus + showcase | ⬜ |

## Kondisi saat ini
- Semua hijau di lokal: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` (6 unit), `npm run test:e2e`.
- Semua perubahan sudah **di-commit & push** ke `origin/main`; tag source `v0.1.0`.
- **Sudah ada**: dokumentasi (PRD/ADR/runbook), test suite, CI GitHub Actions, health endpoint `/api/health`, image Docker siap.
- Deploy produksi: EasyPanel; Mayar masih **sandbox** (image produksi belum dibangun).

## Yang belum selesai / menunggu
| Item | Catatan |
|---|---|
| Verifikasi signature webhook Mayar | Keamanan pembayaran — prioritas Fase 1 |
| Validasi input (zod) di route mutasi | Wajib untuk DoD test |
| RBAC/middleware guard | Cegah akses lintas-role |
| API key Mayar Read & Write | Key saat ini scope `{read:true}` |
| Fitur project-based (brief/rubrik/submission/review) | Inti produk, Fase 2 PRD |
| Sertifikat & verifikasi publik | Model ada, flow belum |
| Admin CMS | Fase 4 PRD |
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
```

## Rilis
```sh
powershell -File deploy/easypanel-docker/build-push.ps1 -Image <registry>/<image> -Tag 0.1.0 -Push
```
Deploy di EasyPanel (Source: Docker Image). Detail: [`docs/runbooks/`](docs/runbooks/).

## Referensi cepat
- PRD: `PRD.md` · Changelog: `CHANGELOG.md` · ADR: `docs/adr/README.md` · Runbook: `docs/runbooks/`
