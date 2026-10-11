import { z } from "zod";
import {
  assignmentFileTypes,
  MAX_ASSIGNMENT_FILE_BYTES,
} from "@/lib/assignment-file";

export { assignmentFileTypes, MAX_ASSIGNMENT_FILE_BYTES };

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

// ============================================================
// FASE 2 — penilaian, tugas, rapor
// ============================================================

export const assessmentTypeValues = [
  "TUGAS",
  "ULANGAN",
  "UTS",
  "UAS",
  "PRAKTIK",
  "PROYEK",
] as const;

export const workflowStatusValues = ["SUBMITTED", "GRADED", "RETURNED"] as const;
export const reportCardStatusValues = ["DRAFT", "PUBLISHED"] as const;

export const assessmentInput = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  termId: z.string().min(1).optional(),
  type: z.enum(assessmentTypeValues).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  maxScore: z.number().int().positive().max(1000).optional(),
  weight: z.number().int().positive().max(100).optional(),
  dueAt: z.coerce.date().optional(),
});

export const assessmentUpdateInput = z.object({
  subjectId: z.string().min(1).nullable().optional(),
  termId: z.string().min(1).nullable().optional(),
  type: z.enum(assessmentTypeValues).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  maxScore: z.number().int().positive().max(1000).optional(),
  weight: z.number().int().positive().max(100).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  published: z.boolean().optional(),
});

export const gradeInput = z.object({
  studentId: z.string().min(1),
  score: z.number().min(0).max(1000),
  feedback: z.string().max(2000).optional(),
});

export const gradeBulkInput = z.object({
  grades: z.array(gradeInput).min(1),
});

export const assignmentSubmissionInput = z.object({
  fileKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  fileSize: z.number().int().positive().max(MAX_ASSIGNMENT_FILE_BYTES),
  notes: z.string().max(2000).optional(),
});

export const presignInput = z.object({
  assessmentId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(assignmentFileTypes),
  fileSize: z.number().int().positive().max(MAX_ASSIGNMENT_FILE_BYTES),
});

export const reportCardGenerateInput = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  homeroomNote: z.string().max(4000).optional(),
});

export const reportCardUpdateInput = z.object({
  status: z.enum(reportCardStatusValues).optional(),
  homeroomNote: z.string().max(4000).nullable().optional(),
});

// ============================================================
// FASE 2B/2C — pengumuman & kegiatan sekolah
// ============================================================

export const announcementStatusValues = ["DRAFT", "PUBLISHED"] as const;

const audienceTargetInput = z
  .object({
    role: z.enum(roleValues).optional(),
    classId: z.string().min(1).optional(),
    programId: z.string().min(1).optional(),
  })
  .refine((t) => Boolean(t.role || t.classId || t.programId), {
    message: "Target audiens butuh salah satu: role, classId, atau programId",
  });

export const announcementInput = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  status: z.enum(announcementStatusValues).optional(),
  pinned: z.boolean().optional(),
  audienceAll: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
  targets: z.array(audienceTargetInput).max(50).optional(),
});

export const announcementUpdateInput = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(20000).optional(),
  pinned: z.boolean().optional(),
  status: z.enum(announcementStatusValues).optional(),
  audienceAll: z.boolean().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  targets: z.array(audienceTargetInput).max(50).optional(),
});

export const activityInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  audienceAll: z.boolean().optional(),
  targets: z.array(audienceTargetInput).max(50).optional(),
});

export const activityUpdateInput = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).nullable().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  audienceAll: z.boolean().optional(),
  targets: z.array(audienceTargetInput).max(50).optional(),
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
