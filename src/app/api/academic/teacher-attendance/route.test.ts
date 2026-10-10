import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, teacherAttendanceUpsert } = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  teacherAttendanceUpsert: vi.fn(),
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
  prisma: { teacherAttendance: { upsert: teacherAttendanceUpsert } },
}));

import { POST } from "./route";

const TEACHER = { id: "t1", role: "TEACHER", roles: ["TEACHER"] };

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/teacher-attendance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/academic/teacher-attendance", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    teacherAttendanceUpsert.mockReset();
  });

  it("401 bila tidak login", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 401 }),
    });

    const res = await POST(jsonReq({ action: "check-in" }));

    expect(res.status).toBe(401);
    expect(teacherAttendanceUpsert).not.toHaveBeenCalled();
  });

  it("check-in mengisi checkInAt", async () => {
    requireApiRole.mockResolvedValueOnce({ user: TEACHER });
    teacherAttendanceUpsert.mockResolvedValueOnce({ id: "ta1" });

    const res = await POST(jsonReq({ action: "check-in" }));

    expect(res.status).toBe(200);
    const call = teacherAttendanceUpsert.mock.calls[0][0];
    expect(call.create).toMatchObject({ teacherId: "t1" });
    expect(call.create.checkInAt).toBeInstanceOf(Date);
    expect(call.update.checkInAt).toBeInstanceOf(Date);
  });

  it("check-out mengisi checkOutAt", async () => {
    requireApiRole.mockResolvedValueOnce({ user: TEACHER });
    teacherAttendanceUpsert.mockResolvedValueOnce({ id: "ta1" });

    const res = await POST(jsonReq({ action: "check-out" }));

    expect(res.status).toBe(200);
    const call = teacherAttendanceUpsert.mock.calls[0][0];
    expect(call.create.checkOutAt).toBeInstanceOf(Date);
  });
});
