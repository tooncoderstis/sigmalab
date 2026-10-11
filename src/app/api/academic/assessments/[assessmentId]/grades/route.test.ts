import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireApiRole,
  userHasRole,
  assignmentFindFirst,
  assessmentFindUnique,
  gradeUpsert,
  submissionUpdateMany,
} = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  userHasRole: vi.fn(),
  assignmentFindFirst: vi.fn(),
  assessmentFindUnique: vi.fn(),
  gradeUpsert: vi.fn(),
  submissionUpdateMany: vi.fn(),
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
    assessment: { findUnique: assessmentFindUnique },
    grade: { upsert: gradeUpsert },
    assignmentSubmission: { updateMany: submissionUpdateMany },
    $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

import { PATCH } from "./route";

const PARAMS = { params: Promise.resolve({ assessmentId: "a1" }) };

function patchReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/assessments/a1/grades", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { grades: [{ studentId: "stu1", score: 90 }] };

describe("PATCH /api/academic/assessments/[assessmentId]/grades", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    assignmentFindFirst.mockReset();
    assessmentFindUnique.mockReset();
    gradeUpsert.mockReset();
    submissionUpdateMany.mockReset();
  });

  it("403 bila guru bukan pengampu kelas", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assessmentFindUnique.mockResolvedValueOnce({
      id: "a1",
      classId: "c1",
      maxScore: 100,
    });
    assignmentFindFirst.mockResolvedValueOnce(null);

    const res = await PATCH(patchReq(BODY), PARAMS);
    expect(res.status).toBe(403);
    expect(gradeUpsert).not.toHaveBeenCalled();
  });

  it("400 bila nilai melebihi skor maksimum", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    userHasRole.mockReturnValueOnce(true);
    assessmentFindUnique.mockResolvedValueOnce({
      id: "a1",
      classId: "c1",
      maxScore: 50,
    });

    const res = await PATCH(patchReq(BODY), PARAMS);
    expect(res.status).toBe(400);
    expect(gradeUpsert).not.toHaveBeenCalled();
  });

  it("200 dan upsert nilai untuk pengampu", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "t1", role: "TEACHER", roles: ["TEACHER"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assessmentFindUnique.mockResolvedValueOnce({
      id: "a1",
      classId: "c1",
      maxScore: 100,
    });
    assignmentFindFirst.mockResolvedValueOnce({ id: "as1" });
    gradeUpsert.mockResolvedValueOnce({ id: "g1" });
    submissionUpdateMany.mockResolvedValueOnce({ count: 1 });

    const res = await PATCH(patchReq(BODY), PARAMS);

    expect(res.status).toBe(200);
    expect(gradeUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assessmentId_studentId: { assessmentId: "a1", studentId: "stu1" },
        },
      })
    );
    await expect(res.json()).resolves.toMatchObject({ count: 1 });
  });
});
