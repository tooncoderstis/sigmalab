# ADR-0010: Domain penilaian, tugas & rapor (Fase 2)

- **Status**: Diterima
- **Tanggal**: 2026-10-11
- **Terkait**: memperluas [ADR-0008](0008-domain-akademik.md) (domain akademik Fase 1)

## Konteks
Fase 1 memodelkan struktur akademik (kelas, mapel, term) dan presensi, tetapi menunda penilaian. Fase 2 memerlukan: tugas (dengan pengumpulan berkas), penilaian (nilai per aktivitas), rekap nilai per mapel, dan rapor sederhana per siswa per term dalam bentuk PDF. Presensi sudah memakai pola "sesi + record per siswa" yang dapat dijadikan rujukan.

## Keputusan
- Menambah entitas: `Assessment` (aktivitas penilaian: TUGAS/ULANGAN/UTS/UAS/PRAKTIK/PROYEK), `AssignmentSubmission` (unggah berkas siswa), `Grade` (nilai per siswa per assessment), `ReportCard` + `ReportCardEntry` (rapor per siswa per term).
- `Assessment` terikat pada `AcademicClass` dan opsional `Subject`/`Term`, punya `maxScore`, `weight`, `dueAt`, dan `published` (mengontrol visibilitas nilai ke siswa/wali).
- Nilai disimpan terpisah dari pengumpulan berkas (`Grade` ≠ `AssignmentSubmission`) agar tipe penilaian tanpa berkas (ulangan/UTS/UAS) memakai model yang sama.
- **Nilai akhir mapel** = rata-rata berbobot nilai yang sudah dipublikasikan (`Σ(score/maxScore×weight)/Σweight×100`), dihitung di fungsi murni `src/lib/report-card.ts`.
- **Predikat** (A/B/C/D) dari ambang tetap; **rapor** dihasilkan *on-demand* sebagai PDF dengan `@react-pdf/renderer` (Node runtime), disimpan opsional key-nya bila perlu arsip.
- Berkas tugas memakai storage S3-compatible ([ADR-0009](0009-storage-objek-tugas.md)).

## Alasan
- Memisahkan aktivitas (`Assessment`) dari hasil (`Grade`) memberi fleksibilitas bobot & jenis penilaian tanpa menduplikasi model.
- Perhitungan nilai di fungsi murni → mudah diuji dan konsisten antara UI, API, dan PDF.
- Rapor on-demand menghindari penyimpanan berkas besar yang tidak perlu; PDF deterministik dari data.

## Konsekuensi
- **Positif**: fondasi penilaian fleksibel (berbobot, bertipe), rekap & rapor seragam; mengikuti pola presensi yang sudah terbukti.
- **Negatif**: dua entitas untuk tugas (aktivitas vs pengumpulan) menambah sedikit kompleksitas; ambang predikat masih tetap (belum konfigurabel).
- **Lain-lain**: visibilitas nilai dijaga flag `published`; unit test fokus pada komputasi nilai & predikat dan otorisasi per kelas. Nilai/rapor tidak masuk cakupan `Course` marketplace lama.

## Alternatif yang dipertimbangkan
- **Menempel nilai pada `AssignmentSubmission`** — menyulitkan penilaian tanpa berkas dan mencampur pengumpulan dengan penilaian; ditolak.
- **Rapor disimpan sebagai PDF permanen saat generate** — menambah storage & kompleksitas versi tanpa manfaat jelas; cukup on-demand.
- **Reuse `Submission` marketplace** — semantiknya review project/kursus, bukan penilaian akademik berbobot; ditolak.
