import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, userHasRole, assignmentFindFirst, classFindUnique, planCreate } =
  vi.hoisted(() => ({
    requireApiRole: vi.fn(),
    userHasRole: vi.fn(),
    assignmentFindFirst: vi.fn(),
    classFindUnique: vi.fn(),
    planCreate: vi.fn(),
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
    teachingAssignment: { findFirst: assignmentFindFirst },
    academicClass: { findUnique: classFindUnique },
    lessonPlan: { create: planCreate },
  },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/lesson-plans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { classId: "c1", meetingNo: 1, title: "Pendahuluan" };

describe("POST /api/academic/lesson-plans", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    assignmentFindFirst.mockReset();
    classFindUnique.mockReset();
    planCreate.mockReset();
  });

  it("403 bila guru bukan pengampu kelas", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assignmentFindFirst.mockResolvedValueOnce(null);

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(403);
    expect(planCreate).not.toHaveBeenCalled();
  });

  it("201 dan mewarisi mapel/term kelas", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assignmentFindFirst.mockResolvedValueOnce({ id: "as1" });
    classFindUnique.mockResolvedValueOnce({ subjectId: "sub1", termId: "term1" });
    planCreate.mockResolvedValueOnce({ id: "lp1" });

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(201);
    const call = planCreate.mock.calls[0][0];
    expect(call.data).toMatchObject({
      classId: "c1",
      meetingNo: 1,
      title: "Pendahuluan",
      subjectId: "sub1",
      termId: "term1",
      authorId: "t1",
    });
  });
});
