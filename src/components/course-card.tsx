import Link from "next/link";
import { CourseLevel } from "@prisma/client";

interface CourseCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  price: number;
  isPremium: boolean;
  thumbnailUrl?: string;
}

const levelBadgeColor = {
  PEMULA: "badge-success",
  MENENGAH: "badge-warning",
  LANJUTAN: "badge-danger",
};

const levelLabel = {
  PEMULA: "Pemula",
  MENENGAH: "Menengah",
  LANJUTAN: "Lanjutan",
};

export default function CourseCard({
  slug,
  title,
  description,
  level,
  price,
  isPremium,
  thumbnailUrl,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${slug}`}>
      <div className="card-interactive overflow-hidden group">
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-gradient-to-br from-teal-200 to-cyan-200 dark:from-teal-900/30 dark:to-cyan-900/30 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-teal-400 dark:text-teal-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 9h12v-3H4v3z" />
              </svg>
            </div>
          )}

          {/* Premium Badge */}
          {isPremium && (
            <div className="absolute top-3 right-3 badge-primary">
              <span className="text-xs">💎 Premium</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-3">
          {/* Level Badge */}
          <div className={`${levelBadgeColor[level]} w-fit`}>
            {levelLabel[level]}
          </div>

          {/* Title */}
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-gray-800">
            {/* Price */}
            <div className="text-base md:text-lg font-bold">
              {isPremium ? (
                <span className="text-gray-900 dark:text-white">
                  Rp {(price / 1000).toLocaleString("id-ID")}K
                </span>
              ) : (
                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                  Gratis
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="text-teal-600 dark:text-teal-400 font-semibold text-sm group-hover:gap-2 flex items-center gap-1 transition-all">
              Lihat
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
