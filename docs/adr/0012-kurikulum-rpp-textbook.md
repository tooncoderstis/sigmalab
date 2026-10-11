# ADR-0012: Kurikulum/RPP & buku ajar (Fase 3)

- **Status**: Diterima
- **Tanggal**: 2026-10-11
- **Terkait**: melanjutkan Fase 2 ([ADR-0010](0010-domain-penilaian-rapor.md), [ADR-0011](0011-pengumuman-kegiatan.md))

## Konteks
Fase 3 PRD mencakup perencanaan pembelajaran (kurikulum/RPP) dan ketersediaan & distribusi **buku ajar (textbook)**. Kelas akademik (`AcademicClass`) sudah terikat term/program/mapel, dan guru pengampu sudah dimodelkan (`TeachingAssignment`). Buku ajar perlu dilacak per **eksemplar** agar ketersediaan akurat dan distribusi ke siswa dapat dipertanggungjawabkan. Buku ajar juga dapat berupa berkas digital (e-book).

## Keputusan
- **RPP**: entitas `LessonPlan` per kelas, unik per `meetingNo`, dengan `status` DRAF→TERBIT; dikelola guru pengampu kelas (`canManageClass`) atau manager.
- **Textbook**: `Textbook` (metadata + `fileKey` opsional untuk e-book), `TextbookCopy` (eksemplar berkode, `code @unique`, status `AVAILABLE/LENT/LOST/DAMAGED/RETIRED`), dan `TextbookDistribution` (distribusi eksemplar → siswa, status `LENT/RETURNED/LOST`).
- **Ketersediaan** dihitung dari jumlah eksemplar berstatus `AVAILABLE`; distribusi mengubah status eksemplar.
- **Pengelola**: RPP oleh guru pengampu (atau ADMIN/SUPER_ADMIN); textbook & distribusi oleh **STAFF**, ADMIN, SUPER_ADMIN. Area UI baru `/staf` + aturan `proxy.ts`.
- **Berkas e-book** memakai penyimpanan S3-compatible ([ADR-0009](0009-storage-objek-tugas.md)) dengan presigned URL + validasi tipe/ukuran.
- Tidak membuat entitas `Curriculum` terpisah pada fase ini; RPP + struktur mapel yang ada dianggap cukup (dapat ditambah menyusul).

## Alasan
- Pelacakan per eksemplar memberi ketersediaan akurat, mendukung audit distribusi, dan menjadi fondasi untuk sirkulasi perpustakaan (Fase 4).
- Memisahkan `TextbookCopy` dari `Textbook` memungkinkan banyak eksemplar per judul dengan kondisi berbeda.
- Reuse pola S3 & RBAC yang sudah ada menjaga konsistensi dan mengurangi kode baru.

## Konsekuensi
- **Positif**: perencanaan pembelajaran terdokumentasi; distribusi buku terlacak; fondasi siap untuk perpustakaan.
- **Negatif**: mengelola eksemplar per judul menambah langkah operasional; unggah e-book bergantung pada konfigurasi S3.
- **Lain-lain**: area `/staf` memperluas RBAC proxy; migrasi additive tanpa mengubah data lama. Tanpa S3, metadata & tautan luar tetap berfungsi (unggah berkas nonaktif).

## Alternatif yang dipertimbangkan
- **Berbasis jumlah stok** — lebih sederhana tetapi tidak dapat melacak kondisi/eksemplar dan merinci audit; ditolak.
- **Menyatukan textbook dengan perpustakaan (Fase 4)** — mencampur dua kebutuhan (buku ajar vs sirkulasi umum) dan menunda Fase 3; ditolak.
- **`Curriculum` penuh sejak awal** — menambah kompleksitas tanpa kebutuhan terverifikasi; ditunda.
