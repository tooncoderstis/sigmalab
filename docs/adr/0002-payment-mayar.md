# ADR-0002: Pembayaran via Mayar + hardening webhook

- **Status**: Diterima
- **Tanggal**: 2026-09-27

## Konteks
Kursus premium memerlukan pembayaran. Menyimpan data kartu sendiri akan menyeret SigmaLab ke scope PCI-DSS penuh — tidak sepadan untuk tim kecil. Mayar menyediakan hosted checkout (invoice) dengan webhook untuk notifikasi status. Saat ini sistem masih memakai kredensial **sandbox** dan key ber-scope read-only.

## Keputusan
Gunakan **Mayar hosted checkout** (`POST /hl/v2/invoices/create`). Sistem **tidak pernah menyimpan data kartu**; scope PCI ditekan menjadi minimal. Base URL mengikuti environment resmi Mayar: `https://api.mayar.io/hl/v2` (sandbox) / `https://api.mayar.id/hl/v2` (produksi). Webhook **wajib diverifikasi** sebelum mengubah status pembayaran dan harus **idempoten**.

## Alasan
- Menghindari beban kepatuhan PCI penuh.
- Mayar menangani beragam channel pembayaran lokal (VA, QRIS, e-wallet).
- Invoice + webhook sudah didukung dengan model data yang ada (`Payment`, `merchantRefId`).

## Konsekuensi
- **Positif**: kepatuhan lebih ringan, integrasi cepat, redirect checkout standar.
- **Negatif**: ketergantungan pada pihak ketiga; jika host pembayaran tidak dapat diakses dari server deploy, checkout gagal (mitigasi: timeout + pesan error yang jelas).
- **Lain-lain**: perlu key **Read & Write** di produksi dan verifikasi signature webhook. Host sandbox lama `api.mayar.club` sudah tidak dipakai.

## Alternatif yang dipertimbangkan
- **Integrasi payment gateway langsung (Midtrans/Xendit)** — scope lebih besar, rekonsiliasi manual.
- **Transfer bank manual + verifikasi admin** — friksi tinggi, tidak skalabel.
- **Menyimpan data kartu sendiri** — ditolak: risiko & kepatuhan tidak sepadan.
