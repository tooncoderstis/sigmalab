import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireApiRole,
  userHasRole,
  enrollmentFindFirst,
  assessmentFindUnique,
  isStorageConfigured,
  buildAssignmentKey,
  createUploadUrl,
} = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  userHasRole: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  assessmentFindUnique: vi.fn(),
  isStorageConfigured: vi.fn(),
  buildAssignmentKey: vi.fn(),
  createUploadUrl: vi.fn(),
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
    classEnrollment: { findFirst: enrollmentFindFirst },
    assessment: { findUnique: assessmentFindUnique },
  },
}));

vi.mock("@/lib/storage", () => ({
  isStorageConfigured,
  buildAssignmentKey,
  createUploadUrl,
}));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/uploads/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = {
  assessmentId: "a1",
  fileName: "tugas.pdf",
  mimeType: "application/pdf",
  fileSize: 2048,
};

describe("POST /api/academic/uploads/presign", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    enrollmentFindFirst.mockReset();
    assessmentFindUnique.mockReset();
    isStorageConfigured.mockReset();
    buildAssignmentKey.mockReset();
    createUploadUrl.mockReset();
    isStorageConfigured.mockReturnValue(true);
  });

  it("503 bila storage belum dikonfigurasi", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "s1", role: "STUDENT", roles: ["STUDENT"] },
    });
    isStorageConfigured.mockReturnValueOnce(false);

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(503);
    expect(createUploadUrl).not.toHaveBeenCalled();
  });

  it("403 bila siswa tidak terdaftar di kelas", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "s1", role: "STUDENT", roles: ["STUDENT"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assessmentFindUnique.mockResolvedValueOnce({ id: "a1", classId: "c1" });
    enrollmentFindFirst.mockResolvedValueOnce(null);

    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(403);
    expect(createUploadUrl).not.toHaveBeenCalled();
  });

  it("mengembalikan key & uploadUrl", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "s1", role: "STUDENT", roles: ["STUDENT"] },
    });
    userHasRole.mockReturnValueOnce(false);
    assessmentFindUnique.mockResolvedValueOnce({ id: "a1", classId: "c1" });
    enrollmentFindFirst.mockResolvedValueOnce({ id: "e1" });
    buildAssignmentKey.mockReturnValueOnce("assignments/a1/s1/key-tugas.pdf");
    createUploadUrl.mockResolvedValueOnce("https://r2.example/upload");

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      data: {
        key: "assignments/a1/s1/key-tugas.pdf",
        uploadUrl: "https://r2.example/upload",
      },
    });
  });
});
