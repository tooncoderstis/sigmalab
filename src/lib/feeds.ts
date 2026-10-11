import { prisma } from "@/lib/prisma";
import { getAudienceContext } from "@/lib/audience-context";
import { announcementWhere, activityWhere } from "@/lib/audience";
import type { SessionUser } from "@/lib/roles";

/** Feed pengumuman terlihat oleh user (tanpa draf/kadaluarsa). Lihat ADR-0011. */
export async function getAnnouncementFeed(user: SessionUser, take = 30) {
  const ctx = await getAudienceContext(user);

  const rows = await prisma.announcement.findMany({
    where: {
      AND: [
        { status: "PUBLISHED" },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        announcementWhere(ctx),
      ],
    },
    include: {
      author: { select: { name: true } },
      reads: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take,
  });

  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    pinned: a.pinned,
    publishedAt: a.publishedAt,
    authorName: a.author?.name ?? null,
    read: a.reads.length > 0,
  }));
}

/** Jumlah pengumuman belum dibaca (untuk badge). */
export async function getUnreadAnnouncementCount(user: SessionUser) {
  const feed = await getAnnouncementFeed(user, 100);
  return feed.filter((a) => !a.read).length;
}

/** Agenda kegiatan mendatang yang terlihat user. */
export async function getUpcomingActivities(user: SessionUser, take = 30) {
  const ctx = await getAudienceContext(user);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return prisma.schoolActivity.findMany({
    where: {
      AND: [activityWhere(ctx), { startAt: { gte: startOfToday } }],
    },
    orderBy: { startAt: "asc" },
    take,
  });
}
