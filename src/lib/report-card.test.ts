import { describe, expect, it } from "vitest";
import {
  computeFinalScore,
  predicate,
  predicateDescription,
} from "./report-card";

describe("computeFinalScore", () => {
  it("mengembalikan null tanpa nilai", () => {
    expect(computeFinalScore([])).toBeNull();
  });

  it("menghitung rata-rata sederhana", () => {
    expect(
      computeFinalScore([
        { score: 80, maxScore: 100, weight: 1 },
        { score: 90, maxScore: 100, weight: 1 },
      ])
    ).toBe(85);
  });

  it("menghormati bobot", () => {
    // 100 (bobot 3) + 50 (bobot 1) = 350/4 = 87.5
    expect(
      computeFinalScore([
        { score: 100, maxScore: 100, weight: 3 },
        { score: 50, maxScore: 100, weight: 1 },
      ])
    ).toBe(87.5);
  });

  it("menormalisasi skor maksimum berbeda", () => {
    // 40/50 = 80, 30/30 = 100 → (80+100)/2 = 90
    expect(
      computeFinalScore([
        { score: 40, maxScore: 50, weight: 1 },
        { score: 30, maxScore: 30, weight: 1 },
      ])
    ).toBe(90);
  });

  it("mengabaikan entri tidak valid", () => {
    expect(
      computeFinalScore([
        { score: 100, maxScore: 0, weight: 1 },
        { score: 80, maxScore: 100, weight: 1 },
      ])
    ).toBe(80);
  });

  it("membatasi skor di luar rentang", () => {
    expect(
      computeFinalScore([{ score: 120, maxScore: 100, weight: 1 }])
    ).toBe(100);
  });
});

describe("predicate", () => {
  it("memetakan ambang batas", () => {
    expect(predicate(90)).toBe("A");
    expect(predicate(85)).toBe("A");
    expect(predicate(80)).toBe("B");
    expect(predicate(75)).toBe("B");
    expect(predicate(65)).toBe("C");
    expect(predicate(59)).toBe("D");
  });

  it("menyediakan deskripsi untuk tiap predikat", () => {
    for (const p of ["A", "B", "C", "D"] as const) {
      expect(predicateDescription(p).length).toBeGreaterThan(0);
    }
  });
});
