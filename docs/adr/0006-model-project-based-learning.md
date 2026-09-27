# ADR-0006: Model project-based learning

- **Status**: Diterima
- **Tanggal**: 2026-09-27

## Konteks
Nilai jual SigmaLab adalah peserta menyelesaikan **project nyata**, bukan sekadar menonton video. Skema saat ini sudah memiliki `Course → Module → Lesson` (tipe VIDEO/QUIZ/SUBMISSION/ARTICLE), `Submission` (repo/file, status PENDING/APPROVED/REJECTED, feedback, reviewer), `Progress`, dan `Certificate`. Yang belum ditetapkan adalah bagaimana project dinilai dan bagaimana kelulusan ditentukan.

## Keputusan
Model belajar berbasis project dengan pola: **lesson bertipe `SUBMISSION` membawa brief + rubrik**, peserta mengirim `repoUrl` + catatan, **REVIEWER/ADMIN** menilai (APPROVED/REJECTED) dengan feedback tertulis, peserta boleh **resubmit**, dan **sertifikat terbit** saat seluruh syarat kelas (lesson selesai + submission disetujui) terpenuhi. `certCode` unik dipakai untuk verifikasi publik.

## Alasan
- Memaksa output nyata → bukti keterampilan & portofolio peserta.
- Rubrik membuat penilaian konsisten dan transparan antar reviewer.
- Sertifikat dengan kode verifikasi menambah kredibilitas tanpa membocorkan data pribadi.

## Konsekuensi
- **Positif**: pembeda produk yang jelas; jalur review manusia menjadi keunggulan.
- **Negatif**: reviewer bisa menjadi bottleneck; perlu SLA dan rubrik yang baik.
- **Lain-lain**: brief + rubrik mungkin butuh kolom/entitas tambahan (mis. `projectBrief`, kriteria) — perubahan skema dicatat lewat migrasi & ADR baru bila signifikan.

## Alternatif yang dipertimbangkan
- **Auto-grading saja** — murah & skalabel, tetapi tidak cocok untuk project terbuka dan mudah diakali.
- **Tanpa sertifikat** — mengurangi motivasi & kredibilitas kelulusan.
- **Peer review** — menarik untuk skala, ditunda; fase awal fokus reviewer manusia.
