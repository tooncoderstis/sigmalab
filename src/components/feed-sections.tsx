import { getAnnouncementFeed, getUpcomingActivities } from "@/lib/feeds";
import AnnouncementFeed from "@/components/announcement-feed";

/**
 * Section pengumuman + kegiatan mendatang (server component).
 * Dipakai di halaman guru & wali.
 */
export default async function FeedSections({
  user,
}: {
  user: { id: string; role: string; roles?: string[] | null };
}) {
  const feedUser = { id: user.id, role: user.role, roles: user.roles ?? [] };
  const [feed, activities] = await Promise.all([
    getAnnouncementFeed(feedUser),
    getUpcomingActivities(feedUser),
  ]);

  return (
    <>
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Pengumuman</h2>
        <AnnouncementFeed announcements={feed} />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Kegiatan Mendatang</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada kegiatan.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {activities.map((act) => (
              <li key={act.id} className="py-2 text-sm">
                <p className="font-medium">{act.title}</p>
                <p className="text-gray-500">
                  {new Date(act.startAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {act.location ? ` · ${act.location}` : ""}
                  {act.category ? ` · ${act.category}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
