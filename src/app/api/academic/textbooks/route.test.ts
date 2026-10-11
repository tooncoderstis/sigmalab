import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, textbookCreate } = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  textbookCreate: vi.fn(),
}));

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
  prisma: { textbook: { create: textbookCreate } },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/textbooks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/academic/textbooks", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    textbookCreate.mockReset();
  });

  it("403 bila tidak berperan staf/manager", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 403 }),
    });
    const res = await POST(jsonReq({ title: "Buku" }));
    expect(res.status).toBe(403);
    expect(textbookCreate).not.toHaveBeenCalled();
  });

  it("201 membuat buku oleh staf", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    textbookCreate.mockResolvedValueOnce({ id: "tb1" });

    const res = await POST(jsonReq({ title: "Matematika 10", subjectId: "sub1" }));

    expect(res.status).toBe(201);
    const call = textbookCreate.mock.calls[0][0];
    expect(call.data).toMatchObject({ title: "Matematika 10", createdById: "st1" });
  });

  it("400 bila title kosong", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "st1", role: "STAFF", roles: ["STAFF"] },
    });
    const res = await POST(jsonReq({}));
    expect(res.status).toBe(400);
    expect(textbookCreate).not.toHaveBeenCalled();
  });
});
