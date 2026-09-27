<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Bootstrap (WAJIB DIBACA DULU)

> Hemat token & jaga konteks antar sesi. Urutan baca:
> 1. `STATUS.md` — kondisi & pekerjaan terkini (satu-satunya sumber kebenaran progres).
> 2. `PRD.md` — **jangan baca penuh**; hanya buka section yang relevan dengan tugas.
> 3. `docs/adr/` — 1–2 ADR yang terkait perubahan.
> 4. Ekor `CHANGELOG.md` bila perlu konteks rilis.

Aturan kerja:
- Ikuti DoD: `kode → test → formatter → entri CHANGELOG → update STATUS → ADR bila keputusan`.
- Conventional Commits; jangan commit rahasia (`.env` di-ignore).
- Setiap route/endpoint ber-mutasi harus punya test.
- Untuk proyek baru/scaffold, gunakan skill `aasaprojectkit`.
