import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw, isStorageConfigured } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  isStorageConfigured: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRaw },
}));

vi.mock("@/lib/storage", () => ({ isStorageConfigured }));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    isStorageConfigured.mockReset();
    isStorageConfigured.mockReturnValue(false);
  });

  it("mengembalikan ok saat database terjangkau", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "ok",
      db: "up",
      storage: "unconfigured",
    });
  });

  it("melaporkan storage up bila dikonfigurasi", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    isStorageConfigured.mockReturnValueOnce(true);

    const res = await GET();

    await expect(res.json()).resolves.toMatchObject({ storage: "up" });
  });

  it("mengembalikan 503 saat database tidak terjangkau", async () => {
    queryRaw.mockRejectedValueOnce(new Error("connection refused"));

    const res = await GET();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      status: "degraded",
      db: "down",
      storage: "unconfigured",
    });
  });
});
