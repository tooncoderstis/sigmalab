import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, itemFindUnique, itemUpdate, movementCreate } = vi.hoisted(
  () => ({
    requireApiRole: vi.fn(),
    itemFindUnique: vi.fn(),
    itemUpdate: vi.fn(),
    movementCreate: vi.fn(),
  })
);

vi.mock("@/lib/rbac", () => ({
  requireApiRole,
  parseBody: (
    schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
    body: unknown
  ) => {
    const result = schema.safeParse(body);
    if (!result.success) return { error: new Response("bad", { status: 400 }) };
    return { data: result.data };
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryItem: { findUnique: itemFindUnique, update: itemUpdate },
    inventoryMovement: { create: movementCreate },
    $transaction: (cb: (tx: unknown) => unknown) =>
      cb({
        inventoryItem: { update: itemUpdate },
        inventoryMovement: { create: movementCreate },
      }),
  },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/inventory-movements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/academic/inventory-movements", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    itemFindUnique.mockReset();
    itemUpdate.mockReset();
    movementCreate.mockReset();
  });

  it("404 bila barang tidak ada", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    itemFindUnique.mockResolvedValueOnce(null);

    const res = await POST(
      jsonReq({ itemId: "it1", type: "IN", quantity: 5 })
    );
    expect(res.status).toBe(404);
    expect(movementCreate).not.toHaveBeenCalled();
  });

  it("201 menambah stok (IN)", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    itemFindUnique.mockResolvedValueOnce({ id: "it1", quantity: 10 });
    itemUpdate.mockResolvedValueOnce({ id: "it1", quantity: 15 });
    movementCreate.mockResolvedValueOnce({ id: "mv1" });

    const res = await POST(
      jsonReq({ itemId: "it1", type: "IN", quantity: 5 })
    );

    expect(res.status).toBe(201);
    expect(itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "it1" }, data: { quantity: 15 } })
    );
    await expect(res.json()).resolves.toMatchObject({
      data: { quantity: 15 },
    });
  });

  it("201 mengurangi stok tanpa negatif (OUT)", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    itemFindUnique.mockResolvedValueOnce({ id: "it1", quantity: 2 });
    itemUpdate.mockResolvedValueOnce({ id: "it1", quantity: 0 });
    movementCreate.mockResolvedValueOnce({ id: "mv2" });

    const res = await POST(
      jsonReq({ itemId: "it1", type: "OUT", quantity: 5 })
    );

    expect(res.status).toBe(201);
    expect(itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: 0 } })
    );
  });
});
