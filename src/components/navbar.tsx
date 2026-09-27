"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* SVG Logo */}
            <svg
              className="w-8 h-8"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="logoGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              {/* Sigma Symbol with gradient */}
              <text
                x="16"
                y="24"
                fontSize="24"
                fontWeight="bold"
                textAnchor="middle"
                fill="url(#logoGradient)"
              >
                Σ
              </text>
            </svg>

            {/* Brand Name */}
            <span className="hidden sm:inline text-xl font-bold gradient-text">
              Sigmalab
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/courses"
              className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
            >
              Courses
            </Link>
            <a
              href="/courses"
              className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
            >
              Learning Paths
            </a>
          </div>

          {/* Right Section - Auth */}
          <div className="hidden md:flex items-center gap-4">
            {!session ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link href="/register" className="btn-primary btn-small">
                  Register
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex flex-col gap-1.5 w-8 h-8 justify-center items-center"
            aria-label="Toggle menu"
          >
            <span
              className={`h-0.5 w-6 bg-gray-700 dark:bg-gray-300 transition-all ${
                isMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-gray-700 dark:bg-gray-300 transition-all ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-gray-700 dark:bg-gray-300 transition-all ${
                isMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 dark:border-gray-800 pt-4">
            <Link
              href="/"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/courses"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Courses
            </Link>
            <a
              href="/courses"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Learning Paths
            </a>

            {!session ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <Link
                  href="/login"
                  className="block text-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block text-center btn-primary btn-small"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
