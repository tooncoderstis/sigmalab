// Logika perpustakaan (murni, mudah diuji). Lihat ADR-0013.

export const DEFAULT_FINE_PER_DAY = 1000; // Rupiah

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isOverdue(dueAt: Date | null | undefined, now = new Date()): boolean {
  return Boolean(dueAt && dueAt.getTime() < now.getTime());
}

/** Denda keterlambatan dalam Rupiah (0 bila tidak lewat tenggat). */
export function computeFine(
  dueAt: Date | null | undefined,
  returnedAt: Date | null | undefined,
  ratePerDay = DEFAULT_FINE_PER_DAY
): number {
  if (!dueAt) return 0;
  const end = returnedAt ?? new Date();
  const days = Math.floor((end.getTime() - dueAt.getTime()) / MS_PER_DAY);
  return days > 0 ? days * ratePerDay : 0;
}

/** Status peminjaman saat ini (belum dikembalikan). */
export function loanStatus(
  dueAt: Date | null | undefined,
  returnedAt: Date | null | undefined,
  now = new Date()
): "RETURNED" | "OVERDUE" | "LENT" {
  if (returnedAt) return "RETURNED";
  return isOverdue(dueAt, now) ? "OVERDUE" : "LENT";
}
