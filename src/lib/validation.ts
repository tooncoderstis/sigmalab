import { z } from "zod";

export const roleValues = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "LEARNER",
  "REVIEWER",
] as const;

export const programTypeValues = ["SEKOLAH", "BIMBEL", "KULIAH"] as const;
export const attendanceStatusValues = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "SICK",
  "EXCUSED",
] as const;

export const academicYearInput = z.object({
  name: z.string().min(4).max(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const termInput = z.object({
  academicYearId: z.string().min(1),
  name: z.string().min(1).max(40),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const programInput = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  type: z.enum(programTypeValues).optional(),
  gradeLevel: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

export const subjectInput = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(30).optional(),
  programId: z.string().min(1).optional(),
});

export const classInput = z.object({
  name: z.string().min(1).max(100),
  programId: z.string().min(1),
  termId: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(),
  homeroomTeacherId: z.string().min(1).optional(),
  capacity: z.number().int().positive().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const managedUserInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "STAFF"]),
  nis: z.string().max(30).optional(),
  nisn: z.string().max(30).optional(),
  nip: z.string().max(30).optional(),
  programId: z.string().min(1).optional(),
  guardianId: z.string().min(1).optional(),
  phone: z.string().max(30).optional(),
  occupation: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  specialty: z.string().max(100).optional(),
});

export const classEnrollmentInput = z.object({
  studentId: z.string().min(1),
});

export const teachingAssignmentInput = z.object({
  teacherId: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  role: z.enum(["MAIN", "ASSISTANT"]).optional(),
});

export const attendanceSessionInput = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  date: z.coerce.date(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  topic: z.string().max(200).optional(),
});

export const attendanceRecordInput = z.object({
  studentId: z.string().min(1),
  status: z.enum(attendanceStatusValues),
  note: z.string().max(200).optional(),
});

export const attendanceBulkInput = z.object({
  records: z.array(attendanceRecordInput).min(1),
});

export const teacherAttendanceInput = z.object({
  date: z.coerce.date().optional(),
  status: z.enum(attendanceStatusValues).optional(),
  note: z.string().max(200).optional(),
  action: z.enum(["check-in", "check-out"]).optional(),
});

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
