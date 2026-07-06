"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Store, User, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative min-h-dvh flex items-center justify-center bg-sage-700 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sage-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-sage-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-sage-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl shadow-black/10 border border-white/20">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={mounted ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-9"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-600 to-sage-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-sage-600/30"
            >
              <Store className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-sage-800 tracking-tight">Warkop Soekardjo</h1>
            <p className="text-sm text-sage-400 mt-1.5 font-medium">Silakan masuk untuk melanjutkan</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-5"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, x: [0, -4, 4, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="bg-red-50/90 backdrop-blur border border-red-200/70 text-red-600 text-sm rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  autoFocus
                  className="w-full border border-sage-200/70 bg-white/70 rounded-xl pl-10 pr-4 py-3 text-sm text-sage-800 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-400 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full border border-sage-200/70 bg-white/70 rounded-xl pl-10 pr-11 py-3 text-sm text-sage-800 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-400 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full bg-gradient-to-br from-sage-600 to-sage-700 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-lg shadow-sage-600/25 hover:shadow-xl hover:shadow-sage-600/35 hover:from-sage-700 hover:to-sage-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200"
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
          </motion.form>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-xs text-sage-300 mt-6"
        >
          &copy; {new Date().getFullYear()} WARKOP SOEKARDJO &middot;
          Made by{" "}
          <a
            href="https://rafcode.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage-200 hover:text-white underline underline-offset-2 transition-colors"
          >
            Rafcode
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
