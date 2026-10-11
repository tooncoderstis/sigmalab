import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { reportCardGenerateInput } from "@/lib/validation";
import {
  computeFinalScore,
  predicate,
  predicateDescription,
  type WeightedGrade,
} from "@/lib/report-card";

const TEACHING = ["TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const termId = req.nextUrl.searchParams.get("termId");

  const reportCards = await prisma.reportCard.findMany({
    where: { termId: termId ?? undefined },
    include: {
      student: { select: { id: true, name: true, email: true } },
      term: { select: { id: true, name: true } },
      entries: {
        include: { subject: { select: { id: true, name: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json({ data: reportCards });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...TEACHING);
  if (authz.error) return authz.error;

  const parsed = parseBody(reportCardGenerateInput, await req.json());
  if (parsed.error) return parsed.error;

  const { studentId, termId, homeroomNote } = parsed.data;

  const term = await prisma.term.findUnique({
    where: { id: termId },
    select: { id: true },
  });
  if (!term) {
    return NextResponse.json({ error: "Term tidak ditemukan" }, { status: 404 });
  }

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");

  const enrollments = await prisma.classEnrollment.findMany({
    where: { studentId, status: "ACTIVE", class: { termId } },
    select: {
      class: {
        select: {
          id: true,
          subjectId: true,
          subject: { select: { id: true } },
        },
      },
    },
  });

  if (!isManager && enrollments.length === 0) {
    return NextResponse.json(
      { error: "Siswa tidak terdaftar di term ini" },
      { status: 400 }
    );
  }

  const classIds = enrollments.map((e) => e.class.id);
  const classSubject = new Map<string, string | null>();
  for (const e of enrollments) {
    classSubject.set(e.class.id, e.class.subjectId ?? e.class.subject?.id ?? null);
  }

  const assessments = await prisma.assessment.findMany({
    where: { classId: { in: classIds }, published: true },
    select: {
      id: true,
      classId: true,
      subjectId: true,
      maxScore: true,
      weight: true,
      grades: {
        where: { studentId },
        select: { score: true },
      },
    },
  });

  // Kelompokkan nilai per mapel
  const bySubject = new Map<
    string,
    { grades: WeightedGrade[] }
  >();

  for (const a of assessments) {
    const subjectId = a.subjectId ?? classSubject.get(a.classId) ?? null;
    if (!subjectId) continue;
    const gradeScore = a.grades[0]?.score;
    if (gradeScore === undefined) continue;
    const bucket = bySubject.get(subjectId) ?? { grades: [] };
    bucket.grades.push({
      score: gradeScore,
      maxScore: a.maxScore,
      weight: a.weight,
    });
    bySubject.set(subjectId, bucket);
  }

  const entries = Array.from(bySubject.entries())
    .map(([subjectId, { grades }]) => {
      const finalScore = computeFinalScore(grades);
      if (finalScore === null) return null;
      const pred = predicate(finalScore);
      return {
        subjectId,
        finalScore,
        predicate: pred,
        description: predicateDescription(pred),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  try {
    const reportCard = await prisma.$transaction(async (tx) => {
      const existing = await tx.reportCard.findUnique({
        where: { studentId_termId: { studentId, termId } },
        select: { id: true },
      });

      const saved = existing
        ? await tx.reportCard.update({
            where: { id: existing.id },
            data: {
              homeroomNote: homeroomNote ?? undefined,
              generatedAt: new Date(),
            },
          })
        : await tx.reportCard.create({
            data: { studentId, termId, homeroomNote },
          });

      await tx.reportCardEntry.deleteMany({ where: { reportCardId: saved.id } });

      if (entries.length > 0) {
        await tx.reportCardEntry.createMany({
          data: entries.map((e) => ({ ...e, reportCardId: saved.id })),
        });
      }

      return tx.reportCard.findUnique({
        where: { id: saved.id },
        include: {
          student: { select: { id: true, name: true } },
          term: { select: { id: true, name: true } },
          entries: {
            include: { subject: { select: { id: true, name: true } } },
            orderBy: { subject: { name: "asc" } },
          },
        },
      });
    });

    return NextResponse.json({ data: reportCard }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
