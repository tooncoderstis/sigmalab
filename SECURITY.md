# Kebijakan Keamanan

## Melaporkan kerentanan
Jangan buka issue publik. Kirim email ke `security@sigmalab.example` (ganti dengan alamat asli) dengan langkah reproduksi. Kami akan menindaklanjuti dalam 7 hari.

## Praktik
- Jangan commit rahasia (`.env` di-ignore git).
- Rotasi kredensial yang pernah terekspos.
- Jalankan dependency audit & secret scan di CI.
- Ikuti OWASP ASVS untuk verifikasi keamanan.
- Verifikasi signature webhook pembayaran sebelum mengubah status.

## Data pribadi
Proyek menyimpan data pribadi (nama, email, progres, submission). Selaras UU PDP No. 27/2022: minimalisasi data, kontrol akses berbasis peran, dan prosedur penanganan insiden.
