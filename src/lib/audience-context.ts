import { prisma } from "@/lib/prisma";
import { collectRoles, type SessionUser } from "@/lib/roles";
import type { AudienceContext } from "@/lib/audience";

/**
 * Membangun konteks audiens user: peran, kelas (siswa/mengajar/wali kelas/
 * anak dari wali), dan program (profil siswa & program anak). Lihat ADR-0011.
 */
export async function getAudienceContext(
  user: SessionUser
): Promise<AudienceContext> {
  const roles = Array.from(collectRoles(user));
  const isManager = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  const [enrollments, teachings, homerooms, studentProfile, guardianProfile] =
    await Promise.all([
      prisma.classEnrollment.findMany({
        where: { studentId: user.id, status: "ACTIVE" },
        select: { classId: true },
      }),
      prisma.teachingAssignment.findMany({
        where: { teacherId: user.id },
        select: { classId: true },
      }),
      prisma.academicClass.findMany({
        where: { homeroomTeacherId: user.id },
        select: { id: true },
      }),
      prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { programId: true },
      }),
      prisma.guardianProfile.findUnique({
        where: { userId: user.id },
        select: {
          students: { select: { userId: true, programId: true } },
        },
      }),
    ]);

  const classIds = new Set<string>();
  enrollments.forEach((e) => classIds.add(e.classId));
  teachings.forEach((t) => classIds.add(t.classId));
  homerooms.forEach((h) => classIds.add(h.id));

  const programIds = new Set<string>();
  if (studentProfile?.programId) programIds.add(studentProfile.programId);

  // Wali: ikut audiens anak (kelas & program).
  const childIds = (guardianProfile?.students ?? []).map((s) => s.userId);
  (guardianProfile?.students ?? []).forEach((s) => {
    if (s.programId) programIds.add(s.programId);
  });
  if (childIds.length) {
    const childEnrollments = await prisma.classEnrollment.findMany({
      where: { studentId: { in: childIds }, status: "ACTIVE" },
      select: { classId: true },
    });
    childEnrollments.forEach((e) => classIds.add(e.classId));
  }

  return {
    roles,
    classIds: Array.from(classIds),
    programIds: Array.from(programIds),
    isManager,
  };
}
