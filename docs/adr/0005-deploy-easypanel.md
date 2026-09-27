# ADR-0005: Deploy EasyPanel via Docker image

- **Status**: Diterima
- **Tanggal**: 2026-09-27

## Konteks
SigmaLab perlu hosting produksi yang murah dan terkendali, dengan PostgreSQL yang sudah berjalan di VPS. Tim ingin proses deploy yang dapat diulang dan mudah di-rollback tanpa terikat platform serverless tertentu. Ini juga melibatkan Prisma (butuh `prisma generate` + binary target Linux musl) dan migrasi DB.

## Keputusan
Deploy sebagai **Docker image** yang dibangun lokal lalu di-push ke registry, dan dijalankan di **EasyPanel** dengan Source: **Docker Image**. Gunakan build multi-stage (`output: "standalone"`) dan sertakan `deploy/easypanel-docker/` berisi Dockerfile, skrip build/push, dan runbook. Migrasi dijalankan terkontrol (mis. via langkah deploy/entrypoint), bukan otomatis tanpa kendali.

## Alasan
- Kontrol penuh atas runtime & environment; cocok dengan VPS + Postgres yang ada.
- Image bertag = rollback mudah (ganti tag lalu deploy).
- Tidak terkunci pada platform PaaS tertentu.

## Konsekuensi
- **Positif**: portabilitas, rollback sederhana, perilaku konsisten lokal↔produksi.
- **Negatif**: build/push manual (bisa diotomasi nanti di CI); operator harus paham Docker & EasyPanel.
- **Lain-lain**: wajib set semua env produksi di EasyPanel; `binaryTargets` Prisma harus mencakup `linux-musl-openssl-3.0.x` (sudah ada).

## Alternatif yang dipertimbangkan
- **Vercel** — paling mudah, tetapi Prisma/DB dan kontrol runtime kurang bebas; biaya bisa naik.
- **VPS manual + Docker Compose** — kontrol penuh tanpa panel, tetapi kehilangan UI deploy/rollback EasyPanel.
- **Platform PaaS lain (Railway/Render)** — menambah ketergantungan & biaya, DB sudah di VPS sendiri.
