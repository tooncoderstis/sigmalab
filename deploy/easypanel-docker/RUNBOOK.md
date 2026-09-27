# Runbook Deploy — SigmaLab (EasyPanel / Docker Image)

Dokumen ini adalah titik masuk deploy. Langkah lengkap: [`docs/runbooks/deploy-easypanel.md`](../../docs/runbooks/deploy-easypanel.md).

Ringkas:
1. Build & push image:
   ```powershell
   powershell -File deploy/easypanel-docker/build-push.ps1 -Image <registry>/<image> -Tag 0.1.0 -Push
   ```
2. EasyPanel → App → **Source: Docker Image** → `<registry>/<image>:0.1.0`, port `3000`, aktifkan HTTPS.
3. Set environment dari `.env.production.example`. Deploy pertama: `RUN_MIGRATIONS=true`, lalu `false`.
4. Verifikasi `GET /api/health` → `200`.
5. Rollback: ganti tag ke versi sebelumnya → Deploy.
