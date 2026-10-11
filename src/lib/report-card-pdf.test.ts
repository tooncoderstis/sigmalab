import { describe, expect, it } from "vitest";
import { renderReportCardPdf } from "./report-card-pdf";

describe("renderReportCardPdf", () => {
  it("menghasilkan buffer PDF dengan entri nilai", async () => {
    const buffer = await renderReportCardPdf({
      studentName: "Budi Santoso",
      nis: "12345",
      nisn: "98765",
      programName: "SMA IPA",
      termName: "Ganjil",
      academicYearName: "2025/2026",
      homeroomNote: "Tingkatkan belajar.",
      entries: [
        { subject: "Matematika", finalScore: 88, predicate: "A" },
        { subject: "Fisika", finalScore: 72, predicate: "C" },
      ],
    });

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("tetap menghasilkan PDF saat tidak ada nilai", async () => {
    const buffer = await renderReportCardPdf({
      studentName: "Ani",
      termName: "Genap",
      academicYearName: "2025/2026",
      entries: [],
    });
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
