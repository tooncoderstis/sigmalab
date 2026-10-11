import { describe, expect, it } from "vitest";
import {
  academicYearInput,
  assessmentInput,
  assignmentSubmissionInput,
  attendanceRecordInput,
  classInput,
  gradeInput,
  presignInput,
  reportCardGenerateInput,
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

describe("assessmentInput", () => {
  it("mewajibkan classId dan title", () => {
    expect(assessmentInput.safeParse({ title: "UTS" }).success).toBe(false);
    expect(
      assessmentInput.safeParse({ classId: "c1", title: "UTS" }).success
    ).toBe(true);
  });

  it("menolak jenis tidak dikenal", () => {
    expect(
      assessmentInput.safeParse({ classId: "c1", title: "UTS", type: "KUIS" })
        .success
    ).toBe(false);
  });
});

describe("gradeInput", () => {
  it("menolak nilai negatif", () => {
    expect(
      gradeInput.safeParse({ studentId: "s1", score: -1 }).success
    ).toBe(false);
  });

  it("menerima nilai valid", () => {
    expect(
      gradeInput.safeParse({ studentId: "s1", score: 85 }).success
    ).toBe(true);
  });
});

describe("assignmentSubmissionInput", () => {
  it("menolak berkas terlalu besar", () => {
    expect(
      assignmentSubmissionInput.safeParse({
        fileKey: "assignments/a/s/f.pdf",
        fileName: "f.pdf",
        mimeType: "application/pdf",
        fileSize: 20 * 1024 * 1024,
      }).success
    ).toBe(false);
  });

  it("menerima berkas valid", () => {
    expect(
      assignmentSubmissionInput.safeParse({
        fileKey: "assignments/a/s/f.pdf",
        fileName: "f.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      }).success
    ).toBe(true);
  });
});

describe("presignInput", () => {
  it("menolak tipe mime yang tidak diizinkan", () => {
    expect(
      presignInput.safeParse({
        assessmentId: "a1",
        fileName: "x.exe",
        mimeType: "application/x-msdownload",
        fileSize: 100,
      }).success
    ).toBe(false);
  });
});

describe("reportCardGenerateInput", () => {
  it("mewajibkan studentId dan termId", () => {
    expect(reportCardGenerateInput.safeParse({ studentId: "s1" }).success).toBe(
      false
    );
    expect(
      reportCardGenerateInput.safeParse({ studentId: "s1", termId: "t1" })
        .success
    ).toBe(true);
  });
});
