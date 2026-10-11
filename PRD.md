# PRD: SigmaLab

**Status**: dikembangkan — fondasi (auth, katalog, enrollment, progres, kuis, pembayaran) sudah berjalan; diperluas menjadi **portal belajar universal + manajemen sekolah/instansi** (LMS + SIS ringan). Fase 1 (akademik inti + presensi) sedang dibangun.
**Versi dokumen**: 0.2
**Terkait**: `STATUS.md`, `CHANGELOG.md`, `docs/adr/`

> Dokumen ini menjawab **apa & kenapa**. Progres ada di `STATUS.md`, riwayat rilis di `CHANGELOG.md`, keputusan teknis di `docs/adr/`.

## 1. Ringkasan Produk

SigmaLab adalah portal belajar **universal** untuk publik/komunitas (B2C) **sekaligus** manajemen sekolah/instansi (LMS + SIS ringan): bimbel sekolah, bimbel SNBT, mata kuliah, dan lembaga lain. Di sisi belajar, peserta tidak hanya menonton materi tetapi **menyelesaikan project nyata** yang direview mentor. Di sisi manajemen, instansi mengelola kelas, siswa, guru, program, tahun ajaran, dan **presensi** (siswa & guru).

Masalah yang diselesaikan: banyak kursus online berhenti di "menonton video" tanpa bukti keterampilan, dan banyak lembaga masih mengelola operasional akademik secara manual. SigmaLab menyatukan keduanya: output belajar nyata (repo/file project + rubrik) dan tata kelola akademik (kelas, keanggotaan, penugasan guru, presensi). Model bisnis: kursus gratis sebagai akuisisi, kursus premium via pembayaran Mayar; deployment satu instansi per deploy.

## 2. Prinsip Desain Utama

- **Belajar = mengerjakan.** Setiap kelas wajib punya minimal satu project submission dengan rubrik yang jelas.
- **Cepat dipahami, nol friksi** di sisi peserta: daftar → pilih kelas → kerjakan → submit → review.
- **Umpan balik manusia** (reviewer) sebagai nilai jual utama, bukan sekadar auto-grading.
- **Fondasi aman sejak awal**: data pribadi (UU PDP) dan pembayaran (scope PCI minimal via Mayar hosted).
- **Progres transparan**: peserta selalu tahu posisi, status submission, dan langkah berikutnya.
- **Redesain UI adalah track terpisah** (lihat §10).

## 3. Peran Pengguna (Roles)

Peran bersifat **multi-peran** (`UserRole`): satu user bisa memegang lebih dari satu peran. `User.role` menyimpan peran utama (lihat ADR-0007).

| Role | Deskripsi | Akses |
|---|---|---|
| GUEST/anonim | Belum login | Landing, katalog, detail kursus publik |
| LEARNER | Peserta kursus marketplace | Ikuti kelas, submit tugas, kuis, progres & sertifikat |
| REVIEWER | Mentor/penilai submission | Review & feedback submission |
| STUDENT | Siswa/mahasiswa instansi | Kelas akademik, presensi pribadi, materi |
| GUARDIAN | Wali murid | Pantau (read-only) presensi anak |
| TEACHER | Guru/tutor | Kelola kelas diampu, isi presensi, check-in |
| STAFF | Staf non-akademik | Modul perpustakaan/ATK (fase lanjutan) |
| ADMIN | Admin instansi | Kelola data akademik, pengguna, kelas, kursus, pembayaran |
| SUPER_ADMIN | Vendor/pemilik deploy | Akses penuh lintas modul & manajemen peran |

## 4. Fase / Modul Pengembangan

```
FASE 0 → Fondasi (selesai)         → auth, katalog, enrollment, progres, kuis, pembayaran, submission/review
FASE 1 → Akademik inti + presensi  → roles/RBAC, tahun ajaran/term, program, mapel, kelas, enrollment,
                                      penugasan guru, presensi siswa (per sesi) & presensi guru    [aktif]
FASE 2 → Penilaian & kegiatan       → tugas, nilai, rapor, kegiatan sekolah/manajerial, pengumuman
FASE 3 → Kurikulum & bahan ajar     → planning kurikulum/RPP, ketersediaan & distribusi textbook
FASE 4 → Perpustakaan & sarana      → sirkulasi buku, inventaris ATK/sarpras
FASE 5 → Integrasi & skala          → SPP/billing, notifikasi, audit, analitik
BACKLOG → gamifikasi, diskusi, mobile app, multi-tenant
```

