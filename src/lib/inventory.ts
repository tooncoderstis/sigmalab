// Logika inventaris (murni). Lihat ADR-0013.

export type MovementType = "IN" | "OUT" | "ADJUST";

/**
 * Menghitung stok baru dari sebuah pergerakan.
 * IN menambah, OUT mengurangi (tidak negatif), ADJUST menetapkan nilai absolut.
 */
export function applyMovement(
  currentQuantity: number,
  type: MovementType,
  quantity: number
): number {
  switch (type) {
    case "IN":
      return currentQuantity + Math.max(0, quantity);
    case "OUT":
      return Math.max(0, currentQuantity - Math.max(0, quantity));
    case "ADJUST":
      return Math.max(0, quantity);
    default:
      return currentQuantity;
  }
}

/** Apakah stok di bawah/sama dengan batas minimum. */
export function isLowStock(quantity: number, minQuantity: number): boolean {
  return minQuantity > 0 && quantity <= minQuantity;
}
