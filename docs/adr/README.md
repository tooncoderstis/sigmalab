# Architecture Decision Records (ADR)

Catatan keputusan arsitektur SigmaLab, mengikuti format [ADR (Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Aturan: satu keputusan = satu file. Jangan ubah ADR lama; bila keputusan berubah, buat ADR baru dan tandai yang lama `Digantikan oleh ADR-XXXX`.

| # | Judul | Status |
|---|---|---|
| [0001](0001-stack-arsitektur.md) | Stack & arsitektur aplikasi | Diterima |
| [0002](0002-payment-mayar.md) | Pembayaran via Mayar + hardening webhook | Diterima |
| [0003](0003-strategi-testing.md) | Strategi pengujian (Vitest + Playwright) | Diterima |
| [0004](0004-storage-submission.md) | Penyimpanan submission (link repo fase awal) | Sebagian digantikan ADR-0009 |
| [0005](0005-deploy-easypanel.md) | Deploy EasyPanel via Docker image | Diterima |
| [0006](0006-model-project-based-learning.md) | Model project-based learning | Diterima |
| [0007](0007-peran-dan-rbac.md) | Peran multi-peran & RBAC | Diterima |
| [0008](0008-domain-akademik.md) | Domain akademik & relasi ke Course | Diterima |
| [0009](0009-storage-objek-tugas.md) | Penyimpanan file tugas siswa (S3-compatible) | Diterima |
| [0010](0010-domain-penilaian-rapor.md) | Domain penilaian, tugas & rapor (Fase 2) | Diterima |
| [0011](0011-pengumuman-kegiatan.md) | Pengumuman & kegiatan sekolah (audiens + tanda dibaca) | Diterima |
| [0012](0012-kurikulum-rpp-textbook.md) | Kurikulum/RPP & buku ajar (Fase 3) | Diterima |
| [0013](0013-perpustakaan-inventaris.md) | Perpustakaan & inventaris ATK/sarpras (Fase 4) | Diterima |
| [0014](0014-spp-notifikasi-audit-analitik.md) | SPP/billing, notifikasi, audit & analitik (Fase 5) | Diterima |

Template: [`0000-template.md`](0000-template.md).
