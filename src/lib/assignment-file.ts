// Konstanta berkas tugas (tanpa dependensi zod) agar aman dipakai di klien.
export const assignmentFileTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const MAX_ASSIGNMENT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export const assignmentFileAccept = assignmentFileTypes.join(",");

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
