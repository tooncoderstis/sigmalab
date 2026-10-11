import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, userHasRole, announcementCreate, getAudienceContext } =
  vi.hoisted(() => ({
    requireApiRole: vi.fn(),
    userHasRole: vi.fn(),
    announcementCreate: vi.fn(),
    getAudienceContext: vi.fn(),
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
  prisma: { announcement: { create: announcementCreate } },
}));

vi.mock("@/lib/audience-context", () => ({ getAudienceContext }));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/announcements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/academic/announcements", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    announcementCreate.mockReset();
  });

  it("401 bila tidak login", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 401 }),
    });
    const res = await POST(jsonReq({ title: "x", body: "y" }));
    expect(res.status).toBe(401);
    expect(announcementCreate).not.toHaveBeenCalled();
  });

  it("403 bila bukan manager", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 403 }),
    });
    const res = await POST(jsonReq({ title: "x", body: "y" }));
    expect(res.status).toBe(403);
  });

  it("201 membuat pengumuman terbit dengan target", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    announcementCreate.mockResolvedValueOnce({ id: "an1" });

    const res = await POST(
      jsonReq({
        title: "Libur",
        body: "Besok libur",
        status: "PUBLISHED",
        audienceAll: false,
        targets: [{ classId: "c1" }],
      })
    );

    expect(res.status).toBe(201);
    const call = announcementCreate.mock.calls[0][0];
    expect(call.data).toMatchObject({
      title: "Libur",
      status: "PUBLISHED",
      authorId: "a1",
      targets: { create: [{ classId: "c1" }] },
    });
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it("400 bila target audiens kosong", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    const res = await POST(
      jsonReq({ title: "x", body: "y", targets: [{}] })
    );
    expect(res.status).toBe(400);
    expect(announcementCreate).not.toHaveBeenCalled();
  });
});
