import Link from "next/link";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  ctaSecondary?: {
    text: string;
    href: string;
  };
  align?: "center" | "left";
}

export default function Hero({
  title,
  subtitle,
  ctaText,
  ctaHref,
  ctaSecondary,
  align = "center",
}: HeroProps) {
  const alignClass =
    align === "center"
      ? "text-center items-center"
      : "text-left items-start";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-16 md:py-24 lg:py-32">
      {/* Background gradient blur effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col gap-6 ${alignClass} py-12 md:py-16`}>
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white max-w-3xl">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href={ctaHref} className="btn-primary btn-large">
              {ctaText}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="btn-secondary btn-large"
              >
                {ctaSecondary.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
