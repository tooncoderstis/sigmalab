// Komputasi nilai & rapor (murni, mudah diuji). Lihat ADR-0010.

export type WeightedGrade = {
  score: number;
  maxScore: number;
  weight: number;
};

export type Predicate = "A" | "B" | "C" | "D";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Nilai akhir berbobot dalam skala 0-100.
 * `Σ((score/maxScore)×weight) / Σweight × 100`.
 * Mengembalikan null bila tidak ada nilai valid.
 */
export function computeFinalScore(grades: WeightedGrade[]): number | null {
  const valid = grades.filter(
    (g) =>
      Number.isFinite(g.score) &&
      Number.isFinite(g.maxScore) &&
      Number.isFinite(g.weight) &&
      g.maxScore > 0 &&
      g.weight > 0
  );
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight === 0) return null;

  const weighted = valid.reduce(
    (sum, g) => sum + (clamp(g.score, 0, g.maxScore) / g.maxScore) * g.weight,
    0
  );
  return round1((weighted / totalWeight) * 100);
}

/** Predikat huruf dari nilai akhir 0-100 (ambang tetap). */
export function predicate(score: number): Predicate {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  return "D";
}

/** Deskripsi capaian sederhana berdasarkan predikat. */
export function predicateDescription(pred: Predicate): string {
  switch (pred) {
    case "A":
      return "Sangat baik, menguasai kompetensi dengan sangat baik.";
    case "B":
      return "Baik, menguasai kompetensi dengan baik.";
    case "C":
      return "Cukup, perlu peningkatan pada beberapa kompetensi.";
    default:
      return "Perlu bimbingan dan pendampingan lebih lanjut.";
  }
}
