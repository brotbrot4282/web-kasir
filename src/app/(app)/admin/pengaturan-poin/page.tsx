"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Toast } from "@/components/Toast";
import { Coins, Save, ShoppingCart, Sparkles, ShieldCheck, BadgeCheck } from "lucide-react";

type PengaturanPoin = { id: number; rupiahPerPoin: number; nilaiPerPoin: number; minimalTransaksi: number; updatedAt: string };

export default function AdminPengaturanPoinPage() {
  const [pengaturan, setPengaturan] = useState<PengaturanPoin | null>(null);
  const [rupiahPerPoin, setRupiahPerPoin] = useState("");
  const [nilaiPerPoin, setNilaiPerPoin] = useState("");
  const [minimalTransaksi, setMinimalTransaksi] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    fetch("/api/pengaturan-poin")
      .then((r) => r.json())
      .then((data: PengaturanPoin) => {
        setPengaturan(data);
        setRupiahPerPoin(data.rupiahPerPoin.toString());
        setNilaiPerPoin(data.nilaiPerPoin.toString());
        setMinimalTransaksi(data.minimalTransaksi.toString());
      });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const rpp = parseInt(rupiahPerPoin);
    const np = parseInt(nilaiPerPoin);
    const mt = parseInt(minimalTransaksi);

    if (!rpp || rpp <= 0) { setToast({ message: "Rupiah per poin harus angka positif", type: "error" }); return; }
    if (!np || np <= 0) { setToast({ message: "Nilai per poin harus angka positif", type: "error" }); return; }
    if (isNaN(mt) || mt < 0) { setToast({ message: "Minimal transaksi harus angka non-negatif", type: "error" }); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan-poin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rupiahPerPoin: rpp, nilaiPerPoin: np, minimalTransaksi: mt }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setToast({ message: "Pengaturan poin berhasil disimpan", type: "success" });
      loadData();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal simpan", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const rpp = parseInt(rupiahPerPoin) || 0;
  const np = parseInt(nilaiPerPoin) || 0;
  const mt = parseInt(minimalTransaksi) || 0;
  const contohPoinDari30k = rpp > 0 ? Math.floor(30000 / rpp) : 0;
  const contohPotongan10poin = np > 0 ? 10 * np : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-sage-800">PENGATURAN POIN</h1>
        <p className="text-sm text-sage-500 mt-0.5">Konfigurasi nilai tukar poin loyalty</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl p-5 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">Rupiah per Poin</p>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Coins className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 tabular-nums">
              {rpp > 0 ? `Rp ${rpp.toLocaleString("id-ID")}` : "-"}
            </p>
            <p className="text-xs text-white/70 mt-1">Setiap belanja segini = 1 poin</p>
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
              <p className="text-sm text-white/80">Nilai per Poin</p>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 tabular-nums">
              {np > 0 ? `Rp ${np.toLocaleString("id-ID")}` : "-"}
            </p>
            <p className="text-xs text-white/70 mt-1">1 poin = Rp ini (potongan langsung)</p>
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
              <p className="text-sm text-white/80">Minimal Transaksi</p>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2 tabular-nums">
              {mt > 0 ? `Rp ${mt.toLocaleString("id-ID")}` : "Tanpa batas"}
            </p>
            <p className="text-xs text-white/70 mt-1">Sisa bayar setelah pakai poin</p>
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
          {/* Rupiah per Poin */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-sage-700 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              Rupiah per Poin (Earning)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-sage-400">Rp</span>
              <input
                type="number"
                value={rupiahPerPoin}
                onChange={(e) => setRupiahPerPoin(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-sage-300 text-sm font-medium text-sage-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                min={1}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sage-400">poin</span>
            </div>
            <div className="mt-2 flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Contoh: Belanja <span className="font-semibold">Rp 30.000</span> → dapat{" "}
                <span className="font-semibold">{contohPoinDari30k} poin</span>
              </p>
            </div>
          </div>

          {/* Nilai per Poin */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-sage-700 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
              </div>
              Nilai per Poin (Redemption)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-sage-400">Rp</span>
              <input
                type="number"
                value={nilaiPerPoin}
                onChange={(e) => setNilaiPerPoin(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-sage-300 text-sm font-medium text-sage-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                min={1}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sage-400">per poin</span>
            </div>
            <div className="mt-2 flex items-start gap-2 bg-emerald-50 rounded-lg px-3 py-2">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-700">
                Contoh: Tukar <span className="font-semibold">10 poin</span> → potongan{" "}
                <span className="font-semibold">Rp {contohPotongan10poin.toLocaleString("id-ID")}</span>
              </p>
            </div>
          </div>

          {/* Minimal Transaksi */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-sage-700 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              Minimal Transaksi (setelah pakai poin)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-sage-400">Rp</span>
              <input
                type="number"
                value={minimalTransaksi}
                onChange={(e) => setMinimalTransaksi(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-sage-300 text-sm font-medium text-sage-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                min={0}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sage-400">rupiah</span>
            </div>
            <div className="mt-2 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Sisa yang harus dibayar setelah pakai poin tidak boleh di bawah ini. Isi <span className="font-semibold">0</span> untuk tanpa batas.
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
        <h2 className="text-sm font-semibold text-sage-700 mb-4">Cara Kerja Poin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-sage-700">1. Customer Belanja</p>
              <p className="text-xs text-sage-400 mt-0.5">
                Setiap transaksi dengan member akan otomatis mengumpulkan poin
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-sage-700">2. Dapat Poin</p>
              <p className="text-xs text-sage-400 mt-0.5">
                {rpp > 0 ? `Setiap Rp ${rpp.toLocaleString("id-ID")} belanja = 1 poin` : "Atur rupiah per poin di atas"}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-sage-700">3. Tukar Poin</p>
              <p className="text-xs text-sage-400 mt-0.5">
                {np > 0 ? `1 poin = Rp ${np.toLocaleString("id-ID")}, potongan langsung dari total` : "Atur nilai per poin di atas"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
