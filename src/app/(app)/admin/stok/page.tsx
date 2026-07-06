"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast } from "@/components/Toast";

type StokItem = { id: string; namaBahan: string; jumlah: number; satuan: string; createdAt: string; updatedAt: string };

export default function AdminStokPage() {
  const [stokList, setStokList] = useState<StokItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ namaBahan: "", jumlah: "", satuan: "" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(() => { fetch("/api/stok").then((r) => r.json()).then(setStokList); }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ namaBahan: "", jumlah: "", satuan: "" }); setEditingId(null); setShowForm(false); };

  const editStok = (item: StokItem) => { setForm({ namaBahan: item.namaBahan, jumlah: item.jumlah.toString(), satuan: item.satuan }); setEditingId(item.id); setShowForm(true); };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaBahan.trim()) { setToast({ message: "Nama bahan wajib diisi", type: "error" }); return; }
    if (!form.jumlah || parseInt(form.jumlah) <= 0) { setToast({ message: "Jumlah harus angka positif", type: "error" }); return; }
    if (!form.satuan.trim()) { setToast({ message: "Satuan wajib diisi", type: "error" }); return; }
    const body = { namaBahan: form.namaBahan, jumlah: parseInt(form.jumlah), satuan: form.satuan };
    try {
      const res = editingId
        ? await fetch(`/api/stok/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/stok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setToast({ message: `Bahan berhasil ${editingId ? "diupdate" : "ditambahkan"}`, type: "success" });
      resetForm(); loadData();
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal simpan", type: "error" }); }
  };

  const hapus = async (id: string) => {
    if (!confirm("Yakin ingin menghapus bahan ini?")) return;
    try {
      const res = await fetch(`/api/stok/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      loadData(); setToast({ message: "Bahan berhasil dihapus", type: "success" });
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal hapus", type: "error" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sage-800">Stok</h1>
          <p className="text-sm text-sage-500 mt-0.5">Kelola stok bahan baku</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Bahan
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={resetForm}>
          <form onSubmit={simpan} className="bg-white rounded-xl p-6 shadow-xl border border-sage-200 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sage-800">{editingId ? "Edit Bahan" : "Tambah Bahan Baru"}</h3>
              <button type="button" onClick={resetForm} className="text-sage-400 hover:text-sage-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-600 mb-1">Nama Bahan</label>
              <input type="text" value={form.namaBahan} onChange={(e) => setForm({ ...form, namaBahan: e.target.value })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all" placeholder="Misal: Mie Indomie" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sage-600 mb-1">Jumlah</label>
                <input type="text" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value.replace(/\D/g, "") })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all" placeholder="0" />
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
              <button type="submit" className="flex-1 bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors">{editingId ? "Update" : "Simpan"}</button>
              <button type="button" onClick={resetForm} className="flex-1 bg-red-50 text-red-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-sage-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Nama Bahan</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Jumlah</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Satuan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {stokList.map((item) => (
                <tr key={item.id} className="hover:bg-red-50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-sage-800">{item.namaBahan}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${item.jumlah <= 5 ? "bg-red-50 text-red-500" : "bg-red-50 text-red-600"}`}>{item.jumlah}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-sage-500">{item.satuan}</td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => editStok(item)} className="text-red-600 hover:text-red-700 text-sm font-medium mr-2 transition-colors">Edit</button>
                    <button onClick={() => hapus(item.id)} className="text-red-600 hover:text-red-500 text-sm font-medium transition-colors">Hapus</button>
                  </td>
                </tr>
              ))}
              {stokList.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-sage-400 text-sm">Belum ada bahan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
