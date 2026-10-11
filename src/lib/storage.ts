import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Penyimpanan objek S3-compatible (Cloudflare R2 / MinIO). Lihat ADR-0009.
// Kredensial hanya dari environment; jangan pernah di-hardcode.

export const UPLOAD_URL_EXPIRES_IN = 300; // detik
export const DOWNLOAD_URL_EXPIRES_IN = 300; // detik

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Konfigurasi storage belum lengkap: ${name} tidak diatur`);
  }
  return value;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: requiredEnv("S3_ENDPOINT"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

function getBucket(): string {
  return requiredEnv("S3_BUCKET");
}

function sanitizeFileName(fileName: string): string {
  const base = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base.slice(-120) : "berkas";
}

/** Membuat object key unik untuk berkas tugas siswa. */
export function buildAssignmentKey(
  assessmentId: string,
  studentId: string,
  fileName: string
): string {
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `assignments/${assessmentId}/${studentId}/${unique}-${sanitizeFileName(
    fileName
  )}`;
}

/** URL presigned untuk mengunggah (PUT) berkas langsung ke storage. */
export async function createUploadUrl(
  key: string,
  contentType: string,
  contentLength?: number
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn: UPLOAD_URL_EXPIRES_IN }
  );
}

/** URL presigned untuk mengunduh (GET) berkas. */
export async function createDownloadUrl(
  key: string,
  fileName?: string
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ResponseContentDisposition: fileName
        ? `attachment; filename="${sanitizeFileName(fileName)}"`
        : undefined,
    }),
    { expiresIn: DOWNLOAD_URL_EXPIRES_IN }
  );
}

/** Menghapus objek (dipakai saat submission/assessment dihapus). */
export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}
