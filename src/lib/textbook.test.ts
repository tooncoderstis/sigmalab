import { describe, expect, it } from "vitest";
import {
  borrowTransition,
  lostTransition,
  returnTransition,
  summarizeCopies,
} from "./textbook";

describe("summarizeCopies", () => {
  it("menghitung status eksemplar", () => {
    const summary = summarizeCopies([
      { status: "AVAILABLE" },
      { status: "AVAILABLE" },
      { status: "LENT" },
      { status: "LOST" },
      { status: "DAMAGED" },
      { status: "RETIRED" },
    ]);
    expect(summary).toEqual({
      total: 6,
      available: 2,
      lent: 1,
      lost: 1,
      damaged: 1,
      retired: 1,
    });
  });

  it("kosong menghasilkan nol", () => {
    expect(summarizeCopies([])).toMatchObject({ total: 0, available: 0 });
  });
});

describe("transisi distribusi", () => {
  it("boleh pinjam hanya bila AVAILABLE", () => {
    expect(borrowTransition("AVAILABLE")).toEqual({
      allowed: true,
      copyStatus: "LENT",
      distributionStatus: "LENT",
    });
    expect(borrowTransition("LENT").allowed).toBe(false);
    expect(borrowTransition("LOST").allowed).toBe(false);
  });

  it("pengembalian mengembalikan ke AVAILABLE", () => {
    expect(returnTransition()).toEqual({
      allowed: true,
      copyStatus: "AVAILABLE",
      distributionStatus: "RETURNED",
    });
  });

  it("hilang menandai eksemplar LOST", () => {
    expect(lostTransition()).toEqual({
      allowed: true,
      copyStatus: "LOST",
      distributionStatus: "LOST",
    });
  });
});
