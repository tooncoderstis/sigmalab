import { describe, expect, it } from "vitest";
import {
  contentMatches,
  targetMatches,
  announcementWhere,
  type AudienceContext,
} from "./audience";

const ctx: AudienceContext = {
  roles: ["STUDENT", "GUARDIAN"],
  classIds: ["c1", "c2"],
  programIds: ["p1"],
  isManager: false,
};

describe("targetMatches", () => {
  it("cocok lewat peran", () => {
    expect(targetMatches({ role: "STUDENT" }, ctx)).toBe(true);
    expect(targetMatches({ role: "TEACHER" }, ctx)).toBe(false);
  });

  it("cocok lewat kelas", () => {
    expect(targetMatches({ classId: "c1" }, ctx)).toBe(true);
    expect(targetMatches({ classId: "c9" }, ctx)).toBe(false);
  });

  it("cocok lewat program", () => {
    expect(targetMatches({ programId: "p1" }, ctx)).toBe(true);
    expect(targetMatches({ programId: "p2" }, ctx)).toBe(false);
  });

  it("tidak cocok bila target kosong", () => {
    expect(targetMatches({}, ctx)).toBe(false);
  });
});

describe("contentMatches", () => {
  it("audienceAll terlihat semua", () => {
    expect(contentMatches({ audienceAll: true, targets: [] }, ctx)).toBe(true);
  });

  it("manager selalu melihat", () => {
    expect(
      contentMatches(
        { audienceAll: false, targets: [] },
        { ...ctx, isManager: true }
      )
    ).toBe(true);
  });

  it("cocok bila salah satu target cocok", () => {
    expect(
      contentMatches(
        { audienceAll: false, targets: [{ classId: "c9" }, { classId: "c2" }] },
        ctx
      )
    ).toBe(true);
  });

  it("tidak terlihat bila tidak ada target cocok", () => {
    expect(
      contentMatches(
        { audienceAll: false, targets: [{ classId: "c9" }] },
        ctx
      )
    ).toBe(false);
  });
});

describe("announcementWhere", () => {
  it("manager mendapat filter kosong", () => {
    expect(announcementWhere({ ...ctx, isManager: true })).toEqual({});
  });

  it("membangun OR audienceAll + target", () => {
    const where = announcementWhere(ctx) as { OR: unknown[] };
    expect(Array.isArray(where.OR)).toBe(true);
    expect(where.OR[0]).toEqual({ audienceAll: true });
    expect(where.OR[1]).toMatchObject({ targets: { some: { OR: expect.any(Array) } } });
  });

  it("tanpa konteks hanya audienceAll", () => {
    const where = announcementWhere({
      roles: [],
      classIds: [],
      programIds: [],
      isManager: false,
    }) as { OR: unknown[] };
    expect(where.OR).toEqual([{ audienceAll: true }]);
  });
});
