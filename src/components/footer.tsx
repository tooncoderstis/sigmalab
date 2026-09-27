import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-100 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Perusahaan</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Karier
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Produk</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Kursus
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Learning Path
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Challenge
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Mentoring
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Bantuan</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Status
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-teal-400 transition-colors"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Ikuti Kami</h4>
            <div className="flex gap-4">
              {[
                { name: "Instagram", icon: "📱", href: "#" },
                { name: "LinkedIn", icon: "💼", href: "#" },
                { name: "Twitter", icon: "🐦", href: "#" },
                { name: "YouTube", icon: "📺", href: "#" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  title={social.name}
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                  aria-label={social.name}
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8 md:my-12" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © {currentYear} Sigmalab. Semua hak dilindungi.
          </div>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-gray-400 hover:text-teal-400 text-sm transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="#"
              className="text-gray-400 hover:text-teal-400 text-sm transition-colors"
            >
              Syarat Layanan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
