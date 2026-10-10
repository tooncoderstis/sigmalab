import { describe, expect, it } from "vitest";
import {
  academicYearInput,
  attendanceRecordInput,
  classInput,
  slugify,
} from "./validation";

describe("slugify", () => {
  it("membuat slug dari nama program", () => {
    expect(slugify("Bimbel SNBT 2026")).toBe("bimbel-snbt-2026");
    expect(slugify("  SMA IPA  ")).toBe("sma-ipa");
  });
});

describe("academicYearInput", () => {
  it("menerima payload valid", () => {
    const result = academicYearInput.safeParse({ name: "2025/2026", isActive: true });
    expect(result.success).toBe(true);
  });

  it("menolak nama terlalu pendek", () => {
    expect(academicYearInput.safeParse({ name: "20" }).success).toBe(false);
  });
});

describe("classInput", () => {
  it("mewajibkan programId dan termId", () => {
    expect(classInput.safeParse({ name: "X IPA 1" }).success).toBe(false);
    expect(
      classInput.safeParse({ name: "X IPA 1", programId: "p1", termId: "t1" }).success
    ).toBe(true);
  });
});

describe("attendanceRecordInput", () => {
  it("menolak status yang tidak dikenal", () => {
    expect(
      attendanceRecordInput.safeParse({ studentId: "s1", status: "HADIR" }).success
    ).toBe(false);
  });

  it("menerima status valid", () => {
    expect(
      attendanceRecordInput.safeParse({ studentId: "s1", status: "LATE" }).success
    ).toBe(true);
  });
});
