import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, copyFindUnique, copyUpdate, distCreate } = vi.hoisted(
  () => ({
    requireApiRole: vi.fn(),
    copyFindUnique: vi.fn(),
    copyUpdate: vi.fn(),
    distCreate: vi.fn(),
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
    textbookCopy: { findUnique: copyFindUnique, update: copyUpdate },
    textbookDistribution: { create: distCreate },
    $transaction: (cb: (tx: unknown) => unknown) =>
      cb({
        textbookCopy: { update: copyUpdate },
        textbookDistribution: { create: distCreate },
      }),
  },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/textbook-distributions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { copyId: "cp1", studentId: "s1" };

describe("POST /api/academic/textbook-distributions", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    copyFindUnique.mockReset();
    copyUpdate.mockReset();
    distCreate.mockReset();
  });

  it("404 bila eksemplar tidak ada", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    copyFindUnique.mockResolvedValueOnce(null);

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(404);
    expect(distCreate).not.toHaveBeenCalled();
  });

  it("409 bila eksemplar tidak tersedia", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    copyFindUnique.mockResolvedValueOnce({ id: "cp1", status: "LENT" });

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(409);
    expect(distCreate).not.toHaveBeenCalled();
  });

  it("201 distribusi & eksemplar jadi LENT", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    copyFindUnique.mockResolvedValueOnce({ id: "cp1", status: "AVAILABLE" });
    copyUpdate.mockResolvedValueOnce({ id: "cp1", status: "LENT" });
    distCreate.mockResolvedValueOnce({ id: "d1" });

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(201);
    expect(copyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cp1" }, data: { status: "LENT" } })
    );
    expect(distCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ copyId: "cp1", studentId: "s1" }),
      })
    );
  });
});
