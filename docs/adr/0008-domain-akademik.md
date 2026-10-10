# ADR-0008: Domain akademik & relasi ke Course

- **Status**: Diterima
- **Tanggal**: 2026-10-10

## Konteks
Fase 1 perlu memodelkan operasional akademik sekolah/bimbel/kampus: tahun ajaran & term, program (jenjang/jurusan), mata pelajaran, kelas (rombel), keanggotaan siswa, penugasan guru, serta presensi siswa dan guru. Di sisi lain, model lama `Course → Module → Lesson` (marketplace, self-paced, berbayar) harus tetap berjalan.

## Keputusan
- Menambah entitas akademik: `AcademicYear`, `Term`, `Program`, `Subject`, `AcademicClass`, `ClassEnrollment`, `TeachingAssignment`, `AttendanceSession`, `AttendanceRecord`, `TeacherAttendance`, plus profil (`StudentProfile`, `TeacherProfile`, `StaffProfile`, `GuardianProfile`).
- `AcademicClass` **memiliki `courseId` opsional** ke `Course` lama: kelas akademik memakai `Course` sebagai **materi belajar**, tetapi bisa berdiri sendiri tanpa materi.
- Presensi dimodelkan per **sesi pertemuan** (`AttendanceSession`) dengan status per siswa (`AttendanceRecord`: `PRESENT/LATE/ABSENT/SICK/EXCUSED`). Presensi guru (`TeacherAttendance`) harian (check-in/out), unik per guru+tanggal.
- Satu instansi per deploy → **tidak ada `tenantId`**.
- Penilaian & rapor **ditunda ke Fase 2** sesuai keputusan produk.

## Alasan
- Memisahkan konsep "kursus mandiri" (`Course`) dari "kelas terjadwal" (`AcademicClass`) menghindari pencampuran semantik dan menjaga marketplace tetap utuh.
- Presensi berbasis sesi memberi fleksibilitas jadwal sekaligus rekap per siswa/kelas.
- Tanpa `tenantId` menjaga skema & query sederhana untuk model satu-instansi.

## Konsekuensi
- **Positif**: fondasi SIS ringan di atas fondasi LMS yang ada; bahan ajar dari marketplace dapat dipakai ulang (`AcademicClass.courseId`).
- **Negatif**: dua model "kelas" (`Course` vs `AcademicClass`) bisa membingungkan; didokumentasikan di PRD.
- **Lain-lain**: input nilai/rapor menyusul di Fase 2 (`Assignment`, `Grade`, `ReportCard`).

## Alternatif yang dipertimbangkan
- **Reuse `Course` sebagai kelas akademik** — memaksa atribut jadwal/kelas masuk ke `Course` dan mengaburkan marketplace; ditolak.
- **`tenantId` sejak awal** — tidak diperlukan untuk satu instansi/deploy; menambah kompleksitas; ditolak (bisa ditinjau bila beralih ke multi-tenant).
