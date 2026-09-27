"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card p-8 md:p-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block mb-2">
              <svg
                className="w-8 h-8 mx-auto"
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
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Masuk ke Sigmalab
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Lanjutkan perjalanan belajarmu
            </p>
          </div>

          {/* Success Message */}
          {justRegistered && (
            <div className="badge-success bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800">
              ✓ Registrasi berhasil, silakan login sekarang
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="badge-danger bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800">
              ✕ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="nama@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Lupa Password?
                </a>
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk ke Akun"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Atau
              </span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600 dark:text-gray-400">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Daftar Sekarang
            </Link>
          </p>

          {/* Back to Home */}
          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Kembali ke Beranda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
