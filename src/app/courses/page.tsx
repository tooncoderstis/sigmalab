import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Katalog Kelas</h1>
        <p className="text-gray-600 mb-8">
          Pilih kelas yang sesuai dengan minatmu
        </p>

        {courses.length === 0 ? (
          <p className="text-gray-500">Belum ada kelas yang tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-5 block"
              >
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {course.category.name}
                </span>

                <h2 className="text-lg font-semibold mt-3">{course.title}</h2>

                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {course.level}
                  </span>
                  <span className="font-semibold">
                    {course.isPremium
                      ? `Rp ${course.price.toLocaleString("id-ID")}`
                      : "Gratis"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}