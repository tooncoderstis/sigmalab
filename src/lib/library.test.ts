import { describe, expect, it } from "vitest";
import { computeFine, isOverdue, loanStatus } from "./library";

const DAY = 24 * 60 * 60 * 1000;

describe("isOverdue", () => {
  it("benar bila dueAt sudah lewat", () => {
    const now = new Date("2026-06-10T00:00:00Z");
    expect(isOverdue(new Date("2026-06-09T00:00:00Z"), now)).toBe(true);
    expect(isOverdue(new Date("2026-06-11T00:00:00Z"), now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
  });
});

describe("computeFine", () => {
  const now = new Date("2026-06-20T00:00:00Z");

  it("nol bila tidak lewat tenggat", () => {
    expect(computeFine(new Date("2026-06-25T00:00:00Z"), now, 1000)).toBe(0);
  });

  it("menghitung per hari keterlambatan", () => {
    // lewat 5 hari
    expect(computeFine(new Date("2026-06-15T00:00:00Z"), now, 1000)).toBe(5000);
  });

  it("memakai default rate bila tidak diberikan", () => {
    const due = new Date(now.getTime() - DAY);
    expect(computeFine(due, now)).toBeGreaterThan(0);
  });
});

describe("loanStatus", () => {
  const now = new Date("2026-06-20T00:00:00Z");

  it("RETURNED bila sudah dikembalikan", () => {
    expect(loanStatus(new Date("2026-06-15"), now, now)).toBe("RETURNED");
  });

  it("OVERDUE bila lewat dan belum kembali", () => {
    expect(loanStatus(new Date("2026-06-10"), null, now)).toBe("OVERDUE");
  });

  it("LENT bila belum jatuh tempo", () => {
    expect(loanStatus(new Date("2026-06-25"), null, now)).toBe("LENT");
  });
});
