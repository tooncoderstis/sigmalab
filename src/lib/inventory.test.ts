import { describe, expect, it } from "vitest";
import { applyMovement, isLowStock } from "./inventory";

describe("applyMovement", () => {
  it("IN menambah stok", () => {
    expect(applyMovement(10, "IN", 5)).toBe(15);
  });

  it("OUT mengurangi stok tanpa negatif", () => {
    expect(applyMovement(10, "OUT", 3)).toBe(7);
    expect(applyMovement(2, "OUT", 5)).toBe(0);
  });

  it("ADJUST menetapkan nilai absolut", () => {
    expect(applyMovement(10, "ADJUST", 4)).toBe(4);
  });

  it("mengabaikan kuantitas negatif untuk IN/OUT", () => {
    expect(applyMovement(10, "IN", -5)).toBe(10);
    expect(applyMovement(10, "OUT", -5)).toBe(10);
  });
});

describe("isLowStock", () => {
  it("benar bila <= minimum dan minimum > 0", () => {
    expect(isLowStock(2, 3)).toBe(true);
    expect(isLowStock(5, 3)).toBe(false);
    expect(isLowStock(0, 0)).toBe(false);
  });
});
