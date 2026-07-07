"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toast } from "@/components/Toast";

type Member = { id: string; noWa: string; nama: string | null; poin: number; createdAt: string };
type RewardItem = { id: string; poin: number; keterangan: string | null; createdAt: string; transaksi: { noTransaksi: string } | null };
type MemberDetail = Member & { rewardPoin: RewardItem[] };

export default function AdminCustomerPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [poinKurang, setPoinKurang] = useState("");
  const [alasan, setAlasan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/member${params}`).then((r) => r.json()).then(setMembers);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    setSelectedMember(null);
    try {
      const res = await fetch(`/api/member/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedMember(data);
      setPoinKurang("");
      setAlasan("");
    } catch {
      setToast({ message: "Gagal memuat detail member", type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  };

  const kurangiPoin = async () => {
    if (!selectedMember) return;
    const p = parseInt(poinKurang);
    if (!p || p <= 0) { setToast({ message: "Jumlah poin harus angka positif", type: "error" }); return; }
    if (p > selectedMember.poin) { setToast({ message: `Poin tidak mencukupi (sisa ${selectedMember.poin})`, type: "error" }); return; }
    if (!alasan.trim()) { setToast({ message: "Alasan wajib diisi", type: "error" }); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/member/${selectedMember.id}/poin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poin: p, keterangan: alasan.trim() }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: `Poin berhasil dikurangi ${p} poin`, type: "success" });
      openDetail(selectedMember.id);
      loadData();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Gagal", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-sage-800">Customer</h1>
          <p className="text-xs text-sage-400 mt-0.5">Data member & OV Poin</p>
        </div>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau no. WA..."
          className="w-full border border-sage-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white border border-sage-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50 text-sage-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Nama</th>
                <th className="text-left px-4 py-3 font-medium">No. WA</th>
                <th className="text-right px-4 py-3 font-medium">OV Poin</th>
                <th className="text-center px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-sm text-sage-400">
                    {search ? "Customer tidak ditemukan" : "Belum ada customer"}
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-sage-50/50 transition-colors">
                  <td className="px-4 py-3 text-sage-800 font-medium">{m.nama || "-"}</td>
                  <td className="px-4 py-3 text-sage-600 font-mono text-xs">{m.noWa}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700">{m.poin} poin</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openDetail(m.id)}
                      className="text-xs font-medium text-sage-500 hover:text-sage-700 bg-sage-100 hover:bg-sage-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Atur Poin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-sage-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sage-800">
                    {selectedMember.nama || "Customer"}
                  </h2>
                  <button onClick={() => setSelectedMember(null)} className="text-sage-400 hover:text-sage-600 transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-sage-500 font-mono mt-1">{selectedMember.noWa}</p>
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-amber-700">Total OV Poin</span>
                  <span className="text-lg font-bold text-amber-700">{selectedMember.poin}</span>
                </div>
              </div>

              <div className="p-5 border-b border-sage-100">
                <h3 className="text-sm font-semibold text-sage-700 mb-3">Kurangi Poin</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-sage-500 mb-1">Jumlah Poin</label>
                    <input
                      type="text"
                      value={poinKurang}
                      onChange={(e) => setPoinKurang(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      maxLength={5}
                      className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-sage-500 mb-1">Alasan</label>
                    <input
                      type="text"
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      placeholder="Misal: Tukar 1 gelas Kopi"
                      className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400"
                    />
                  </div>
                  <button
                    onClick={kurangiPoin}
                    disabled={submitting || !poinKurang || parseInt(poinKurang) <= 0 || !alasan.trim()}
                    className="w-full bg-rose-500 text-white py-2 rounded-lg font-medium text-sm hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Menyimpan..." : "Kurangi Poin"}
                  </button>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-sm font-semibold text-sage-700 mb-3">Riwayat Poin</h3>
                {loadingDetail ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
                  </div>
                ) : selectedMember.rewardPoin.length === 0 ? (
                  <p className="text-sm text-sage-400 text-center py-4">Belum ada riwayat</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.rewardPoin.map((r) => (
                      <div key={r.id} className="flex items-center justify-between bg-sage-50 rounded-lg px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-sage-700 truncate">
                            {r.poin > 0
                              ? (r.transaksi ? r.transaksi.noTransaksi : r.keterangan || "-")
                              : (r.keterangan || (r.transaksi ? r.transaksi.noTransaksi : "-"))
                            }
                          </p>
                          <p className="text-[10px] text-sage-400">
                            {new Date(r.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ml-3 ${r.poin > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {r.poin > 0 ? "+" : ""}{r.poin}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
