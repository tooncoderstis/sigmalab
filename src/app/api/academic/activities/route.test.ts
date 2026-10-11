import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, userHasRole, activityCreate } = vi.hoisted(() => ({
  requireApiRole: vi.fn(),
  userHasRole: vi.fn(),
  activityCreate: vi.fn(),
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
  prisma: { schoolActivity: { create: activityCreate } },
}));

vi.mock("@/lib/audience-context", () => ({ getAudienceContext: vi.fn() }));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/activities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/academic/activities", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    activityCreate.mockReset();
  });

  it("403 bila bukan manager", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 403 }),
    });
    const res = await POST(jsonReq({ title: "x", startAt: new Date().toISOString() }));
    expect(res.status).toBe(403);
    expect(activityCreate).not.toHaveBeenCalled();
  });

  it("201 membuat kegiatan", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    activityCreate.mockResolvedValueOnce({ id: "act1" });

    const res = await POST(
      jsonReq({
        title: "Pramuka",
        startAt: "2026-11-01T08:00:00.000Z",
        audienceAll: true,
      })
    );

    expect(res.status).toBe(201);
    const call = activityCreate.mock.calls[0][0];
    expect(call.data).toMatchObject({
      title: "Pramuka",
      authorId: "a1",
      targets: { create: [] },
    });
  });

  it("400 bila startAt tidak valid", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    const res = await POST(jsonReq({ title: "x" }));
    expect(res.status).toBe(400);
    expect(activityCreate).not.toHaveBeenCalled();
  });
});
