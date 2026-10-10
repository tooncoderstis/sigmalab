import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, classFindUnique, enrollmentCreate } = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  classFindUnique: vi.fn(),
  enrollmentCreate: vi.fn(),
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
  prisma: {
    academicClass: { findUnique: classFindUnique },
    classEnrollment: { create: enrollmentCreate },
  },
}));

import { POST } from "./route";

const MANAGER = { id: "u_admin", role: "ADMIN", roles: ["ADMIN"] };
const PARAMS = { params: Promise.resolve({ classId: "c1" }) };

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/classes/c1/enrollments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/academic/classes/[classId]/enrollments", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    classFindUnique.mockReset();
    enrollmentCreate.mockReset();
  });

  it("404 bila kelas tidak ada", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });
    classFindUnique.mockResolvedValueOnce(null);

    const res = await POST(jsonReq({ studentId: "s1" }), PARAMS);

    expect(res.status).toBe(404);
    expect(enrollmentCreate).not.toHaveBeenCalled();
  });

  it("409 bila kapasitas penuh", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });
    classFindUnique.mockResolvedValueOnce({
      id: "c1",
      capacity: 2,
      _count: { enrollments: 2 },
    });

    const res = await POST(jsonReq({ studentId: "s1" }), PARAMS);

    expect(res.status).toBe(409);
    expect(enrollmentCreate).not.toHaveBeenCalled();
  });

  it("201 bila berhasil enroll", async () => {
    requireApiRole.mockResolvedValueOnce({ user: MANAGER });
    classFindUnique.mockResolvedValueOnce({
      id: "c1",
      capacity: 10,
      _count: { enrollments: 0 },
    });
    enrollmentCreate.mockResolvedValueOnce({ id: "e1" });

    const res = await POST(jsonReq({ studentId: "s1" }), PARAMS);

    expect(res.status).toBe(201);
    expect(enrollmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { classId: "c1", studentId: "s1" } })
    );
  });
});
