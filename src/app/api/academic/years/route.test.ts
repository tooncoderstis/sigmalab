import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, yearCreate, yearUpdateMany, yearFindMany } = vi.hoisted(
  () => ({
    requireApiRole: vi.fn(),
    yearCreate: vi.fn(),
    yearUpdateMany: vi.fn(),
    yearFindMany: vi.fn(),
  })
);

vi.mock("@/lib/rbac", () => ({
  requireApiRole,
  parseBody: (
    schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
    body: unknown
  ) => {
    const result = schema.safeParse(body);
    if (!result.success) {
      return { error: new Response("bad", { status: 400 }) };
    }
    return { data: result.data };
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: { findMany: yearFindMany, create: yearCreate },
    $transaction: (cb: (tx: unknown) => unknown) =>
      cb({ academicYear: { create: yearCreate, updateMany: yearUpdateMany } }),
  },
}));

import { GET, POST } from "./route";

const MANAGER = { id: "u_admin", role: "ADMIN", roles: ["ADMIN"] };

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/years", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API /api/academic/years", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    yearCreate.mockReset();
    yearUpdateMany.mockReset();
    yearFindMany.mockReset();
  });

  it("GET menolak pengguna anonim dengan 401", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(yearFindMany).not.toHaveBeenCalled();
  });

  it("GET mengembalikan daftar tahun ajaran", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });
    yearFindMany.mockResolvedValueOnce([{ id: "y1", name: "2025/2026" }]);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [{ id: "y1", name: "2025/2026" }],
    });
  });

  it("POST membuat tahun ajaran (201)", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });
    yearCreate.mockResolvedValueOnce({ id: "y1", name: "2025/2026" });

    const res = await POST(jsonReq({ name: "2025/2026" }));

    expect(res.status).toBe(201);
    expect(yearCreate).toHaveBeenCalledWith({ data: { name: "2025/2026" } });
  });

  it("POST menonaktifkan tahun lain saat isActive true", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });
    yearUpdateMany.mockResolvedValueOnce({ count: 2 });
    yearCreate.mockResolvedValueOnce({ id: "y2", name: "2026/2027" });

    const res = await POST(jsonReq({ name: "2026/2027", isActive: true }));

    expect(res.status).toBe(201);
    expect(yearUpdateMany).toHaveBeenCalledWith({ data: { isActive: false } });
  });

  it("POST menolak payload tidak valid (400)", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });

    const res = await POST(jsonReq({ name: "20" }));

    expect(res.status).toBe(400);
    expect(yearCreate).not.toHaveBeenCalled();
  });
});
