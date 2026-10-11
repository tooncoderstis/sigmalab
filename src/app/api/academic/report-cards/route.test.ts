import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireApiRole,
  userHasRole,
  termFindUnique,
  enrollmentFindMany,
  assessmentFindMany,
  rcFindUnique,
  rcCreate,
  rcUpdate,
  entryDeleteMany,
  entryCreateMany,
} = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  userHasRole: vi.fn(),
  termFindUnique: vi.fn(),
  enrollmentFindMany: vi.fn(),
  assessmentFindMany: vi.fn(),
  rcFindUnique: vi.fn(),
  rcCreate: vi.fn(),
  rcUpdate: vi.fn(),
  entryDeleteMany: vi.fn(),
  entryCreateMany: vi.fn(),
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

const tx = {
  reportCard: { findUnique: rcFindUnique, create: rcCreate, update: rcUpdate },
  reportCardEntry: {
    deleteMany: entryDeleteMany,
    createMany: entryCreateMany,
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    term: { findUnique: termFindUnique },
    classEnrollment: { findMany: enrollmentFindMany },
    assessment: { findMany: assessmentFindMany },
    $transaction: (cb: (client: typeof tx) => unknown) => cb(tx),
  },
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/report-cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { studentId: "stu1", termId: "t1" };

describe("POST /api/academic/report-cards", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    termFindUnique.mockReset();
    enrollmentFindMany.mockReset();
    assessmentFindMany.mockReset();
    rcFindUnique.mockReset();
    rcCreate.mockReset();
    rcUpdate.mockReset();
    entryDeleteMany.mockReset();
    entryCreateMany.mockReset();
  });

  it("404 bila term tidak ada", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    termFindUnique.mockResolvedValueOnce(null);

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(404);
    expect(entryCreateMany).not.toHaveBeenCalled();
  });

  it("menghasilkan entri rapor dari nilai berbobot", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    userHasRole.mockReturnValue(true);
    termFindUnique.mockResolvedValueOnce({ id: "t1" });
    enrollmentFindMany.mockResolvedValueOnce([
      { class: { id: "c1", subjectId: "sub1", subject: { id: "sub1" } } },
    ]);
    assessmentFindMany.mockResolvedValueOnce([
      { id: "a1", classId: "c1", subjectId: "sub1", maxScore: 100, weight: 1, grades: [{ score: 80 }] },
      { id: "a2", classId: "c1", subjectId: "sub1", maxScore: 100, weight: 1, grades: [{ score: 90 }] },
    ]);
    rcFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "rc1", entries: [] });
    rcCreate.mockResolvedValueOnce({ id: "rc1" });
    entryDeleteMany.mockResolvedValueOnce({ count: 0 });
    entryCreateMany.mockResolvedValueOnce({ count: 1 });

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(201);
    expect(entryCreateMany).toHaveBeenCalledTimes(1);
    const arg = entryCreateMany.mock.calls[0][0];
    expect(arg.data).toHaveLength(1);
    expect(arg.data[0]).toMatchObject({
      subjectId: "sub1",
      finalScore: 85,
      predicate: "A",
      reportCardId: "rc1",
    });
  });
});
