import { prisma } from "@/lib/prisma";

export type NotifyInput = {
  userId: string;
  type?: string;
  title: string;
  body?: string;
  link?: string;
};

/** Membuat notifikasi in-app (best-effort). Lihat ADR-0014. */
export async function notifyUser(input: NotifyInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: (input.type ?? "SYSTEM") as never,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}

/** Membuat notifikasi untuk banyak pengguna sekaligus. */
export async function notifyUsers(
  userIds: string[],
  input: Omit<NotifyInput, "userId">
) {
  if (userIds.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: (input.type ?? "SYSTEM") as never,
      title: input.title,
      body: input.body,
      link: input.link,
    })),
  });
}