### 4.1 Autentikasi & Akun
- Register/login kredensial (NextAuth v5, JWT), role-based.
- **Acceptance criteria**: user baru bisa daftar, login, logout; route terproteksi menolak anonim; role tersimpan di sesi.
- **Non-goals fase ini**: OAuth/SSO, 2FA.

### 4.2 Katalog & Detail Kursus
- Daftar kursus (gratis/premium), filter kategori/level, halaman detail.
- **Acceptance criteria**: kursus `isPublished` tampil; kursus non-publish tidak bocor ke publik.

### 4.3 Enrollment & Progres
- Enrollment gratis langsung aktif; progres per lesson (NOT_STARTED/IN_PROGRESS/COMPLETED).
- **Acceptance criteria**: enrollment unik per (user, course); progres tersimpan idempoten.

### 4.4 Kuis
- Kuis per lesson dengan passing score, menyimpan attempt & skor.
- **Acceptance criteria**: jawaban dinilai server-side; tidak ada kebocoran kunci jawaban ke client.

### 4.5 Project Brief & Rubrik (FASE 2)
- Lesson bertipe `SUBMISSION` punya brief project: deskripsi, deliverables, kriteria/rubrik.
- **Acceptance criteria**: brief tampil sebelum submit; rubrik terlihat peserta & reviewer.

### 4.6 Submission & Review (FASE 2)
- Peserta submit `repoUrl` + catatan (file upload menyusul — lihat ADR-0004).
- Reviewer memberi status APPROVED/REJECTED + feedback; peserta dapat resubmit.
- **Acceptance criteria**: hanya pemilik submission & reviewer/admin yang bisa akses; riwayat status tercatat.

### 4.7 Sertifikat & Verifikasi Publik (FASE 3)
- Sertifikat terbit saat seluruh syarat kelas selesai; punya `certCode` untuk verifikasi publik.
- **Acceptance criteria**: halaman verifikasi mengembalikan valid/invalid tanpa membocorkan data pribadi.

### 4.8 Pembayaran Premium (FASE 1 lanjutan)
- Checkout → invoice Mayar → webhook → enrollment aktif.
- **Acceptance criteria**: webhook terverifikasi, idempoten, status pembayaran konsisten.

### 4.9 Admin CMS (FASE 4)
- CRUD course/module/lesson/quiz, kelola reviewer & enrollment.
- **Acceptance criteria**: hanya ADMIN; perubahan tidak merusak data progres peserta.

### 4.10 Peran & RBAC (FASE 1)
- Multi-peran (`UserRole`), sesi memuat `role` + `roles`, penjagaan rute (`proxy.ts`) & API (`requireApiRole`).
- **Acceptance criteria**: user tanpa peran tidak bisa mengakses rute/API ber-peran; ADMIN/SUPER_ADMIN bisa kelola.

### 4.11 Struktur Akademik (FASE 1)
- Tahun ajaran → term, program (jenis/jenjang), mapel, kelas (rombel), keanggotaan siswa, penugasan guru.
- Kelas akademik boleh mereferensikan `Course` sebagai materi (opsional).
- **Acceptance criteria**: admin membuat program/kelas dan menambah siswa/guru; enrollment unik per (kelas, siswa); kapasitas kelas dihormati.

### 4.12 Presensi (FASE 1)
- Presensi siswa per sesi (HADIR/TERLAMBAT/ALPA/SAKIT/IZIN) dan presensi harian guru (check-in/out).
- **Acceptance criteria**: guru hanya bisa mengisi presensi kelas yang diampu; rekap presensi tersedia untuk siswa & wali.

### 4.13 Penilaian & Kegiatan (FASE 2)
- Aktivitas penilaian per kelas/mapel (TUGAS/ULANGAN/UTS/UAS/PRAKTIK/PROYEK) dengan skor maksimum & bobot.
- Tugas: siswa mengunggah berkas (object storage S3-compatible — ADR-0009); guru mengunduh & menilai.
- Nilai per siswa per aktivitas; nilai akhir mapel = rata-rata berbobot; predikat A/B/C/D.
- Rapor per siswa per term (PDF, `@react-pdf/renderer`), alur draf → terbit (dipublikasikan).
- **Pengumuman** (isi Markdown, alur draf→terbit, pin, kedaluwarsa) dengan audiens fleksibel (semua / per-peran / per-kelas / per-program) dan **tanda dibaca** per pengguna.
- **Kegiatan sekolah** (agenda dengan jadwal, lokasi, kategori) dengan audiens fleksibel.
- **Acceptance criteria**: guru pengampu dapat membuat aktivitas & mengisi nilai hanya untuk kelas yang diampu; siswa/wali hanya melihat nilai/rapor yang sudah dipublikasikan; nilai akhir dihitung dari aktivitas terpublikasi; rapor dapat diunduh sebagai PDF; pengumuman/kegiatan hanya terlihat oleh audiens yang ditargetkan (wali ikut audiens anak); pengumuman dapat ditandai sudah dibaca.

