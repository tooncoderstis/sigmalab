import { describe, expect, it } from "vitest";
import { isInvoiceOverdue, summarizeInvoices } from "./billing";

describe("isInvoiceOverdue", () => {
  const now = new Date("2026-06-20T00:00:00Z");

  it("benar bila UNPAID dan lewat tenggat", () => {
    expect(isInvoiceOverdue("UNPAID", new Date("2026-06-10"), now)).toBe(true);
  });

  it("salah bila sudah lunas", () => {
    expect(isInvoiceOverdue("PAID", new Date("2026-06-10"), now)).toBe(false);
  });

  it("salah bila belum jatuh tempo / tanpa tenggat", () => {
    expect(isInvoiceOverdue("UNPAID", new Date("2026-06-30"), now)).toBe(false);
    expect(isInvoiceOverdue("UNPAID", null, now)).toBe(false);
  });
});

describe("summarizeInvoices", () => {
  it("menghitung total, terbayar, belum terbayar", () => {
    const summary = summarizeInvoices([
      { status: "PAID", amount: 100000 },
      { status: "PAID", amount: 50000 },
      { status: "UNPAID", amount: 250000 },
      { status: "CANCELLED", amount: 999 },
    ]);
    expect(summary).toEqual({
      count: 4,
      totalAmount: 400999,
      paidAmount: 150000,
      unpaidAmount: 250000,
    });
  });

  it("kosong menghasilkan nol", () => {
    expect(summarizeInvoices([])).toEqual({
      count: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
    });
  });
});
