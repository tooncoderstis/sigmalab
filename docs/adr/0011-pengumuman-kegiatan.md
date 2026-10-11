# ADR-0011: Pengumuman & kegiatan sekolah (audiens + tanda dibaca)

- **Status**: Diterima
- **Tanggal**: 2026-10-11
- **Terkait**: melengkapi Fase 2 ([ADR-0010](0010-domain-penilaian-rapor.md))

## Konteks
Fase 2 membutuhkan kanal informasi satu-arah dari instansi ke warga sekolah: **pengumuman** (informasi penting, perlu diketahui siapa yang sudah membaca) dan **kegiatan sekolah** (agenda/acara dengan jadwal). Audiens beragam: semua, per-peran (guru/siswa/wali/staf), per-kelas, atau per-program. Instansi menjalankan satu deploy dengan peran multi (`UserRole`) dan kelas/rombel yang sudah dimodelkan di Fase 1.

## Keputusan
- Menambah `Announcement` (+ `AnnouncementTarget`, `AnnouncementRead`) dan `SchoolActivity` (+ `ActivityTarget`).
- **Targeting fleksibel** lewat tabel target: `audienceAll` (boolean) atau baris target dengan salah satu dari `role` / `classId` / `programId`. Satu pengumuman/kegiatan boleh punya beberapa target.
- **Tanda dibaca hanya untuk pengumuman** (`AnnouncementRead`, unik per pengumuman+user). Kegiatan tidak dilacak baca.
- **Visibilitas** dihitung di `src/lib/audience.ts` (fungsi murni + pembuat filter Prisma): konten terlihat bila `audienceAll` atau salah satu target cocok dengan konteks user (peran yang dimiliki, kelas tempat ia terdaftar/mengajar, atau program pada profil siswa). `ADMIN`/`SUPER_ADMIN` melihat semua.
- Pengumuman punya alur **DRAF → TERBIT** (`publishedAt`) seperti rapor; isi mendukung **Markdown** (reuse `react-markdown`).
- Notifikasi push/email **di luar cakupan** (menyusul Fase 5).

## Alasan
- Tabel target menampung kombinasi audiens tanpa menambah kolom/ternormalisasi berlebihan, dan mudah diperluas.
- Memisahkan "siapa yang tertuju" dari "siapa yang sudah baca" menjaga model sederhana.
- Perhitungan visibilitas sebagai fungsi murni memudahkan pengujian dan konsistensi antara API dan server component.

## Konsekuensi
- **Positif**: kanal informasi seragam untuk semua peran; audiens fleksibel; read-receipt untuk pengumuman penting.
- **Negatif**: query visibilitas perlu menggabungkan peran + keanggotaan kelas/program (dibungkus helper agar rapi).
- **Lain-lain**: `ADMIN`/`SUPER_ADMIN` melihat semua untuk pengelolaan; migrasi additive tanpa mengubah data lama. Selaras UU PDP: hanya menyimpan status baca, bukan data berlebih.

## Alternatif yang dipertimbangkan
- **Kolom enum audiens tunggal** — tidak cukup untuk kombinasi peran+kelas+program; ditolak.
- **Read-receipt untuk kegiatan juga** — menambah tabel/traffic tanpa kebutuhan jelas; ditolak (dapat ditambah menyusul).
- **Push/email langsung** — memerlukan infrastruktur notifikasi (Fase 5); ditunda.
