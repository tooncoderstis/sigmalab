# Dokumentasi SigmaLab

Index dokumen proyek. Mulai dari [`../STATUS.md`](../STATUS.md) untuk kondisi terkini.

## Dokumen tingkat proyek
- [`../PRD.md`](../PRD.md) — kebutuhan produk (apa & kenapa), fase, model data, NFR, kepatuhan.
- [`../STATUS.md`](../STATUS.md) — status & progres (sumber kebenaran).
- [`../CHANGELOG.md`](../CHANGELOG.md) — riwayat rilis (Keep a Changelog + SemVer).
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — alur kontribusi & DoD.

## Arsitektur & keputusan
- [`adr/`](adr/) — Architecture Decision Records. Lihat [`adr/README.md`](adr/README.md).

## Operasional
- [`runbooks/`](runbooks/) — prosedur operasional (deploy, insiden, backup).

## Konvensi
- Commit mengikuti [Conventional Commits](https://www.conventionalcommits.org).
- Rahasia hanya di environment/`.env` (di-ignore git); contoh ada di `.env.example` & `.env.production.example`.
