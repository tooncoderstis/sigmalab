import type { Prisma, Role } from "@prisma/client";

// Visibilitas audiens untuk pengumuman & kegiatan (ADR-0011).
// Fungsi murni + pembuat filter Prisma; konteks dibangun di audience-context.ts.

export type TargetInput = {
  role?: string | null;
  classId?: string | null;
  programId?: string | null;
};

export type AudienceContext = {
  roles: string[];
  classIds: string[];
  programIds: string[];
  isManager: boolean;
};

/** Apakah satu baris target cocok dengan konteks user. */
export function targetMatches(
  target: TargetInput,
  ctx: AudienceContext
): boolean {
  if (target.role && ctx.roles.includes(target.role)) return true;
  if (target.classId && ctx.classIds.includes(target.classId)) return true;
  if (target.programId && ctx.programIds.includes(target.programId)) {
    return true;
  }
  return false;
}

/** Apakah konten (pengumuman/kegiatan) terlihat oleh user. */
export function contentMatches(
  content: { audienceAll: boolean; targets: TargetInput[] },
  ctx: AudienceContext
): boolean {
  if (ctx.isManager) return true;
  if (content.audienceAll) return true;
  return content.targets.some((target) => targetMatches(target, ctx));
}

function targetOr(ctx: AudienceContext): Record<string, unknown>[] {
  const or: Record<string, unknown>[] = [];
  if (ctx.roles.length) or.push({ role: { in: ctx.roles as Role[] } });
  if (ctx.classIds.length) or.push({ classId: { in: ctx.classIds } });
  if (ctx.programIds.length) or.push({ programId: { in: ctx.programIds } });
  return or;
}

/**
 * Filter `where` untuk mengambil konten yang terlihat user.
 * Manager → filter kosong (lihat semua).
 */
export function audienceFilter(ctx: AudienceContext): Record<string, unknown> {
  if (ctx.isManager) return {};
  const inner = targetOr(ctx);
  const or: Record<string, unknown>[] = [{ audienceAll: true }];
  if (inner.length) or.push({ targets: { some: { OR: inner } } });
  return { OR: or };
}

export function announcementWhere(
  ctx: AudienceContext
): Prisma.AnnouncementWhereInput {
  return audienceFilter(ctx) as Prisma.AnnouncementWhereInput;
}

export function activityWhere(
  ctx: AudienceContext
): Prisma.SchoolActivityWhereInput {
  return audienceFilter(ctx) as Prisma.SchoolActivityWhereInput;
}
