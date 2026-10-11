import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, copyFindUnique, copyUpdate, loanCreate } = vi.hoisted(
  () => ({
    requireApiRole: vi.fn(),
    copyFindUnique: vi.fn(),
    copyUpdate: vi.fn(),
    loanCreate: vi.fn(),
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
    libraryCopy: { findUnique: copyFindUnique, update: copyUpdate },
    bookLoan: { create: loanCreate },
    $transaction: (cb: (tx: unknown) => unknown) =>
      cb({
        libraryCopy: { update: copyUpdate },
        bookLoan: { create: loanCreate },
      }),
  },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/book-loans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { copyId: "cp1", memberId: "m1" };

describe("POST /api/academic/book-loans", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    copyFindUnique.mockReset();
    copyUpdate.mockReset();
    loanCreate.mockReset();
  });

  it("409 bila eksemplar tidak tersedia", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    copyFindUnique.mockResolvedValueOnce({ id: "cp1", status: "LENT" });

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(409);
    expect(loanCreate).not.toHaveBeenCalled();
  });

  it("201 meminjamkan & menandai eksemplar LENT", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    copyFindUnique.mockResolvedValueOnce({ id: "cp1", status: "AVAILABLE" });
    copyUpdate.mockResolvedValueOnce({ id: "cp1", status: "LENT" });
    loanCreate.mockResolvedValueOnce({ id: "l1" });

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(201);
    expect(copyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cp1" }, data: { status: "LENT" } })
    );
    expect(loanCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ copyId: "cp1", memberId: "m1" }),
      })
    );
  });
});
