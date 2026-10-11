import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MarkReadButton from "@/components/mark-read-button";

export type FeedAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: Date | null;
  authorName: string | null;
  read: boolean;
};

export default function AnnouncementFeed({
  announcements,
}: {
  announcements: FeedAnnouncement[];
}) {
  if (announcements.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada pengumuman.</p>;
  }

  return (
    <ul className="space-y-4">
      {announcements.map((a) => (
        <li
          key={a.id}
          className={`rounded-xl border p-4 ${
            a.read
              ? "border-gray-200 dark:border-gray-800"
              : "border-teal-300 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {a.pinned ? "📌 " : ""}
                {a.title}
              </p>
              <p className="text-xs text-gray-500">
                {a.authorName ? `${a.authorName} · ` : ""}
                {a.publishedAt
                  ? new Date(a.publishedAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </p>
            </div>
            {!a.read && (
              <span className="shrink-0 rounded-full bg-teal-600 text-white text-[10px] px-2 py-0.5">
                Baru
              </span>
            )}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none mt-2 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.body}</ReactMarkdown>
          </div>
          {!a.read && (
            <div className="mt-2">
              <MarkReadButton announcementId={a.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
