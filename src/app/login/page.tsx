"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        return;
      }

      router.push("/");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-sage-700">

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl p-10 shadow-2xl shadow-black/15">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={mounted ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-9"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-sage-600/25">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-sage-800 tracking-tight">Warmindo Kasir</h1>
            <p className="text-sm text-sage-400 mt-1.5 font-medium">Silakan masuk untuk melanjutkan</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50/90 backdrop-blur border border-red-200/70 text-red-600 text-sm rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
                className="w-full border border-sage-200/70 bg-white/70 rounded-xl px-4 py-3 text-sm text-sage-800 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-400 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full border border-sage-200/70 bg-white/70 rounded-xl px-4 py-3 text-sm text-sage-800 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-400 transition-all duration-200"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className="w-full bg-gradient-to-br from-sage-600 to-sage-700 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-lg shadow-sage-600/25 hover:shadow-xl hover:shadow-sage-600/30 hover:from-sage-700 hover:to-sage-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-sage-400 mt-6">
          &copy; {new Date().getFullYear()} Warmindo Kasir
        </p>
      </motion.div>
    </div>
  );
}
