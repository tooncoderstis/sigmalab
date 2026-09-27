interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="card hover:shadow-xl transition-all duration-300 p-6 md:p-8 flex flex-col gap-4">
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center">
        <div className="text-2xl">{icon}</div>
      </div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
