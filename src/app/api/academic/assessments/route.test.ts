import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireApiRole,
  userHasRole,
  assignmentFindFirst,
  classFindUnique,
  assessmentCreate,
} = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  userHasRole: vi.fn(),
  assignmentFindFirst: vi.fn(),
  classFindUnique: vi.fn(),
  assessmentCreate: vi.fn(),
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
    assessment: { create: assessmentCreate },
  },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/assessments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { classId: "c1", title: "UTS Matematika" };

describe("POST /api/academic/assessments", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    assignmentFindFirst.mockReset();
    classFindUnique.mockReset();
    assessmentCreate.mockReset();
  });

  it("401 bila tidak login", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 401 }),
    });
    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(401);
    expect(assessmentCreate).not.toHaveBeenCalled();
  });

  it("403 bila guru bukan pengampu kelas", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assignmentFindFirst.mockResolvedValueOnce(null);

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(403);
    expect(assessmentCreate).not.toHaveBeenCalled();
  });

  it("201 dan mewarisi mapel/term kelas bila tidak diberikan", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assignmentFindFirst.mockResolvedValueOnce({ id: "as1" });
    classFindUnique.mockResolvedValueOnce({ subjectId: "sub1", termId: "term1" });
    assessmentCreate.mockResolvedValueOnce({ id: "a1" });

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(201);
    const call = assessmentCreate.mock.calls[0][0];
    expect(call.data).toMatchObject({
      classId: "c1",
      title: "UTS Matematika",
      subjectId: "sub1",
      termId: "term1",
      createdById: "t1",
    });
  });
});
