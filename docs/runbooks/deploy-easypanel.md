# Runbook Deploy — EasyPanel (Docker Image)

Pola: build image **lokal** → push ke registry → EasyPanel menarik image bertag. Rollback = ganti tag ke versi sebelumnya.

## Prasyarat
- Akses VPS EasyPanel + project/service sudah dibuat.
- PostgreSQL berjalan (mis. di VPS yang sama) dan `DATABASE_URL` tersedia.
- Kredensial registry container (mis. GitHub Container Registry / Docker Hub).
- Kredensial Mayar (sandbox/produksi) dan `AUTH_SECRET`.
- **Bucket object storage S3-compatible** (Cloudflare R2 / MinIO) untuk berkas tugas (ADR-0009) + CORS `PUT` dari domain aplikasi.

## 1. Build & push (lokal)
```powershell
powershell -File deploy/easypanel-docker/build-push.ps1 -Image <registry>/<image> -Tag 0.1.0 -Push
```

## 2. EasyPanel
1. Project → Create Service → **App**.
2. Source: **Docker Image** → isi `<registry>/<image>:0.1.0` (+ kredensial bila private).
3. Port: container `3000` → expose ke domain. Aktifkan **HTTPS (Let's Encrypt)**.
4. **Environment**: salin dari `.env.production.example` dan isi nilai aslinya, termasuk `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
   - R2: endpoint `https://<accountid>.r2.cloudflarestorage.com`, `S3_REGION=auto`. Buat bucket, atur **CORS** (izinkan `PUT`/`GET` dari domain app), lalu buat token akses S3.
   - Berkas tugas tak pernah menetap di container (stateless) — tidak perlu volume.

## 3. Migrasi database
Entrypoint image mendukung migrasi terkontrol:
- Set `RUN_MIGRATIONS=true` pada deploy pertama → container menjalankan `prisma migrate deploy` sebelum start, **atau**
- Jalankan manual dari container/console: `node ./node_modules/prisma/build/index.js migrate deploy`.

Setelah migrasi stabil, kembalikan `RUN_MIGRATIONS=false` agar start tetap cepat.

## 4. Verifikasi pasca-deploy
- `GET /api/health` → `200` dengan status DB.
- Landing & katalog tampil; route terproteksi menolak anonim.
- Checkout membuat invoice (sandbox) dan webhook mengubah status pembayaran.

## 5. Rollback
Ubah tag image ke versi sebelumnya di EasyPanel → Deploy. Tidak perlu rebuild.

## Keamanan & operasional
- Rotasi kredensial yang pernah terekspos; gunakan password DB kuat.
- **Backup terjadwal** PostgreSQL (mis. `pg_dump` harian) + uji restore berkala.
- Pantau log container untuk error route & webhook.
- Jangan pernah menaruh rahasia di repo; hanya via env EasyPanel.
