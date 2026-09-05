import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import EnrollButton from "./enroll-button";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  let alreadyEnrolled = false;
  if (session?.user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });
    alreadyEnrolled = !!enrollment;
  }

  const firstLesson = course.modules[0]?.lessons[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {course.category.name}
        </span>

        <h1 className="text-3xl font-bold mt-3">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Silabus</h2>

          {course.modules.map((module) => (
            <div key={module.id} className="mb-4">
              <h3 className="font-medium">{module.title}</h3>
              <ul className="mt-2 space-y-1">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="text-sm text-gray-600 pl-4 border-l-2"
                  >
                    {lesson.title}{" "}
                    <span className="text-xs text-gray-400">
                      ({lesson.type})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <EnrollButton
            courseId={course.id}
            courseSlug={course.slug}
            firstLessonId={firstLesson?.id ?? null}
            isPremium={course.isPremium}
            price={course.price}
            isLoggedIn={!!session?.user}
            alreadyEnrolled={alreadyEnrolled}
          />
        </div>
      </div>
    </div>
  );
}