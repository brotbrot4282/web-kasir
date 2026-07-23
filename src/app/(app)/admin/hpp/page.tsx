"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toast } from "@/components/Toast";

type StokItem = { id: string; namaBahan: string; jumlah: number; satuan: string; hargaBahan: number };
type ResepItem = { id: string; menuId: string; stokId: string; jumlah: number; stok: StokItem };
type Kategori = { id: string; nama: string };
type MenuItem = {
  id: string; nama: string; harga: number; stok: number; isTersedia: boolean;
  gambar: string | null; kategoriId: string; kategori: Kategori; resep: ResepItem[];
};

export default function AdminHPPPage() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [stokList, setStokList] = useState<StokItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingResepId, setEditingResepId] = useState<string | null>(null);
  const [editMenuId, setEditMenuId] = useState("");
  const [formMenuId, setFormMenuId] = useState("");
  const [formItems, setFormItems] = useState<{ stokId: string; jumlah: string }[]>([{ stokId: "", jumlah: "" }]);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null);

  const loadData = useCallback(async () => {
    const [menuRes, stokRes] = await Promise.all([
      fetch("/api/hpp").then((r) => r.json()),
      fetch("/api/stok").then((r) => r.json()),
    ]);
    setMenuList(menuRes);
    setStokList(stokRes);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => { setFormMenuId(""); setFormItems([{ stokId: "", jumlah: "" }]); setEditingResepId(null); setEditMenuId(""); setShowForm(false); };

  const editResep = (resep: ResepItem, menuId: string) => {
    setFormMenuId(menuId);
    setEditMenuId(menuId);
    setFormItems([{ stokId: resep.stokId, jumlah: resep.jumlah.toString() }]);
    setEditingResepId(resep.id);
    setShowForm(true);
  };

  const updateFormItem = (index: number, field: "stokId" | "jumlah", value: string) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const addFormItem = () => setFormItems([...formItems, { stokId: "", jumlah: "" }]);
  const removeFormItem = (index: number) => setFormItems(formItems.filter((_, i) => i !== index));

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeMenuId = editingResepId ? editMenuId : formMenuId;

    if (!activeMenuId) { setToast({ message: "Pilih menu", type: "error" }); return; }

    if (editingResepId) {
      const item = formItems[0];
      if (!item.stokId) { setToast({ message: "Pilih bahan", type: "error" }); return; }
      const jumlahVal = parseFloat(item.jumlah.replace(",", "."));
      if (!item.jumlah || isNaN(jumlahVal) || jumlahVal <= 0) { setToast({ message: "Jumlah harus positif", type: "error" }); return; }
      try {
        const res = await fetch(`/api/hpp/${editingResepId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jumlah: jumlahVal }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        setToast({ message: "Resep berhasil diupdate", type: "success" });
        resetForm(); loadData();
      } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal simpan", type: "error" }); }
      return;
    }

    const validItems = formItems.filter((item) => item.stokId && item.jumlah && parseFloat(item.jumlah.replace(",", ".")) > 0);
    if (validItems.length === 0) { setToast({ message: "Minimal isi 1 bahan dengan jumlah yang valid", type: "error" }); return; }

    let successCount = 0;
    let errorMsg = "";
    for (const item of validItems) {
      const jumlahVal = parseFloat(item.jumlah.replace(",", "."));
      try {
        const res = await fetch("/api/hpp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menuId: activeMenuId, stokId: item.stokId, jumlah: jumlahVal }),
        });
        if (res.ok) { successCount++; }
        else { const err = await res.json(); errorMsg = err.error; }
      } catch { errorMsg = "Gagal menyimpan"; }
    }

    if (successCount > 0) {
      setToast({ message: `${successCount} bahan berhasil ditambahkan`, type: "success" });
      resetForm(); loadData();
    } else {
      setToast({ message: errorMsg || "Gagal menyimpan resep", type: "error" });
    }
  };

  const hapus = async (id: string) => {
    try {
      const res = await fetch(`/api/hpp/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      loadData(); setToast({ message: "Bahan berhasil dihapus", type: "success" });
    } catch (err) { setToast({ message: err instanceof Error ? err.message : "Gagal hapus", type: "error" }); }
  };

  const hitungHPP = (resep: ResepItem[]) => resep.reduce((t, r) => t + r.jumlah * r.stok.hargaBahan, 0);

  const kategoris = [...new Set(menuList.map((m) => m.kategori.nama))];

  const filtered = menuList
    .filter((m) => !search || m.nama.toLowerCase().includes(search.toLowerCase()))
    .filter((m) => !filterKategori || m.kategori.nama === filterKategori)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const menusDenganResep = filtered.filter((m) => m.resep.length > 0);
  const menusTanpaResep = filtered.filter((m) => m.resep.length === 0);

  const totalMenu = filtered.length;
  const menuDenganResep = menusDenganResep.length;
  const rataRataMargin = menusDenganResep.length > 0
    ? menusDenganResep.reduce((t, m) => {
        const hpp = hitungHPP(m.resep);
        return t + ((m.harga - hpp) / m.harga) * 100;
      }, 0) / menusDenganResep.length
    : 0;
  const menuLabiTertinggi = menusDenganResep.length > 0
    ? menusDenganResep.reduce((best, m) => {
        const hpp = hitungHPP(m.resep);
        const labi = m.harga - hpp;
        return labi > (best.harga - hitungHPP(best.resep)) ? m : best;
      })
    : null;
  const menuLabiTertinggiHPP = menuLabiTertinggi ? hitungHPP(menuLabiTertinggi.resep) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sage-800">ANALISA HARGA</h1>
          <p className="text-sm text-sage-500 mt-0.5">HPP & profitabilitas tiap menu</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="shrink-0 inline-flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Resep
        </motion.button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-sage-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-sage-400 uppercase tracking-wider">Total Menu</p>
          <p className="text-2xl font-bold text-sage-800 mt-1">{totalMenu}</p>
          <p className="text-xs text-sage-400 mt-0.5">{menuDenganResep} dengan resep</p>
        </div>
        <div className="bg-white border border-sage-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-sage-400 uppercase tracking-wider">Rata-rata Margin</p>
          <p className={`text-2xl font-bold mt-1 ${rataRataMargin >= 50 ? "text-emerald-600" : rataRataMargin >= 30 ? "text-amber-600" : "text-rose-600"}`}>
            {rataRataMargin.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white border border-sage-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-sage-400 uppercase tracking-wider">Laba Tertinggi</p>
          <p className="text-lg font-bold text-emerald-600 mt-1 truncate">{menuLabiTertinggi?.nama || "-"}</p>
          {menuLabiTertinggi && (
            <p className="text-xs text-sage-400 mt-0.5">
              Rp {(menuLabiTertinggi.harga - menuLabiTertinggiHPP).toLocaleString("id-ID")} / {((menuLabiTertinggi.harga - menuLabiTertinggiHPP) / menuLabiTertinggi.harga * 100).toFixed(0)}%
            </p>
          )}
        </div>
        <div className="bg-white border border-sage-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-sage-400 uppercase tracking-wider">Tanpa Resep</p>
          <p className={`text-2xl font-bold mt-1 ${menusTanpaResep.length > 0 ? "text-rose-600" : "text-sage-800"}`}>
            {menusTanpaResep.length}
          </p>
          <p className="text-xs text-sage-400 mt-0.5">belum diinput</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu..."
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
        <div className="relative">
          <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="appearance-none border border-sage-200 rounded-xl px-4 py-2.5 pr-9 text-sm bg-white text-sage-800 cursor-pointer hover:border-sage-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all shadow-sm">
            <option value="">Semua Kategori</option>
            {kategoris.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
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
              className="bg-white rounded-xl p-6 shadow-xl border border-sage-200 w-full max-w-md mx-4 space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sage-800">{editingResepId ? "Edit Resep" : "Tambah ke Resep"}</h3>
                <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={resetForm} className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors">
                  <svg className="w-4 h-4 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              {!editingResepId && (
                <div>
                  <label className="block text-sm font-medium text-sage-600 mb-1">Menu</label>
                  <div className="relative">
                    <select value={formMenuId} onChange={(e) => setFormMenuId(e.target.value)} className="w-full appearance-none border border-sage-200 rounded-lg px-3 py-2 pr-9 text-sm bg-white text-sage-800 cursor-pointer hover:border-sage-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all">
                      <option value="">-- Pilih Menu --</option>
                      {menuList.map((m) => <option key={m.id} value={m.id}>{m.nama} (Rp {m.harga.toLocaleString("id-ID")})</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              )}

              {!editingResepId && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-sage-600">Bahan</label>
                  {formItems.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-sage-400 font-medium w-5 shrink-0">{idx + 1}.</span>
                        <div className="relative flex-1">
                          <select value={item.stokId} onChange={(e) => updateFormItem(idx, "stokId", e.target.value)} className="w-full appearance-none border border-sage-200 rounded-lg px-3 py-2 pr-9 text-sm bg-white text-sage-800 cursor-pointer hover:border-sage-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all">
                            <option value="">-- Pilih Bahan --</option>
                            {stokList.map((s) => (
                              <option key={s.id} value={s.id}>{s.namaBahan} {s.hargaBahan > 0 ? `(Rp ${s.hargaBahan.toLocaleString("id-ID")}/${s.satuan})` : "(harga belum diisi)"}</option>
                            ))}
                          </select>
                          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => removeFormItem(idx)} className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors shrink-0" title="Hapus bahan ini">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pl-7">
                        <input type="text" value={item.jumlah} onChange={(e) => updateFormItem(idx, "jumlah", e.target.value.replace(/[^0-9.,]/g, ""))} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all" placeholder="Jumlah per porsi" />
                        {item.stokId && <span className="text-xs text-sage-400 shrink-0">{stokList.find((s) => s.id === item.stokId)?.satuan}</span>}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addFormItem} className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-800 transition-colors pt-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Tambah Bahan
                  </button>
                </div>
              )}

              {editingResepId && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-sage-600 mb-1">Bahan</label>
                    <div className="relative">
                      <select value={formItems[0]?.stokId || ""} onChange={(e) => updateFormItem(0, "stokId", e.target.value)} disabled className="w-full appearance-none border border-sage-200 rounded-lg px-3 py-2 pr-9 text-sm bg-sage-50 text-sage-600 cursor-not-allowed opacity-70">
                        <option value="">{stokList.find((s) => s.id === formItems[0]?.stokId)?.namaBahan || "-- Bahan --"}</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sage-600 mb-1">Jumlah per Porsi</label>
                    <input type="text" value={formItems[0]?.jumlah || ""} onChange={(e) => updateFormItem(0, "jumlah", e.target.value.replace(/[^0-9.,]/g, ""))} className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all" placeholder="0" />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <motion.button whileTap={{ scale: 0.98 }} type="submit" className="flex-1 bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors">
                  {editingResepId ? "Update" : "Simpan"}
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
                <h3 className="font-semibold text-sage-800">Hapus dari Resep</h3>
                <p className="text-sm text-sage-500 mt-1">
                  Yakin ingin menghapus <strong className="text-sage-700">{confirmDelete.nama}</strong> dari resep?
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await hapus(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors">Ya, Hapus</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-sage-100 text-sage-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sage-200 transition-colors">Batal</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-sage-200 rounded-xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-sage-500">{search || filterKategori ? "Menu tidak ditemukan" : "Belum ada menu"}</p>
          </div>
        )}

        {filtered.map((menu) => {
          const hpp = hitungHPP(menu.resep);
          const laba = menu.harga - hpp;
          const margin = menu.harga > 0 ? (laba / menu.harga) * 100 : 0;
          const isExpanded = expandedMenu === menu.id;

          return (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-sage-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-sage-50/50 transition-colors"
                onClick={() => setExpandedMenu(isExpanded ? null : menu.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sage-800 truncate">{menu.nama}</span>
                    <span className="text-xs text-sage-400 bg-sage-100 px-2 py-0.5 rounded-full">{menu.kategori.nama}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-sage-400">
                    <span>Harga: Rp {menu.harga.toLocaleString("id-ID")}</span>
                    <span>Resep: {menu.resep.length} bahan</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {menu.resep.length > 0 ? (
                    <>
                      <p className="text-sm font-bold text-sage-800">Rp {laba.toLocaleString("id-ID")}</p>
                      <p className={`text-xs font-semibold ${margin >= 50 ? "text-emerald-600" : margin >= 30 ? "text-amber-600" : "text-rose-600"}`}>
                        Margin {margin.toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-sage-400 italic">Belum ada resep</span>
                  )}
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <svg className="w-5 h-5 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </motion.div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-t border-sage-100 px-4 py-3">
                      {menu.resep.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-sage-400 uppercase">
                              <th className="text-left py-2">Bahan</th>
          <th className="text-right py-2">Jumlah</th>
                              <th className="text-right py-2">Harga/Satuan</th>
                              <th className="text-right py-2">Subtotal</th>
                              <th className="text-center py-2 w-20">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sage-50">
                            {menu.resep.map((r) => (
                              <tr key={r.id} className="hover:bg-sage-50/50">
                                <td className="py-2 font-medium text-sage-700">{r.stok.namaBahan}</td>
                                <td className="py-2 text-right text-sage-600">{r.jumlah} {r.stok.satuan}</td>
                                <td className="py-2 text-right text-sage-600">Rp {r.stok.hargaBahan.toLocaleString("id-ID")}</td>
                                <td className="py-2 text-right font-medium text-sage-800">Rp {(r.jumlah * r.stok.hargaBahan).toLocaleString("id-ID")}</td>
                                <td className="py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); editResep(r, menu.id); }} className="w-6 h-6 rounded bg-sage-100 flex items-center justify-center text-sage-500 hover:bg-sage-200 transition-colors" title="Edit">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                      </svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, nama: r.stok.namaBahan }); }} className="w-6 h-6 rounded bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors" title="Hapus">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-sage-200">
                              <td colSpan={3} className="py-2 text-right font-bold text-sage-700">HPP</td>
                              <td className="py-2 text-right font-bold text-sage-800">Rp {hpp.toLocaleString("id-ID")}</td>
                              <td></td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="py-1 text-right text-sm font-medium text-sage-600">Laba Kotor</td>
                              <td className="py-1 text-right font-bold text-emerald-600">Rp {laba.toLocaleString("id-ID")}</td>
                              <td></td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="py-1 text-right text-sm font-medium text-sage-600">Margin</td>
                              <td className={`py-1 text-right font-bold ${margin >= 50 ? "text-emerald-600" : margin >= 30 ? "text-amber-600" : "text-rose-600"}`}>
                                {margin.toFixed(1)}%
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      ) : (
                        <p className="text-sm text-sage-400 text-center py-4 italic">Belum ada bahan di resep. Klik &quot;+ Tambah Resep&quot; untuk menambahkan.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