### 4.14 Kurikulum/RPP & Buku Ajar (FASE 3)
- **RPP** per kelas per pertemuan (`LessonPlan`, unik per `classId`+`meetingNo`): tujuan, kegiatan, sumber/media, penilaian, jadwal, alur draf→terbit.
- **Buku ajar (textbook)**: katalog (`Textbook`) dengan metadata + berkas digital opsional (S3), eksemplar per fisik (`TextbookCopy`, kode unik + status), dan distribusi eksemplar ke siswa (`TextbookDistribution`).
- Ketersediaan dihitung dari eksemplar `AVAILABLE`; distribusi mengubah status eksemplar.
- **Acceptance criteria**: guru pengampu mengelola RPP hanya untuk kelasnya; eksemplar tidak bisa dipinjam dua kali (hanya `AVAILABLE`); distribusi tercatat dan dapat dikembalikan/ditandai hilang; berkas e-book hanya dapat diunggah saat storage dikonfigurasi.

## 5. Model Data (ERD)

Entitas utama (detail di `schema.prisma`):

```mermaid
erDiagram
  User ||--o{ Enrollment : has
  User ||--o{ Progress : tracks
  User ||--o{ QuizAttempt : takes
  User ||--o{ Submission : submits
  User ||--o{ Certificate : earns
  User ||--o{ Payment : pays
  User ||--o{ CourseReview : reviews
  Category ||--o{ Course : groups
  Course ||--o{ Module : contains
  Module ||--o{ Lesson : contains
  Lesson ||--o| Quiz : has
  Quiz ||--o{ QuizQuestion : has
  Quiz ||--o{ QuizAttempt : recorded
  Lesson ||--o{ Submission : requires
  Course ||--o{ Enrollment : enrolled
  Course ||--o{ Certificate : issues
  Course ||--o{ Payment : paid

  %% Akademik (Fase 1)
  User ||--o{ UserRole : has
  User ||--o| StudentProfile : student
  User ||--o| TeacherProfile : teacher
  User ||--o| GuardianProfile : guardian
  GuardianProfile ||--o{ StudentProfile : guards
  AcademicYear ||--o{ Term : has
  Term ||--o{ AcademicClass : offers
  Program ||--o{ AcademicClass : groups
  Program ||--o{ Subject : has
  Subject ||--o{ AcademicClass : subject
  Course ||--o{ AcademicClass : material
  AcademicClass ||--o{ ClassEnrollment : enrolls
  User ||--o{ ClassEnrollment : student
  AcademicClass ||--o{ TeachingAssignment : taught_by
  User ||--o{ TeachingAssignment : teacher
  AcademicClass ||--o{ AttendanceSession : sessions
  AttendanceSession ||--o{ AttendanceRecord : records
  User ||--o{ AttendanceRecord : student
  User ||--o{ TeacherAttendance : check_in
```

Constraint penting:
- `Enrollment @@unique([userId, courseId])`, `Progress @@unique([userId, lessonId])`.
- `Certificate @@unique([userId, courseId])`, `certCode @unique`.
- `Module @@unique([courseId, order])`, `Lesson @@unique([moduleId, order])`.
- `Payment.mayarTransactionId` & `Payment.mayarInvoiceId` unik; `merchantRefId` untuk mencocokkan webhook.
- Cascade delete pada child (module/lesson/progress/submission).
- Akademik: `UserRole @@unique([userId, role])`, `Term @@unique([academicYearId, name])`,
  `Subject @@unique([programId, name])`, `AcademicClass @@unique([termId, programId, name])`,
  `ClassEnrollment @@unique([classId, studentId])`,
  `TeachingAssignment @@unique([classId, teacherId, subjectId])`,
  `AttendanceRecord @@unique([sessionId, studentId])`,
  `TeacherAttendance @@unique([teacherId, date])`.

## 6. Non-Functional Requirements

