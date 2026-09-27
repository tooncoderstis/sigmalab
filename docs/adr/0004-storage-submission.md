# ADR-0004: Penyimpanan submission (link repo fase awal)

- **Status**: Diterima
- **Tanggal**: 2026-09-27
- **Catatan**: menunda unggah file; dievaluasi ulang saat Fase 2/3 PRD.

## Konteks
Fitur inti SigmaLab adalah submission project. Model `Submission` sudah menyediakan `repoUrl` dan `fileUrl`. Menyediakan unggah file menuntut object storage, kebijakan retensi, kuota, pemindaian konten, dan biaya — sementara mayoritas project belajar (kode/analisis) wajar dibagikan sebagai repositori Git.

## Keputusan
Fase awal, submission menggunakan **link repositori** (`repoUrl`) sebagai kanal utama. Kolom `fileUrl` dipertahankan di skema namun belum diaktifkan. Unggah file ditunda sampai ada kebutuhan terbukti.

## Alasan
- Menghindari biaya & kompleksitas object storage sebelum product-market fit.
- Link repo langsung menunjukkan riwayat kerja peserta (commit), bernilai untuk penilaian.
- Mengurangi risiko data (tidak menyimpan berkas pribadi lebih dari perlu) — selaras UU PDP.

## Konsekuensi
- **Positif**: implementasi cepat, biaya nol, jejak kerja terverifikasi.
- **Negatif**: peserta non-kode (mis. project desain/analisis) belum terakomodasi penuh.
- **Lain-lain**: saat unggah diaktifkan, perlu ADR baru untuk memilih storage (S3-compatible/R2, Cloudinary, atau UploadThing) beserta kebijakan retensi.

## Alternatif yang dipertimbangkan
- **Cloudinary** — praktis untuk media, tapi biaya/kuota dan kurang ideal untuk repositori kode.
- **UploadThing** — integrasi cepat, tetap menambah ketergantungan & biaya.
- **S3-compatible (R2/MinIO)** — pilihan kuat, ditunda sampai kebutuhan jelas.
