"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toast } from "@/components/Toast";

type StokItem = { id: string; namaBahan: string; jumlah: number; satuan: string; createdAt: string; updatedAt: string };

export default function AdminStokPage() {
  const [stokList, setStokList] = useState<StokItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ namaBahan: "", jumlah: "", satuan: "" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StokItem | null>(null);

  const loadData = useCallback(() => { fetch("/api/stok").then((r) => r.json()).then(setStokList); }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ namaBahan: "", jumlah: "", satuan: "" }); setEditingId(null); setShowForm(false); };

  const editStok = (item: StokItem) => { setForm({ namaBahan: item.namaBahan, jumlah: item.jumlah.toString(), satuan: item.satuan }); setEditingId(item.id); setShowForm(true); };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaBahan.trim()) { setToast({ message: "Nama bahan wajib diisi", type: "error" }); return; }
    const jumlahVal = parseFloat(form.jumlah.replace(",", "."));
    if (!form.jumlah || isNaN(jumlahVal) || jumlahVal <= 0) { setToast({ message: "Jumlah harus angka positif", type: "error" }); return; }
    if (!form.satuan.trim()) { setToast({ message: "Satuan wajib diisi", type: "error" }); return; }
    const body = { namaBahan: form.namaBahan, jumlah: jumlahVal, satuan: form.satuan };
    try {
      const res = editingId
        ? await fetch(`/api/stok/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/stok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setToast({ message: `Bahan berhasil ${editingId ? "diupdate" : "ditambahkan"}`, type: "success" });
      resetForm(); loadData();
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal simpan", type: "error" }); }
  };

  const stokFilter = stokList
    .filter((s) => !search || s.namaBahan.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aEmpty = a.jumlah <= 0 ? 0 : 1;
      const bEmpty = b.jumlah <= 0 ? 0 : 1;
      if (aEmpty !== bEmpty) return aEmpty - bEmpty;
      if (a.jumlah !== b.jumlah) return a.jumlah - b.jumlah;
      return a.namaBahan.localeCompare(b.namaBahan);
    });

  const getStockLevel = (jumlah: number) => {
    if (jumlah <= 0) return { label: "Habis", color: "bg-rose-100 text-rose-700 border-rose-200" };
    if (jumlah <= 5) return { label: "Kritis", color: "bg-rose-50 text-rose-600 border-rose-200" };
    if (jumlah <= 10) return { label: "Menipis", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Aman", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const hapus = async (id: string) => {
    try {
      const res = await fetch(`/api/stok/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      loadData(); setToast({ message: "Bahan berhasil dihapus", type: "success" });
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal hapus", type: "error" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sage-800">STOCK MAINTENANCE</h1>
          <p className="text-sm text-sage-500 mt-0.5">Kelola stok bahan baku</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="shrink-0 inline-flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Bahan
        </motion.button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari bahan..."
          className="w-full border border-sage-200 rounded-xl pl-9 pr-9 py-2.5 text-sm bg-white text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 hover:bg-sage-100 rounded-lg p-1 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
            onClick={resetForm}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onSubmit={simpan}
              className="bg-white rounded-xl p-6 shadow-xl border border-sage-200 w-full max-w-md mx-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sage-800">{editingId ? "Edit Bahan" : "Tambah Bahan Baru"}</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button" onClick={resetForm}
                  className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors"
                >
                  <svg className="w-4 h-4 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-600 mb-1">Nama Bahan</label>
                <input type="text" value={form.namaBahan} onChange={(e) => setForm({ ...form, namaBahan: e.target.value })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all" placeholder="Misal: Mie Indomie" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sage-600 mb-1">Jumlah</label>
                  <input type="text" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value.replace(/[^0-9.,]/g, "") })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sage-600 mb-1">Satuan</label>
                  <div className="relative">
                    <select value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} className="w-full appearance-none border border-sage-200 rounded-lg px-3 py-2 pr-9 text-sm bg-white text-sage-800 cursor-pointer hover:border-sage-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all">
                      <option value="" className="text-sage-400">-- Pilih --</option>
                      <option value="pcs">pcs</option><option value="kg">kg</option><option value="gram">gram</option>
                      <option value="liter">liter</option><option value="ml">ml</option>
                      <option value="bungkus">bungkus</option><option value="pack">pack</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors"
                >
                  {editingId ? "Update" : "Simpan"}
                </motion.button>
                <button type="button" onClick={resetForm} className="flex-1 bg-sage-100 text-sage-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sage-200 transition-colors">Batal</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 shadow-xl border border-sage-200 w-full max-w-sm mx-4 space-y-4"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 mx-auto">
                <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sage-800">Hapus Bahan</h3>
                <p className="text-sm text-sage-500 mt-1">
                  Yakin ingin menghapus <strong className="text-sage-700">{confirmDelete.namaBahan}</strong>?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await hapus(confirmDelete.id);
                    setConfirmDelete(null);
                  }}
                  className="flex-1 bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-sage-100 text-sage-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sage-200 transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-sage-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100 bg-sage-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-500 uppercase tracking-wider">Nama Bahan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sage-500 uppercase tracking-wider">Stok</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sage-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-sage-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              <AnimatePresence>
              {stokFilter.map((item, idx) => {
                const level = getStockLevel(item.jumlah);
                const maxBar = Math.min(item.jumlah, 50);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="hover:bg-red-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                          </svg>
                        </div>
                        <span className="font-medium text-sage-800">{item.namaBahan}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-sage-800">{item.jumlah}</span>
                      <span className="text-xs text-sage-400 ml-0.5">/{item.satuan}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${level.color}`}>
                          {level.label}
                        </span>
                        <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-sage-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.jumlah / 50) * 100, 100)}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.03 }}
                            className={`h-full rounded-full ${
                              item.jumlah <= 0 ? "bg-rose-400" :
                              item.jumlah <= 5 ? "bg-rose-400" :
                              item.jumlah <= 10 ? "bg-amber-400" :
                              "bg-emerald-400"
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            fetch(`/api/stok/${item.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ namaBahan: item.namaBahan, jumlah: item.jumlah + 1, satuan: item.satuan }),
                            }).then((r) => { if (r.ok) loadData(); });
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-bold"
                          title="Tambah stok +1"
                        >
                          +
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => editStok(item)}
                          className="w-7 h-7 rounded-lg bg-sage-50 border border-sage-200 flex items-center justify-center text-sage-500 hover:bg-sage-100 hover:text-sage-700 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setConfirmDelete(item)}
                          className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors"
                          title="Hapus"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              </AnimatePresence>
              {stokFilter.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-sage-500">{search ? "Bahan tidak ditemukan" : "Belum ada bahan baku"}</p>
                      <p className="text-xs text-sage-400 mt-1">{search ? "Coba gunakan kata kunci lain" : "Klik 'Tambah Bahan' untuk memulai"}</p>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {stokList.length > 0 && (
          <div className="border-t border-sage-100 px-4 py-2.5 text-xs text-sage-400 bg-sage-50/50">
            {stokFilter.length} dari {stokList.length} bahan
          </div>
        )}
      </div>
    </div>
  );
}
