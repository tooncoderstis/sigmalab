// Logika buku ajar (murni, mudah diuji). Lihat ADR-0012.

export type CopyStatusValue =
  | "AVAILABLE"
  | "LENT"
  | "LOST"
  | "DAMAGED"
  | "RETIRED";

export type DistributionStatusValue = "LENT" | "RETURNED" | "LOST";

export type CopySummary = {
  total: number;
  available: number;
  lent: number;
  lost: number;
  damaged: number;
  retired: number;
};

/** Rekap ketersediaan eksemplar per judul buku. */
export function summarizeCopies(copies: { status: string }[]): CopySummary {
  const summary: CopySummary = {
    total: copies.length,
    available: 0,
    lent: 0,
    lost: 0,
    damaged: 0,
    retired: 0,
  };
  for (const copy of copies) {
    switch (copy.status) {
      case "AVAILABLE":
        summary.available += 1;
        break;
      case "LENT":
        summary.lent += 1;
        break;
      case "LOST":
        summary.lost += 1;
        break;
      case "DAMAGED":
        summary.damaged += 1;
        break;
      case "RETIRED":
        summary.retired += 1;
        break;
    }
  }
  return summary;
}

export type TransitionResult = {
  allowed: boolean;
  copyStatus: CopyStatusValue;
  distributionStatus: DistributionStatusValue;
};

/** Distribusi buku: hanya eksemplar AVAILABLE yang bisa dipinjam. */
export function borrowTransition(copyStatus: string): TransitionResult {
  if (copyStatus !== "AVAILABLE") {
    return { allowed: false, copyStatus: "AVAILABLE", distributionStatus: "LENT" };
  }
  return { allowed: true, copyStatus: "LENT", distributionStatus: "LENT" };
}

/** Pengembalian buku: eksemplar kembali tersedia. */
export function returnTransition(): TransitionResult {
  return { allowed: true, copyStatus: "AVAILABLE", distributionStatus: "RETURNED" };
}

/** Buku hilang: eksemplar ditandai hilang. */
export function lostTransition(): TransitionResult {
  return { allowed: true, copyStatus: "LOST", distributionStatus: "LOST" };
}
