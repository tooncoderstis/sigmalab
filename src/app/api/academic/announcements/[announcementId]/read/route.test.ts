import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, announcementFindUnique, readUpsert, getAudienceContext } =
  vi.hoisted(() => ({
    requireApiRole: vi.fn(),
    announcementFindUnique: vi.fn(),
    readUpsert: vi.fn(),
    getAudienceContext: vi.fn(),
  }));

vi.mock("@/lib/rbac", () => ({ requireApiRole }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    announcement: { findUnique: announcementFindUnique },
    announcementRead: { upsert: readUpsert },
  },
}));

vi.mock("@/lib/audience-context", () => ({ getAudienceContext }));

import { POST } from "./route";

const PARAMS = { params: Promise.resolve({ announcementId: "an1" }) };

function postReq() {
  return new NextRequest(
    "http://localhost/api/academic/announcements/an1/read",
    { method: "POST" }
  );
}

const CTX = {
  roles: ["STUDENT"],
  classIds: ["c1"],
  programIds: [],
  isManager: false,
};

describe("POST /api/academic/announcements/[announcementId]/read", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    announcementFindUnique.mockReset();
    readUpsert.mockReset();
    getAudienceContext.mockReset();
  });

  it("404 bila pengumuman tidak ada", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "s1", role: "STUDENT", roles: ["STUDENT"] },
    });
    announcementFindUnique.mockResolvedValueOnce(null);

    const res = await POST(postReq(), PARAMS);
    expect(res.status).toBe(404);
    expect(readUpsert).not.toHaveBeenCalled();
  });

  it("403 bila tidak terlihat user", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "s1", role: "STUDENT", roles: ["STUDENT"] },
    });
    announcementFindUnique.mockResolvedValueOnce({
      status: "PUBLISHED",
      audienceAll: false,
      targets: [{ role: "TEACHER" }],
    });
    getAudienceContext.mockResolvedValueOnce(CTX);

    const res = await POST(postReq(), PARAMS);
    expect(res.status).toBe(403);
    expect(readUpsert).not.toHaveBeenCalled();
  });

  it("200 menandai dibaca bila terlihat", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "s1", role: "STUDENT", roles: ["STUDENT"] },
    });
    announcementFindUnique.mockResolvedValueOnce({
      status: "PUBLISHED",
      audienceAll: false,
      targets: [{ classId: "c1" }],
    });
    getAudienceContext.mockResolvedValueOnce(CTX);
    readUpsert.mockResolvedValueOnce({ id: "r1" });

    const res = await POST(postReq(), PARAMS);

    expect(res.status).toBe(200);
    expect(readUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          announcementId_userId: { announcementId: "an1", userId: "s1" },
        },
      })
    );
  });
});