- **Performa**: halaman katalog/detail < 2s pada koneksi wajar; query terindeks.
- **Keamanan**: validasi input server-side (zod), RBAC, verifikasi signature webhook, rate limit endpoint sensitif, tanpa rahasia di repo.
- **Reliabilitas**: migrasi DB terkontrol; idempotensi pada webhook & progres.
- **Ketersediaan**: healthcheck `/api/health`; deploy mudah di-rollback (tag image).
- **Aksesibilitas**: target WCAG 2.1 AA dasar (kontras, fokus, alt, navigasi keyboard) — bagian dari track UI.
- **Observability**: logging terstruktur untuk error route & webhook; audit trail pembayaran (`rawWebhook`).

## 7. KPI & Metrik Keberhasilan

| Area | Metrik | Target |
|---|---|---|
| Aktivasi | Registrasi → mulai 1 lesson | ≥ 60% |
| Keterlibatan | Peserta yang submit ≥ 1 project | ≥ 30% |
| Kualitas | Median waktu review submission | ≤ 3 hari |
| Kelulusan | Peserta lulus + sertifikat | ≥ 20% dari enrolled |
| Bisnis | Konversi kursus premium | ≥ 2% dari pengunjung detail |
| Teknis | Error rate route API | < 1% |

## 8. Kepatuhan & Keamanan

- **UU PDP No. 27/2022**: dasar pemrosesan (consent saat registrasi), data minimization, hak akses/hapus, retensi, dan penanganan insiden. Data pribadi yang disimpan: nama, email, progres, submission.
- **PCI-DSS (scope minimal)**: tidak menyimpan data kartu; pembayaran dialihkan ke Mayar hosted checkout. Webhook wajib diverifikasi.
- **OWASP ASVS/Top 10**: validasi input, RBAC, manajemen sesi, secret management.
- **Status implementasi**: 🔴 belum — verifikasi webhook, validasi input, RBAC, dan kebijakan privasi ditrack sebagai pekerjaan Fase 1–2 (lihat `STATUS.md`).

## 9. Risiko & Mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| 1 | Webhook palsu → enrollment gratis | Tinggi | Verifikasi signature + idempotensi (`docs/adr/0002`) |
| 2 | Kebocoran data pribadi | Tinggi | RBAC, enkripsi in-transit, audit, secret di env |
| 3 | Reviewer bottleneck | Sedang | SLA review, dashboard antrian, rubrik jelas |
| 4 | Outbound ke Mayar gagal (mis. timeout) | Sedang | Timeout + error handling, alert, retry (sudah ada dasar di route) |
| 5 | Scope melebar (redesain UI) | Sedang | UI redesign sebagai track terpisah, di-hold |
| 6 | Kehilangan data DB | Tinggi | Backup terjadwal (`pg_dump`), uji restore |
| 7 | Kebocoran berkas tugas (object storage) | Sedang | Presigned URL berumur pendek, validasi tipe/ukuran, URL akses dicek per peran (ADR-0009) |

## 10. Out of Scope

- **Redesain UI/UX visual** — di-hold, punya strategi terpisah dari pemilik produk.
- OAuth/SSO, 2FA, mobile app.
- Unggah file submission **marketplace** ke object storage (fase awal pakai link repo — ADR-0004). *Berkas tugas akademik kini DIDUKUNG via ADR-0009.*
- Langganan/paket berulang & multi-tenant instansi.
- Diskusi komunitas, gamifikasi, forum.

## 11. Ringkasan Keputusan

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Pengguna utama | Publik/komunitas (B2C) |
| 2 | Tim | 2–5 orang → alur PR + review |
| 3 | Stack | Next.js 16 App Router + TS + Prisma + PostgreSQL + NextAuth v5 (ADR-0001) |
| 4 | Pembayaran | Mayar hosted, sandbox dulu + hardening webhook (ADR-0002) |
| 5 | Testing | Vitest + Playwright (ADR-0003) |
| 6 | Storage submission | Link repo fase awal (ADR-0004) |
| 7 | Deploy | EasyPanel via Docker image (ADR-0005) |
| 8 | Model belajar | Submission + review + sertifikat (ADR-0006) |
| 9 | Kepatuhan | UU PDP + PCI scope minimal via Mayar |
| 10 | Model penyewa | Satu instansi per deploy (tanpa `tenantId`) |
| 11 | Peran | Multi-peran (`UserRole`) + RBAC berlapis (ADR-0007) |
| 12 | Domain akademik | `AcademicClass` terpisah dari `Course`; presensi per sesi (ADR-0008) |
| 13 | Penilaian & rapor | Fase 2 dikerjakan bertahap: penilaian/tugas/rapor PDF + storage S3 (ADR-0009, ADR-0010); kegiatan & pengumuman menyusul |
