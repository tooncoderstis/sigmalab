import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NotificationReadButton from "@/components/notification-read-button";

export default async function NotifikasiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="section-padding bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Notifikasi
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pemberitahuan terbaru untuk Anda.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max space-y-3">
          {notifications.length === 0 ? (
            <div className="card p-6">
              <p className="text-sm text-gray-500">Belum ada notifikasi.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`card p-4 ${
                  n.readAt ? "" : "border-teal-300 dark:border-teal-800"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-medium">
                      {n.readAt ? "" : "● "}
                      {n.title}
                    </p>
                    {n.body && <p className="text-sm text-gray-600">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-teal-600 hover:underline text-xs"
                      >
                        Buka
                      </Link>
                    )}
                    {!n.readAt && <NotificationReadButton notificationId={n.id} />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
