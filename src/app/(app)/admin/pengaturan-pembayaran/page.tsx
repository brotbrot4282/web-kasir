"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Toast } from "@/components/Toast";
import { CreditCard, Save, ShieldCheck, Sparkles } from "lucide-react";

type PengaturanPembayaran = { id: number; taxCardPersen: number; updatedAt: string };

export default function AdminPengaturanPembayaranPage() {
  const [pengaturan, setPengaturan] = useState<PengaturanPembayaran | null>(null);
  const [taxCardPersen, setTaxCardPersen] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    fetch("/api/pengaturan-pembayaran")
      .then((r) => r.json())
      .then((data: PengaturanPembayaran) => {
        setPengaturan(data);
        setTaxCardPersen(data.taxCardPersen.toString());
      });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const tp = parseInt(taxCardPersen);

    if (isNaN(tp) || tp < 0) { setToast({ message: "Tax card harus angka non-negatif", type: "error" }); return; }
    if (tp > 100) { setToast({ message: "Tax card maksimal 100%", type: "error" }); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan-pembayaran", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxCardPersen: tp }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setToast({ message: "Pengaturan pembayaran berhasil disimpan", type: "success" });
      loadData();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal simpan", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const tp = parseInt(taxCardPersen) || 0;
  const contohTax = tp > 0 ? Math.round((100000 * tp) / 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-sage-800">PENGATURAN PEMBAYARAN</h1>
        <p className="text-sm text-sage-500 mt-0.5">Konfigurasi tax biaya admin untuk pembayaran Card</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl p-5 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">Tax Card</p>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 tabular-nums">
              {tp > 0 ? `${tp}%` : "0%"}
            </p>
            <p className="text-xs text-white/70 mt-1">Biaya admin pembayaran dengan kartu</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl p-5 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">Contoh Transaksi</p>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 tabular-nums">
              {tp > 0 ? `Rp ${contohTax.toLocaleString("id-ID")}` : "Rp 0"}
            </p>
            <p className="text-xs text-white/70 mt-1">{tp > 0 ? `Tax dari total Rp 100.000 (${tp}%)` : "Atur persen tax di bawah"}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative overflow-hidden rounded-xl p-5 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">Cakupan</p>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2">Card</p>
            <p className="text-xs text-white/70 mt-1">Tax hanya untuk pembayaran Card</p>
          </div>
        </motion.div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-sage-200 shadow-sm p-6"
      >
        <form onSubmit={simpan} className="space-y-6 max-w-2xl">
          {/* Tax Card Persen */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-sage-700 mb-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-violet-600" />
              </div>
              Tax Card (Persen)
            </label>
            <div className="relative">
              <input
                type="number"
                value={taxCardPersen}
                onChange={(e) => setTaxCardPersen(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-sage-300 text-sm font-medium text-sage-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
                min={0}
                max={100}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sage-400">%</span>
            </div>
            <div className="mt-2 flex items-start gap-2 bg-violet-50 rounded-lg px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-700">
                Contoh: Total belanja <span className="font-semibold">Rp 100.000</span> bayar Card → tax{" "}
                <span className="font-semibold">{tp}%</span> ={" "}
                <span className="font-semibold">Rp {contohTax.toLocaleString("id-ID")}</span>, customer bayar{" "}
                <span className="font-semibold">Rp {(100000 + contohTax).toLocaleString("id-ID")}</span>. Isi{" "}
                <span className="font-semibold">0</span> untuk tanpa tax.
              </p>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2 flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </motion.button>
            {pengaturan && (
              <p className="text-xs text-sage-400">
                Terakhir diperbarui: {new Date(pengaturan.updatedAt ?? pengaturan.id).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </form>
      </motion.div>

      {/* Cara Kerja */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-sage-50 rounded-xl border border-sage-200 p-6"
      >
        <h2 className="text-sm font-semibold text-sage-700 mb-4">Cara Kerja Tax Card</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-sage-700">1. Customer Bayar Card</p>
              <p className="text-xs text-sage-400 mt-0.5">
                Kasir memilih metode bayar Card di halaman kasir
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-sage-700">2. Tax Otomatis</p>
              <p className="text-xs text-sage-400 mt-0.5">
                {tp > 0 ? `Tax ${tp}% ditambahkan ke total yang dibayar customer` : "Atur persen tax di atas"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-sage-700">3. Tercatat di Struk</p>
              <p className="text-xs text-sage-400 mt-0.5">
                Tax muncul di struk, invoice, dan riwayat transaksi
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
