# ADR-0003: Strategi pengujian (Vitest + Playwright)

- **Status**: Diterima
- **Tanggal**: 2026-09-27

## Konteks
DoD menetapkan setiap route/endpoint yang mengubah data harus punya test (mencegah bug kelas form↔route). Saat ini belum ada test suite sama sekali. Stack: Next.js App Router, TypeScript, Prisma, PostgreSQL. Tim 2–5 orang butuh umpan balik cepat di CI.

## Keputusan
Gunakan **Vitest** untuk unit test dan pengujian Route Handler (logika, validasi, webhook), serta **Playwright** untuk uji end-to-end smoke pada alur kritis (daftar → login → mulai kelas → submit). Unit test berjalan tanpa DB nyata bila memungkinkan (mock Prisma); test integrasi DB memakai PostgreSQL di CI.

## Alasan
- Vitest cepat, konfigurasi minimal, kompatibel dengan TS/ESM.
- Playwright menguji alur integrasi nyata (webhook, redirect) yang sulit ditutup unit test.
- Keduanya populer dan mudah dijalankan di GitHub Actions.

## Konsekuensi
- **Positif**: regresi tertangkap lebih awal; route ber-mutasi terjaga; CI menjadi gerbang mutu.
- **Negatif**: menambah waktu CI dan kebutuhan service container PostgreSQL untuk test integrasi/e2e.
- **Lain-lain**: test yang menyentuh pembayaran Mayar memakai mock/fixture, bukan panggilan jaringan nyata.

## Alternatif yang dipertimbangkan
- **Jest saja** — ekosistem matang, tetapi setup ESM/TS lebih berat dibanding Vitest.
- **Hanya Playwright** — cakupan e2e kuat tapi umpan balik lebih lambat & rapuh untuk unit.
- **Cypress** — bagus untuk e2e, kurang nyaman untuk unit/route.
