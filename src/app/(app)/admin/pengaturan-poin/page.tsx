"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Toast } from "@/components/Toast";

type PengaturanPoin = { id: number; rupiahPerPoin: number; poinPerGratisItem: number; updatedAt: string };

export default function AdminPengaturanPoinPage() {
  const [pengaturan, setPengaturan] = useState<PengaturanPoin | null>(null);
  const [rupiahPerPoin, setRupiahPerPoin] = useState("");
  const [poinPerGratisItem, setPoinPerGratisItem] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    fetch("/api/pengaturan-poin")
      .then((r) => r.json())
      .then((data: PengaturanPoin) => {
        setPengaturan(data);
        setRupiahPerPoin(data.rupiahPerPoin.toString());
        setPoinPerGratisItem(data.poinPerGratisItem.toString());
      });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const rpp = parseInt(rupiahPerPoin);
    const ppg = parseInt(poinPerGratisItem);

    if (!rpp || rpp <= 0) { setToast({ message: "Rupiah per poin harus angka positif", type: "error" }); return; }
    if (!ppg || ppg <= 0) { setToast({ message: "Poin per gratis item harus angka positif", type: "error" }); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan-poin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rupiahPerPoin: rpp, poinPerGratisItem: ppg }),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sage-800">PENGATURAN POIN</h1>
        <p className="text-sm text-sage-500 mt-0.5">Konfigurasi nilai tukar poin loyalty</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-sage-200 shadow-sm p-6 max-w-lg"
      >
        <form onSubmit={simpan} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1">Rupiah per Poin</label>
            <input
              type="number"
              value={rupiahPerPoin}
              onChange={(e) => setRupiahPerPoin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-sage-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              min={1}
            />
            <p className="text-xs text-sage-400 mt-1">
              Setiap Rp <span className="font-semibold text-sage-600">{rupiahPerPoin ? parseInt(rupiahPerPoin).toLocaleString("id-ID") : "0"}</span> belanja = 1 poin
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1">Poin per Gratis Item</label>
            <input
              type="number"
              value={poinPerGratisItem}
              onChange={(e) => setPoinPerGratisItem(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-sage-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              min={1}
            />
            <p className="text-xs text-sage-400 mt-1">
              <span className="font-semibold text-sage-600">{poinPerGratisItem || "0"}</span> poin = 1 item gratis (any item)
            </p>
          </div>

          <div className="pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </motion.button>
          </div>
        </form>

        {pengaturan && (
          <div className="mt-6 pt-5 border-t border-sage-100">
            <p className="text-xs text-sage-400">
              Terakhir diperbarui: {new Date(pengaturan.updatedAt ?? pengaturan.id).toLocaleString("id-ID")}
            </p>
          </div>
        )}
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
