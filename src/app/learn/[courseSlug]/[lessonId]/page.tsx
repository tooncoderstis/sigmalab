import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../auth";
import { redirect, notFound } from "next/navigation";
import MarkCompleteButton from "./mark-complete-button";
import QuizForm from "./quiz-form";
import SubmissionForm from "./submission-form";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              quiz: {
                include: { questions: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  if (!enrollment) {
    redirect(`/courses/${courseSlug}`);
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[currentIndex];

  if (!lesson) notFound();

  const nextLesson = allLessons[currentIndex + 1];
  const nextLessonUrl = nextLesson
    ? "/learn/" + courseSlug + "/" + nextLesson.id
    : null;

  const progress = await prisma.progress.findUnique({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId: lesson.id },
    },
  });

  const isCompleted = progress?.status === "COMPLETED";

  let latestSubmission = null;
  if (lesson.type === "SUBMISSION") {
    latestSubmission = await prisma.submission.findFirst({
      where: { userId: session.user.id, lessonId: lesson.id },
      orderBy: { submittedAt: "desc" },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r p-4 hidden md:block">
        <h2 className="font-semibold mb-4">{course.title}</h2>
        {course.modules.map((module) => (
          <div key={module.id} className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-2">
              {module.title}
            </p>
            <ul className="space-y-1">
              {module.lessons.map((l) => {
                const isActive = l.id === lesson.id;
                return (
                  <li key={l.id}>
                    <a
                      href={"/learn/" + courseSlug + "/" + l.id}
                      className={
                        isActive
                          ? "block text-sm px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium"
                          : "block text-sm px-2 py-1 rounded text-gray-600 hover:bg-gray-50"
                      }
                    >
                      {l.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>

          {lesson.type === "VIDEO" && lesson.videoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <iframe
                src={lesson.videoUrl}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}

          {lesson.type === "ARTICLE" && (
            <div className="prose max-w-none mb-6">{lesson.articleBody}</div>
          )}

          {(lesson.type === "VIDEO" || lesson.type === "ARTICLE") && (
            <MarkCompleteButton
              lessonId={lesson.id}
              isCompleted={isCompleted}
              nextLessonUrl={nextLessonUrl}
              dashboardUrl="/dashboard"
            />
          )}

          {lesson.type === "QUIZ" && lesson.quiz && (
            <QuizForm
              quizId={lesson.quiz.id}
              lessonId={lesson.id}
              questions={lesson.quiz.questions}
              passingScore={lesson.passingScore ?? 80}
              nextLessonUrl={nextLessonUrl}
              dashboardUrl="/dashboard"
            />
          )}

          {lesson.type === "QUIZ" && !lesson.quiz && (
            <p className="text-red-600 text-sm">
              Quiz untuk lesson ini belum dibuat.
            </p>
          )}

          {lesson.type === "SUBMISSION" && (
            <SubmissionForm
              lessonId={lesson.id}
              existingSubmission={
                latestSubmission
                  ? {
                      status: latestSubmission.status,
                      feedback: latestSubmission.feedback,
                      repoUrl: latestSubmission.repoUrl,
                      notes: latestSubmission.notes,
                    }
                  : null
              }
              nextLessonUrl={nextLessonUrl}
              dashboardUrl="/dashboard"
            />
          )}
        </div>
      </main>
    </div>
  );
}