"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Calculate password strength
    if (name === "password") {
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^a-zA-Z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrasi gagal");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { text: "", color: "" };
    if (passwordStrength === 1) return { text: "Lemah", color: "text-red-600" };
    if (passwordStrength === 2) return { text: "Sedang", color: "text-yellow-600" };
    if (passwordStrength === 3)
      return { text: "Kuat", color: "text-teal-600" };
    return { text: "Sangat Kuat", color: "text-green-600" };
  };

  const strengthLabel = getPasswordStrengthLabel();

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
              Buat Akun Baru
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bergabung dengan ribuan learner lainnya
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="badge-danger bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800">
              ✕ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Contoh: Muhammad Arifandi"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
            </div>

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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordStrength
                            ? "bg-teal-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  {strengthLabel.text && (
                    <p className={`text-xs font-semibold ${strengthLabel.color}`}>
                      Kekuatan: {strengthLabel.text}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Password harus minimal 6 karakter
              </p>
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
                  Membuat Akun...
                </span>
              ) : (
                "Daftar Sekarang"
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

          {/* Login Link */}
          <p className="text-center text-gray-600 dark:text-gray-400">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Masuk Sekarang
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
