# ADR-0001: Stack & arsitektur aplikasi

- **Status**: Diterima
- **Tanggal**: 2026-09-27

## Konteks
SigmaLab adalah portal belajar berbasis project yang sudah berjalan sebagai aplikasi Next.js. Kebutuhan: server-rendered + interaktif, autentikasi berbasis role, database relasional (kursus → modul → lesson → submission/progres), integrasi pembayaran, dan deploy mandiri di VPS ringan. Tim kecil (2–5 orang) ingin produktivitas tinggi tanpa mengelola banyak service.

## Keputusan
Gunakan **Next.js 16 (App Router) + TypeScript**, **Prisma ORM** di atas **PostgreSQL**, dan **NextAuth v5** untuk autentikasi kredensial (sesi JWT). API ditulis sebagai Route Handlers di dalam proyek yang sama (backend-for-frontend).

## Alasan
- Satu bahasa (TypeScript) dan satu repo untuk UI + API → iterasi cepat untuk tim kecil.
- Prisma memberi skema bertipe + migrasi terkontrol untuk model data yang relasional.
- PostgreSQL andal, matang, dan tersedia di VPS yang sudah dipakai.
- NextAuth v5 mendukung role di sesi tanpa layanan auth eksternal.

## Konsekuensi
- **Positif**: pengembangan cepat, tipe end-to-end, deploy satu container.
- **Negatif**: terikat ekosistem Next.js; App Router versi ini punya perubahan API yang perlu dibaca dari dokumentasi lokal (`node_modules/next/dist/docs/`).
- **Lain-lain**: perlu disiplin memisahkan logika domain dari route agar bisa diuji (lihat ADR-0003).

## Alternatif yang dipertimbangkan
- **Remix / SvelteKit** — bagus, tapi ekosistem & familiaritas tim pada Next lebih tinggi.
- **Laravel (backend) + SPA terpisah** — dua codebase menambah overhead untuk tim kecil.
- **Supabase (BaaS)** — cepat, tapi mengurangi kontrol atas logika review/pembayaran dan biaya jangka panjang.
