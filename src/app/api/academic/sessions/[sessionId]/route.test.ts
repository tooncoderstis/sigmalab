import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, userHasRole, sessionFindUnique, assignmentFindFirst, recordUpsert } =
  vi.hoisted(() => ({
    requireApiRole: vi.fn(),
    userHasRole: vi.fn(),
    sessionFindUnique: vi.fn(),
    assignmentFindFirst: vi.fn(),
    recordUpsert: vi.fn(),
  }));

vi.mock("@/lib/rbac", () => ({
  requireApiRole,
  userHasRole,
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
    attendanceSession: { findUnique: sessionFindUnique },
    teachingAssignment: { findFirst: assignmentFindFirst },
    attendanceRecord: { upsert: recordUpsert },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

import { PATCH } from "./route";

const PARAMS = { params: Promise.resolve({ sessionId: "sess1" }) };

function patchReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/sessions/sess1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = {
  records: [{ studentId: "stu1", status: "PRESENT", note: "hadir" }],
};

describe("PATCH /api/academic/sessions/[sessionId]", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    sessionFindUnique.mockReset();
    assignmentFindFirst.mockReset();
    recordUpsert.mockReset();
  });

  it("403 bila guru bukan pengampu kelas", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    sessionFindUnique.mockResolvedValueOnce({ teacherId: "other", classId: "c1" });
    assignmentFindFirst.mockResolvedValueOnce(null);

    const res = await PATCH(patchReq(BODY), PARAMS);

    expect(res.status).toBe(403);
    expect(recordUpsert).not.toHaveBeenCalled();
  });

  it("menyimpan presensi (upsert) untuk guru pengampu", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    sessionFindUnique.mockResolvedValueOnce({ teacherId: "t1", classId: "c1" });
    recordUpsert.mockResolvedValueOnce({ id: "r1" });

    const res = await PATCH(patchReq(BODY), PARAMS);

    expect(res.status).toBe(200);
    expect(recordUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId_studentId: { sessionId: "sess1", studentId: "stu1" } },
      })
    );
    await expect(res.json()).resolves.toMatchObject({ count: 1 });
  });

  it("manager boleh mengisi tanpa cek pengampuan", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    userHasRole.mockReturnValueOnce(true);
    recordUpsert.mockResolvedValueOnce({ id: "r2" });

    const res = await PATCH(patchReq(BODY), PARAMS);

    expect(res.status).toBe(200);
    expect(sessionFindUnique).not.toHaveBeenCalled();
  });
});
