# Architecture Decision Records (ADR)

Catatan keputusan arsitektur SigmaLab, mengikuti format [ADR (Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Aturan: satu keputusan = satu file. Jangan ubah ADR lama; bila keputusan berubah, buat ADR baru dan tandai yang lama `Digantikan oleh ADR-XXXX`.

| # | Judul | Status |
|---|---|---|
| [0001](0001-stack-arsitektur.md) | Stack & arsitektur aplikasi | Diterima |
| [0002](0002-payment-mayar.md) | Pembayaran via Mayar + hardening webhook | Diterima |
| [0003](0003-strategi-testing.md) | Strategi pengujian (Vitest + Playwright) | Diterima |
| [0004](0004-storage-submission.md) | Penyimpanan submission (link repo fase awal) | Diterima |
| [0005](0005-deploy-easypanel.md) | Deploy EasyPanel via Docker image | Diterima |
| [0006](0006-model-project-based-learning.md) | Model project-based learning | Diterima |

Template: [`0000-template.md`](0000-template.md).
