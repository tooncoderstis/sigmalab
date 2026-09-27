# SigmaLab

Portal belajar **berbasis project**: peserta tidak hanya menonton materi, tetapi menyelesaikan project nyata yang direview mentor, lalu mendapat feedback dan sertifikat.

## Fitur
- Autentikasi & role (LEARNER / REVIEWER / ADMIN)
- Katalog & detail kursus (kategori, level, gratis/premium)
- Enrollment, progres per lesson, dan kuis
- Submission project + review/feedback dari mentor
- Sertifikat dengan kode verifikasi (dalam pengembangan)
- Pembayaran kursus premium via Mayar

## Stack
- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4
- Prisma ORM + PostgreSQL
- NextAuth v5 (credentials, JWT)
- Mayar (hosted checkout) untuk pembayaran
- Node 22 · Deploy: EasyPanel VPS via Docker image (`deploy/easypanel-docker/`)

## Menjalankan
```sh
npm install
cp .env.example .env          # lalu isi nilainya
npx prisma migrate dev
npm run dev                   # http://localhost:3000
```

## Testing
```sh
npm run lint
npm run typecheck
npm test                      # Vitest (unit + route handler)
npm run build && npm run test:e2e   # Playwright (butuh build)
```

## Dokumentasi
- Kebutuhan: [`PRD.md`](PRD.md)
- Status: [`STATUS.md`](STATUS.md)
- Riwayat rilis: [`CHANGELOG.md`](CHANGELOG.md)
- Keputusan teknis: [`docs/adr/`](docs/adr/)
- Runbook: [`docs/runbooks/`](docs/runbooks/)

## Kontribusi
Lihat [`CONTRIBUTING.md`](CONTRIBUTING.md).
