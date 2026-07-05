"use client";

import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import { Toast } from "@/components/Toast";

type Kategori = { id: string; nama: string; _count?: { menu: number } };
type Menu = { id: string; nama: string; harga: number; stok: number; isTersedia: boolean; gambar: string | null; kategoriId: string; kategori: Kategori };

export default function AdminMenuPage() {
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", harga: "", kategoriId: "", stok: "0", isTersedia: true, gambar: "" });
  const [kategoriForm, setKategoriForm] = useState({ nama: "" });
  const [gambarFile, setGambarFile] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(() => {
    Promise.all([fetch("/api/menu").then((r) => r.json()), fetch("/api/kategori").then((r) => r.json())])
      .then(([menu, kategori]) => { setMenuList(menu); setKategoriList(kategori); });
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setForm({ nama: "", harga: "", kategoriId: "", stok: "0", isTersedia: true, gambar: "" }); setGambarFile(null); setGambarPreview(null); setEditingId(null); setShowForm(false); };

  const editMenu = (menu: Menu) => {
    setForm({ nama: menu.nama, harga: menu.harga.toString(), kategoriId: menu.kategoriId, stok: menu.stok.toString(), isTersedia: menu.isTersedia, gambar: menu.gambar || "" });
    setGambarPreview(menu.gambar); setGambarFile(null); setEditingId(menu.id); setShowForm(true);
  };

  const simpanMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { setToast({ message: "Nama menu wajib diisi", type: "error" }); return; }
    if (!form.harga || parseInt(form.harga) <= 0) { setToast({ message: "Harga harus angka positif", type: "error" }); return; }
    if (!form.kategoriId) { setToast({ message: "Pilih kategori", type: "error" }); return; }

    let gambarUrl = form.gambar;
    if (gambarFile) {
      setUploading(true);
      try {
        const uploadForm = new FormData();
        uploadForm.append("file", gambarFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        if (!uploadRes.ok) { const err = await uploadRes.json(); throw new Error(err.error || "Gagal upload"); }
        const uploadData = await uploadRes.json();
        gambarUrl = uploadData.url;
      } catch (err) {
        setToast({ message: err instanceof Error ? err.message : "Gagal upload gambar", type: "error" });
        setUploading(false); return;
      }
      setUploading(false);
    }

    const body = { nama: form.nama, harga: parseInt(form.harga), kategoriId: form.kategoriId, stok: parseInt(form.stok) || 0, isTersedia: form.isTersedia, gambar: gambarUrl || null };
    try {
      const res = editingId
        ? await fetch(`/api/menu/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setToast({ message: `Menu berhasil ${editingId ? "diupdate" : "ditambahkan"}`, type: "success" });
      resetForm(); loadData();
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal simpan", type: "error" }); }
  };

  const hapusMenu = async (id: string) => {
    if (!confirm("Yakin ingin menghapus menu ini?")) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      loadData(); setToast({ message: "Menu berhasil dihapus", type: "success" });
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal hapus", type: "error" }); }
  };

  const simpanKategori = async (e: React.FormEvent) => {
    e.preventDefault(); if (!kategoriForm.nama.trim()) return;
    try {
      const res = await fetch("/api/kategori", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama: kategoriForm.nama }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      setKategoriForm({ nama: "" }); loadData();
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal simpan kategori", type: "error" }); }
  };

  const hapusKategori = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;
    try {
      const res = await fetch(`/api/kategori/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      loadData();
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal hapus kategori", type: "error" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sage-800">Menu</h1>
          <p className="text-sm text-sage-500 mt-0.5">Kelola menu makanan dan minuman</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 bg-sage-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sage-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Menu
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={resetForm}>
          <form onSubmit={simpanMenu} className="bg-white rounded-xl p-6 shadow-xl border border-sage-200 w-full max-w-lg mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sage-800">{editingId ? "Edit Menu" : "Tambah Menu Baru"}</h3>
              <button type="button" onClick={resetForm} className="text-sage-400 hover:text-sage-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-sage-600 mb-1">Nama Menu</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all" placeholder="Nama menu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-600 mb-1">Kategori</label>
                <div className="relative">
                  <select value={form.kategoriId} onChange={(e) => setForm({ ...form, kategoriId: e.target.value })} className="w-full appearance-none border border-sage-200 rounded-lg px-3 py-2 pr-9 text-sm bg-white text-sage-800 cursor-pointer hover:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all">
                    <option value="" className="text-sage-400">-- Pilih --</option>
                    {kategoriList.map((k) => (<option key={k.id} value={k.id}>{k.nama}</option>))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-600 mb-1">Harga (Rp)</label>
                <input type="text" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value.replace(/\D/g, "") })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-600 mb-1">Stok</label>
                <input type="text" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value.replace(/\D/g, "") })} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all" placeholder="0" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sage-600 mb-1">Gambar</label>
              <div className="flex items-start gap-4">
                {gambarPreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-sage-200 shrink-0">
                    <img src={gambarPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGambarFile(file);
                        setGambarPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-sm text-sage-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage-100 file:text-sage-600 hover:file:bg-sage-200 file:transition-colors file:cursor-pointer cursor-pointer"
                  />
                  {gambarPreview && (
                    <button type="button" onClick={() => { setGambarFile(null); setGambarPreview(null); setForm((f) => ({ ...f, gambar: "" })); }} className="text-xs text-sage-400 hover:text-red-500 mt-1.5 transition-colors">
                      Hapus gambar
                    </button>
                  )}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${form.isTersedia ? "bg-sage-600 border-sage-600" : "border-sage-300"}`}>
                {form.isTersedia && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
              </div>
              <span className="text-sm text-sage-600">Tersedia</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-sage-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sage-700 transition-colors">{editingId ? "Update" : "Simpan"}</button>
              <button type="button" onClick={resetForm} className="flex-1 bg-sage-100 text-sage-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sage-200 transition-colors">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-sage-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sage-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase w-12">Gbr</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Menu</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Harga</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Stok</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {menuList.map((menu) => (
                <tr key={menu.id} className="hover:bg-sage-50 transition-colors">
                  <td className="px-4 py-3.5">
                    {menu.gambar ? (
                      <img src={menu.gambar} alt={menu.nama} className="w-10 h-10 rounded-lg object-cover border border-sage-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-sage-800">{menu.nama}</td>
                  <td className="px-4 py-3.5"><span className="text-xs bg-sage-100 text-sage-500 px-2 py-0.5 rounded">{menu.kategori.nama}</span></td>
                  <td className="px-4 py-3.5 text-right font-medium text-sage-800">{formatRupiah(menu.harga)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${menu.stok <= 5 ? "bg-red-50 text-red-500" : "bg-sage-100 text-sage-600"}`}>{menu.stok}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${menu.isTersedia ? "bg-sage-100 text-sage-600" : "bg-red-50 text-red-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${menu.isTersedia ? "bg-sage-500" : "bg-red-400"}`} />
                      {menu.isTersedia ? "Tersedia" : "Habis"}
                    </span>
                  </td>
                    <td className="px-4 py-3.5 text-center">
                    <button onClick={() => editMenu(menu)} className="text-sage-500 hover:text-sage-700 text-sm font-medium mr-2 transition-colors">Edit</button>
                    <button onClick={() => hapusMenu(menu.id)} className="text-sage-500 hover:text-red-500 text-sm font-medium transition-colors">Hapus</button>
                  </td>
                </tr>
              ))}
              {menuList.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sage-400 text-sm">Belum ada menu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-sage-200 rounded-xl p-5">
        <h3 className="font-semibold text-sm text-sage-800 mb-3">Kategori</h3>
        <form onSubmit={simpanKategori} className="flex gap-2 mb-3">
          <input type="text" value={kategoriForm.nama} onChange={(e) => setKategoriForm({ nama: e.target.value })} placeholder="Nama kategori baru" className="flex-1 border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all" />
          <button type="submit" className="bg-sage-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sage-700 transition-colors">Tambah</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {kategoriList.map((k) => (
            <div key={k.id} className="inline-flex items-center gap-1.5 bg-sage-50 rounded-lg px-3 py-1.5 text-sm text-sage-600">
              <span>{k.nama} <span className="text-sage-400">({k._count?.menu ?? 0})</span></span>
              <button onClick={() => hapusKategori(k.id)} className="text-sage-400 hover:text-red-500 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {kategoriList.length === 0 && <p className="text-sm text-sage-400">Belum ada kategori</p>}
        </div>
      </div>
    </div>
  );
}
