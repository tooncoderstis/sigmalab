import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Hero from "@/components/hero";
import FeatureCard from "@/components/feature-card";
import CourseCard from "@/components/course-card";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getSession();

  // Redirect logged-in users to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Fetch stats from database
  const [coursesCount, enrollmentsCount, submissionsCount, featuredCourses] =
    await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.submission.count(),
      prisma.course.findMany({
        where: { isPublished: true },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Testimonials data (hardcoded)
  const testimonials = [
    {
      id: 1,
      name: "Muhammad Arifandi",
      education: "Software Engineer at PT XYZ",
      quote:
        "Sigmalab mengubah karir saya. Dari pemula hingga mendapat pekerjaan di perusahaan teknologi terkemuka. Mentor yang responsif dan kurikulum yang relevan adalah kunci kesuksesannya.",
      avatar: "👨‍💻",
    },
    {
      id: 2,
      name: "Dery Sudrajat",
      education: "Android Developer at Tech Company",
      quote:
        "Saya sangat terbantu dengan code review 1-on-1 dari expert. Setiap feedback membantu saya memahami best practices dan meningkatkan skill programming saya secara signifikan.",
      avatar: "👨‍🔬",
    },
    {
      id: 3,
      name: "Esther Irawati",
      education: "Full Stack Developer, Startup Founder",
      quote:
        "Tidak hanya belajar coding, tapi juga mindset untuk menjadi professional. Program mentoring Sigmalab benar-benar membuat perbedaan dalam career journey saya.",
      avatar: "👩‍💼",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <Hero
        title="Bangun Karier sebagai Talenta Digital"
        subtitle="Mulai dari Nol hingga Expert dengan Kurikulum Standar Industri dan Mentoring Langsung dari Para Ahli"
        ctaText="Mulai Belajar Gratis"
        ctaHref="/courses"
        ctaSecondary={{
          text: "Lihat Semua Kursus",
          href: "/courses",
        }}
      />

      {/* Features Section */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-max">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Mengapa Memilih Sigmalab?
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Platform pembelajaran dengan standar global dirancang untuk
              menghasilkan talenta teknologi yang berkompeten dan siap industri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon="🎓"
              title="Kurikulum Standar Global"
              description="Kurikulum disusun bersama profesional dari perusahaan teknologi terkemuka, selalu up-to-date dengan kebutuhan industri terkini dan mudah dipahami pemula."
            />
            <FeatureCard
              icon="👨‍💻"
              title="Code Review 1-on-1"
              description="Setiap submission Anda akan diperiksa langsung oleh expert dengan feedback detail dan actionable recommendations untuk meningkatkan kualitas kode Anda."
            />
            <FeatureCard
              icon="🤖"
              title="Learning Intelligence"
              description="AI-powered recommendations membantu Anda memilih jalur belajar yang sesuai dengan tujuan karier dan memberikan guidance personal sepanjang perjalanan belajar."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Stat 1: Courses */}
            <div className="text-center">
              <div className="inline-block mb-4">
                <p className="text-3xl md:text-4xl font-bold gradient-text">
                  {coursesCount}+
                </p>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Kursus Tersedia
              </h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Dari Web Development hingga Mobile Apps
              </p>
            </div>

            {/* Stat 2: Learners */}
            <div className="text-center">
              <div className="inline-block mb-4">
                <p className="text-3xl md:text-4xl font-bold gradient-text">
                  {(enrollmentsCount / 1000).toFixed(1)}K+
                </p>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Learner Aktif
              </h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Belajar dan berkembang bersama
              </p>
            </div>

            {/* Stat 3: Submissions Reviewed */}
            <div className="text-center">
              <div className="inline-block mb-4">
                <p className="text-3xl md:text-4xl font-bold gradient-text">
                  {submissionsCount}+
                </p>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Submission Diulas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Feedback berkualitas dari expert
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-max">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Kursus Populer
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Mulai dengan kursus terpopuler dan paling banyak diminati oleh
              learner
            </p>
          </div>

          {featuredCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                {featuredCourses.map((course) => (
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

              <div className="text-center">
                <a href="/courses" className="btn-secondary btn-large">
                  Lihat Semua Kursus
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                Belum ada kursus yang tersedia
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Kursus baru akan segera diluncurkan
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-max">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Kisah Sukses Alumni
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Dengarkan pengalaman learner yang telah sukses membangun karir
              mereka bersama Sigmalab
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="card p-6 md:p-8 flex flex-col gap-4"
              >
                {/* Quote */}
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.education}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="container-max text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
            Siap Memulai Perjalanan Belajarmu?
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-teal-50 max-w-2xl mx-auto mb-8 md:mb-12">
            Bergabunglah dengan ribuan learner yang telah mengubah hidup mereka
            melalui pembelajaran berkualitas dan mentoring dari para expert
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all duration-200 ease-out bg-white text-teal-600 hover:shadow-lg hover:-translate-y-0.5"
            >
              Jelajahi Kursus Gratis
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all duration-200 ease-out border-2 border-white text-white hover:bg-white/10"
            >
              Daftar Sekarang
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
