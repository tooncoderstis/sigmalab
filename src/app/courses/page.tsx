import { prisma } from "@/lib/prisma";
import CoursesPageClient from "./courses-client";
import { CourseLevel } from "@prisma/client";

export const dynamic = "force-dynamic";

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

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return <CoursesPageClient courses={courses as Course[]} />;
}
