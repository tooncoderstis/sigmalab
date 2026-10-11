import { prisma } from "@/lib/prisma";

/**
 * Guru (dengan TeachingAssignment di kelas itu) atau manager
 * (ADMIN/SUPER_ADMIN) boleh mengelola aktivitas penilaian kelas.
 */
export async function canManageClass(
  classId: string,
  userId: string,
  isManager: boolean
): Promise<boolean> {
  if (isManager) return true;

  const assignment = await prisma.teachingAssignment.findFirst({
    where: { classId, teacherId: userId },
    select: { id: true },
  });
  return Boolean(assignment);
}

/**
 * Boleh melihat nilai/rapor siswa: manager, siswa itu sendiri,
 * guru kelas, atau wali dari siswa tersebut.
 */
export async function canViewStudent(
  studentId: string,
  userId: string,
  opts: { isManager: boolean; isTeacher: boolean }
): Promise<boolean> {
  if (opts.isManager) return true;
  if (opts.isTeacher) return true;
  if (studentId === userId) return true;

  const link = await prisma.studentProfile.findFirst({
    where: { userId: studentId, guardian: { userId } },
    select: { id: true },
  });
  return Boolean(link);
}

/**
 * Memastikan siswa terdaftar (ClassEnrollment aktif) di kelas tertentu.
 */
export async function isEnrolledInClass(
  classId: string,
  studentId: string
): Promise<boolean> {
  const enrollment = await prisma.classEnrollment.findFirst({
    where: { classId, studentId, status: "ACTIVE" },
    select: { id: true },
  });
  return Boolean(enrollment);
}
