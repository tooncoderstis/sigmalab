# ADR-0009: Penyimpanan file tugas siswa (S3-compatible)

- **Status**: Diterima
- **Tanggal**: 2026-10-11
- **Terkait**: merevisi [ADR-0004](0004-storage-submission.md) (link repo fase awal)

## Konteks
Fase 2 PRD memerlukan pengumpulan **tugas akademik** yang dapat berupa berkas (dokumen, gambar, arsip), bukan hanya tautan repositori. ADR-0004 menunda unggah file dan menyediakan kolom `fileUrl`, menunggu kebutuhan terbukti. Kebutuhan itu kini muncul. Aplikasi di-deploy sebagai image Docker stateless di EasyPanel (satu instansi per deploy), sehingga menyimpan berkas di disk container berisiko hilang saat redeploy/scale dan menuntut pengelolaan volume serta backup manual.

## Keputusan
Mengaktifkan unggah berkas tugas memakai **object storage S3-compatible (Cloudflare R2)** melalui **presigned URL**. Klien mengunggah/mengunduh langsung ke R2; server Next.js hanya menandatangani URL dan menyimpan metadata (key, nama, mime, ukuran). Bucket, kredensial, dan CORS dikonfigurasi lewat environment.

## Alasan
- **Stateless & portabel**: tidak ada berkas menetap di image/container; cocok dengan model Docker di EasyPanel.
- **Hemat biaya**: R2 menyediakan kuota gratis memadai dan tanpa biaya egress.
- **Presigned URL**: berkas besar tidak melewati runtime Next.js (menghindari batas ukuran body & beban server), sekaligus membatasi akses via otorisasi aplikasi.
- **Abstraksi S3**: API S3-compatible memungkinkan pindah ke MinIO/penyedia lain tanpa mengubah kode domain.

## Konsekuensi
- **Positif**: unggah/unduh aman & terukur; kode storage terisolasi di `src/lib/storage.ts`.
- **Negatif**: menambah dependensi (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) dan ketergantungan pada layanan pihak ketiga; perlu mengelola kredensial & CORS.
- **Lain-lain**: wajib menetapkan **kebijakan retensi & kuota** berkas; validasi tipe/ukuran dilakukan di server saat presign; `.env.example` diperbarui. Uji unit mem-*mock* modul storage (tanpa memanggil R2). Selaras UU PDP: simpan seperlunya, hapus saat tugas dihapus.

## Alternatif yang dipertimbangkan
- **Disk lokal + volume EasyPanel** — tanpa dependensi cloud, tetapi terikat satu instance, hilang saat redeploy tanpa volume, dan backup manual; ditolak.
- **Cloudinary / UploadThing** — integrasi cepat, tetapi kuota/biaya dan kurang netral untuk beragam berkas; ditolak sebagai default.
- **Simpan `bytea` di PostgreSQL** — sederhana tetapi membebani DB dan backup; ditolak.
- **MinIO self-hosted** — tetap didukung (S3-compatible), namun menambah komponen infra untuk dikelola; ditunda.
