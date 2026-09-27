"use client";

import CourseCard from "@/components/course-card";
import Hero from "@/components/hero";
import { useState, useEffect } from "react";
import { CourseLevel } from "@prisma/client";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  price: number;
  isPremium: boolean;
  thumbnailUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CoursesPageClientProps {
  courses: Course[];
}

export default function CoursesPageClient({ courses: initialCourses }: CoursesPageClientProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | "ALL">("ALL");
  const [selectedPrice, setSelectedPrice] = useState<"ALL" | "FREE" | "PREMIUM">(
    "ALL"
  );

  // Filter courses
  useEffect(() => {
    let filtered = initialCourses;

    // Search by title or description
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by level
    if (selectedLevel !== "ALL") {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Filter by price
    if (selectedPrice !== "ALL") {
      if (selectedPrice === "FREE") {
        filtered = filtered.filter((course) => !course.isPremium);
      } else if (selectedPrice === "PREMIUM") {
        filtered = filtered.filter((course) => course.isPremium);
      }
    }

    setCourses(filtered);
  }, [searchQuery, selectedLevel, selectedPrice, initialCourses]);

  return (
    <>
      {/* Hero Section */}
      <Hero
        title="Jelajahi Semua Kursus"
        subtitle="Temukan kursus yang sempurna untuk mengembangkan skill dan karir Anda"
        ctaText="Lihat Populer"
        ctaHref="#courses"
      />

      {/* Filters & Search */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 md:py-5 lg:py-6 bg-white dark:bg-gray-950 sticky top-16 z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="container-max">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Level Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Level
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "PEMULA", "MENENGAH", "LANJUTAN"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setSelectedLevel(level as CourseLevel | "ALL")
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      selectedLevel === level
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {level === "ALL" ? "Semua" : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Harga
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "ALL", label: "Semua" },
                  { value: "FREE", label: "Gratis" },
                  { value: "PREMIUM", label: "Premium" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      setSelectedPrice(value as "ALL" | "FREE" | "PREMIUM")
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      selectedPrice === value
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-end justify-start md:justify-end">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {courses.length}
                </span>{" "}
                kursus ditemukan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section id="courses" className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-max">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Tidak ada kursus ditemukan
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Coba ubah filter atau cari dengan keyword lain
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  slug={course.slug}
                  title={course.title}
                  description={course.description}
                  level={course.level}
                  price={course.price}
                  isPremium={course.isPremium}
                  thumbnailUrl={course.thumbnailUrl || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
