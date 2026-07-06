"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatRupiah } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

type Variant = { nama: string; tambahHarga: number };
type Kategori = { id: string; nama: string };
type Menu = {
  id: string; nama: string; harga: number; stok: number; gambar: string | null;
  isTersedia: boolean; kategoriId: string; kategori: Kategori; variants: Variant[] | null;
};
type KeranjangItem = { key: string; menuId: string; nama: string; harga: number; jumlah: number; subtotal: number; variant: string | null };

export default function KasirPage() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [kategoriAktif, setKategoriAktif] = useState("");
  const [search, setSearch] = useState("");
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [totalBayar, setTotalBayar] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transaksiSukses, setTransaksiSukses] = useState<{
    noTransaksi: string; totalHarga: number; totalBayar: number;
    kembalian: number; items: KeranjangItem[];
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [showClosing, setShowClosing] = useState(false);
  const [closingEsBatu, setClosingEsBatu] = useState("");
  const [closingCup, setClosingCup] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const [closingMsg, setClosingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/kategori").then((r) => r.json()),
      fetch("/api/menu").then((r) => r.json()),
    ]).then(([kategori, menu]) => {
      setKategoriList(kategori);
      setMenuList(menu);
      if (kategori.length > 0) setKategoriAktif(kategori[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const menuFilter = menuList.filter((m) => {
    if (!m.isTersedia) return false;
    if (kategoriAktif && m.kategoriId !== kategoriAktif) return false;
    if (search && !m.nama.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalKeranjang = keranjang.reduce((sum, item) => sum + item.subtotal, 0);

  const tambahKeKeranjang = useCallback((menu: Menu, variantName: string | null) => {
    const key = `${menu.id}-${variantName || ""}`;
    const variants = menu.variants;
    const v = variantName && variants ? variants.find((x) => x.nama === variantName) : null;
    const harga = menu.harga + (v?.tambahHarga ?? 0);
    const nama = variantName ? `${menu.nama} - ${variantName}` : menu.nama;
    setKeranjang((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        if (existing.jumlah >= menu.stok && menu.stok > 0) return prev;
        return prev.map((item) =>
          item.key === key
            ? { ...item, jumlah: item.jumlah + 1, subtotal: (item.jumlah + 1) * item.harga }
            : item
        );
      }
      return [...prev, { key, menuId: menu.id, nama, harga, jumlah: 1, subtotal: harga, variant: variantName }];
    });
  }, []);

  const ubahJumlah = (key: string, delta: number) => {
    setKeranjang((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, jumlah: Math.max(0, item.jumlah + delta), subtotal: Math.max(0, item.jumlah + delta) * item.harga }
          : item
      ).filter((item) => item.jumlah > 0)
    );
  };

  const bayar = async () => {
    if (submitting) return;
    const bayar = parseInt(totalBayar.replace(/\D/g, "")) || 0;
    if (keranjang.length === 0) { setMessage({ type: "error", text: "Keranjang masih kosong" }); return; }
    if (bayar < totalKeranjang) { setMessage({ type: "error", text: `Kurang Rp ${(totalKeranjang - bayar).toLocaleString()}` }); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: keranjang.map((i) => ({ menuId: i.menuId, jumlah: i.jumlah, variant: i.variant })), totalBayar: bayar }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      const data = await res.json();
      setTransaksiSukses({ noTransaksi: data.noTransaksi, totalHarga: data.totalHarga, totalBayar: data.totalBayar, kembalian: data.kembalian, items: [...keranjang] });
      setKeranjang([]); setTotalBayar(""); setMessage(null);
      fetch("/api/menu").then((r) => r.json()).then(setMenuList);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal bayar" });
    } finally {
      setSubmitting(false);
    }
  };

  const cetakStruk = useCallback((jenis: "customer" | "catatan") => {
    if (!transaksiSukses || !iframeRef.current) return;
    const t = transaksiSukses;
    const tanggal = new Date().toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const jam = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit", minute: "2-digit"
    });

    const itemsHtml = t.items.map((item) => {
      const nm = item.nama.length > 28 ? item.nama.slice(0, 26) + ".." : item.nama;
      const harga = item.subtotal / item.jumlah;
      return `
        <div style="display:flex;justify-content:space-between;">
          <span>${nm}</span>
          <span>${formatRupiah(item.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#555;padding-left:4px;">
          <span>${formatRupiah(harga)} x ${item.jumlah}</span>
          <span></span>
        </div>`;
    }).join("");

    const labelCatatan = jenis === "catatan"
      ? `<div style="text-align:center;font-weight:bold;font-size:11px;margin:4px 0;letter-spacing:4px;">=== STRUK CATATAN ===</div>`
      : "";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  @page { size: 58mm auto; margin: 0; }
  body {
    font-family: 'Courier New', 'Consolas', 'Lucida Console', monospace;
    font-size: 11px; line-height: 1.3; padding: 8px 12px; color: #000; margin: 0;
  }
</style>
</head>
<body>
  <div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:2px;">WARKOP SOEKARDJO</div>
  <div style="text-align:center;font-size:9px;color:#666;">${tanggal} ${jam}</div>
  <div style="text-align:center;font-size:9px;color:#666;">${t.noTransaksi}</div>
  ${labelCatatan}
  <div style="border-top:1px dashed #000;margin:6px 0;"></div>
  ${itemsHtml}
  <div style="border-top:1px dashed #000;margin:6px 0;"></div>
  <div style="display:flex;justify-content:space-between;font-weight:bold;">
    <span>TOTAL</span><span>${formatRupiah(t.totalHarga)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;">
    <span>Bayar</span><span>${formatRupiah(t.totalBayar)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;">
    <span>Kembali</span><span>${formatRupiah(t.kembalian)}</span>
  </div>
  <div style="border-top:1px dashed #000;margin:6px 0;"></div>
  <div style="text-align:center;font-weight:bold;margin-top:6px;">Terima kasih</div>
  <div style="text-align:center;font-size:9px;color:#666;">Barang yang sudah dibeli</div>
  <div style="text-align:center;font-size:9px;color:#666;">tidak dapat dikembalikan</div>
</body></html>`;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      iframe.style.display = "block";
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => { iframe.style.display = "none"; }, 500);
      }, 300);
    }
  }, [transaksiSukses]);

  if (transaksiSukses) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-white border border-sage-200 rounded-xl p-6 text-center" id="struk">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg font-bold text-sage-600">W</span>
          </div>
          <h2 className="font-bold text-lg text-sage-800">WARKOP SOEKARDJO</h2>
          <p className="text-xs text-sage-400 mt-0.5">Struk Pembayaran</p>
          <p className="text-xs font-mono text-sage-300 mt-1">{transaksiSukses.noTransaksi}</p>

          <div className="border-t border-dashed border-sage-200 mt-4 pt-4 text-left space-y-2 mb-4">
            {transaksiSukses.items.map((item) => (
              <div key={item.menuId} className="flex justify-between text-sm">
                <span className="text-sage-600">{item.nama} <span className="text-sage-400">x{item.jumlah}</span></span>
                <span className="font-medium text-sage-800">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-sage-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between font-bold text-sage-800">
              <span>Total</span><span>{formatRupiah(transaksiSukses.totalHarga)}</span>
            </div>
            <div className="flex justify-between text-sage-500">
              <span>Bayar</span><span>{formatRupiah(transaksiSukses.totalBayar)}</span>
            </div>
            <div className="flex justify-between text-sage-600 font-medium">
              <span>Kembali</span><span>{formatRupiah(transaksiSukses.kembalian)}</span>
            </div>
          </div>

          <p className="text-xs text-sage-300 mt-5">Terima kasih atas kunjungan Anda</p>
        </div>

        <div className="flex gap-3 mt-4 no-print">
          <button onClick={() => cetakStruk("customer")} className="flex-1 bg-sage-600 text-white py-2.5 rounded-xl font-medium hover:bg-sage-700 transition-colors text-sm">
            Cetak Customer
          </button>
          <button onClick={() => cetakStruk("catatan")} className="flex-1 bg-white text-sage-600 border border-sage-200 py-2.5 rounded-xl font-medium hover:bg-sage-50 transition-colors text-sm">
            Cetak Catatan
          </button>
          <button onClick={() => setTransaksiSukses(null)} className="flex-1 bg-sage-100 text-sage-600 py-2.5 rounded-xl font-medium hover:bg-sage-200 transition-colors text-sm">
            Transaksi Baru
          </button>
        </div>
        <iframe ref={iframeRef} style={{ display: "none", width: 0, height: 0, border: 0, position: "absolute" }} title="print-frame" />
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-sage-800">Kasir</h1>
            <p className="text-xs text-sage-400 mt-0.5">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClosing(true)}
              className="flex items-center gap-1.5 bg-sage-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-sage-700 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tutup Shift
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-print">
          <button onClick={() => setKategoriAktif("")} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            kategoriAktif === "" ? "bg-sage-600 text-white shadow-sm" : "bg-white text-sage-500 border border-sage-200 hover:border-sage-300 hover:text-sage-700"
          }`}>Semua</button>
          {kategoriList.map((k) => (
            <button key={k.id} onClick={() => setKategoriAktif(k.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              kategoriAktif === k.id ? "bg-sage-600 text-white shadow-sm" : "bg-white text-sage-500 border border-sage-200 hover:border-sage-300 hover:text-sage-700"
            }`}>{k.nama}</button>
          ))}
        </div>

        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu..."
            className="w-full border border-sage-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-sage-400">Memuat menu...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {menuFilter.map((menu) => (
              <button
                key={menu.id}
                onClick={() => {
                  if (menu.variants && menu.variants.length > 0) {
                    setSelectedMenu(menu);
                  } else {
                    tambahKeKeranjang(menu, null);
                  }
                }}
                disabled={menu.stok === 0}
                className={`bg-white border border-sage-200 rounded-xl overflow-hidden text-center transition-all ${
                  menu.stok === 0 ? "opacity-40 cursor-not-allowed" : "hover:border-sage-300 hover:shadow-sm active:bg-sage-50 cursor-pointer"
                }`}
              >
                {menu.gambar ? (
                  <div className="w-full h-28 bg-sage-50">
                    <img src={menu.gambar} alt={menu.nama} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-full h-28 bg-sage-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-sm text-sage-800 truncate">{menu.nama}</p>
                  <p className="text-sage-600 font-semibold text-sm mt-0.5">{formatRupiah(menu.harga)}</p>
                  {menu.stok <= 5 && menu.stok > 0 && <p className="text-[11px] text-sage-400 mt-0.5">Sisa {menu.stok}</p>}
                  {menu.stok === 0 && <p className="text-[11px] text-sage-400 mt-0.5">Habis</p>}
                </div>
              </button>
            ))}
            {menuFilter.length === 0 && (
              <div className="col-span-full text-center py-16 text-sage-400">
                <p className="text-sm">Tidak ada menu tersedia</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 no-print">
        <div className="bg-white border border-sage-200 rounded-xl p-4 sticky top-16">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-sage-800">Pesanan</h2>
            {keranjang.length > 0 && (
              <span className="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded font-medium">
                {keranjang.reduce((s, i) => s + i.jumlah, 0)} item
              </span>
            )}
          </div>

          <div className={`${keranjang.length > 0 ? "space-y-1.5 max-h-72 overflow-y-auto mb-4" : ""}`}>
            {keranjang.length === 0 ? (
              <div className="text-center py-10">
                <svg className="w-8 h-8 text-sage-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p className="text-sm text-sage-400">Belum ada item</p>
              </div>
            ) : (
              keranjang.map((item) => (
                <div                 key={item.key} className="flex items-center gap-2 bg-sage-50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sage-700 truncate">{item.nama}</p>
                    <p className="text-xs text-sage-400">{formatRupiah(item.harga)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => ubahJumlah(item.key, -1)} className="w-6 h-6 rounded bg-white border border-sage-200 flex items-center justify-center text-sage-500 hover:bg-sage-100 text-xs">-</button>
                    <span className="w-5 text-center text-sm font-medium text-sage-700">{item.jumlah}</span>
                    <button onClick={() => ubahJumlah(item.key, 1)} className="w-6 h-6 rounded bg-white border border-sage-200 flex items-center justify-center text-sage-500 hover:bg-sage-100 text-xs">+</button>
                  </div>
                  <p className="text-sm font-medium text-sage-800 w-14 text-right">{formatRupiah(item.subtotal)}</p>
                </div>
              ))
            )}
          </div>

          {keranjang.length > 0 && (
            <div className="border-t border-sage-200 pt-3 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-sage-500">Total</span>
                <span className="text-lg font-bold text-sage-800">{formatRupiah(totalKeranjang)}</span>
              </div>

              <div>
                <label className="block text-xs text-sage-500 mb-1">Jumlah Bayar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-sage-400">Rp</span>
                  <input
                    type="text"
                    value={totalBayar}
                    onChange={(e) => setTotalBayar(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="w-full border border-sage-200 rounded-lg pl-9 pr-3 py-2 text-right text-base font-bold text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all"
                  />
                </div>
              </div>

              {totalBayar && parseInt(totalBayar) >= totalKeranjang && (
                <div className="flex justify-between text-sm text-sage-600 font-medium bg-sage-50 rounded-lg px-3 py-1.5">
                  <span>Kembali</span>
                  <span>{formatRupiah(parseInt(totalBayar) - totalKeranjang)}</span>
                </div>
              )}

              {message && (
                <div className={`text-sm p-2.5 rounded-lg ${message.type === "error" ? "bg-red-50 text-red-500" : "bg-sage-100 text-sage-700"}`}>
                  {message.text}
                </div>
              )}

              <button
                onClick={bayar}
                disabled={keranjang.length === 0 || submitting}
                className="w-full bg-sage-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-sage-700 disabled:bg-sage-100 disabled:text-sage-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : "Bayar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Variant Modal */}
      <AnimatePresence>
        {selectedMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedMenu(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-xs shadow-xl"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="font-semibold text-sage-800">Pilih Varian</h2>
                  <p className="text-xs text-sage-400 mt-0.5">{selectedMenu.nama}</p>
                </div>
                <button onClick={() => setSelectedMenu(null)} className="w-7 h-7 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors">
                  <X className="w-4 h-4 text-sage-500" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-2">
                {selectedMenu.variants?.map((v) => (
                  <button
                    key={v.nama}
                    onClick={() => {
                      tambahKeKeranjang(selectedMenu, v.nama);
                      setSelectedMenu(null);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg border border-sage-200 hover:border-sage-400 hover:bg-sage-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-sage-800">{v.nama}</span>
                    {v.tambahHarga > 0 && (
                      <span className="text-xs text-sage-400 ml-2">(+{formatRupiah(v.tambahHarga)})</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Closing Modal */}
      <AnimatePresence>
        {showClosing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowClosing(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="font-semibold text-sage-800">Tutup Shift</h2>
                  <p className="text-xs text-sage-400 mt-0.5">Catat pemakaian hari ini</p>
                </div>
                <button onClick={() => setShowClosing(false)} className="w-7 h-7 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors">
                  <X className="w-4 h-4 text-sage-500" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-sage-600 mb-1">Es Batu (plastik)</label>
                  <input
                    type="number"
                    min="0"
                    value={closingEsBatu}
                    onChange={(e) => setClosingEsBatu(e.target.value)}
                    placeholder="0"
                    className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sage-600 mb-1">Cup Terjual</label>
                  <input
                    type="number"
                    min="0"
                    value={closingCup}
                    onChange={(e) => setClosingCup(e.target.value)}
                    placeholder="0"
                    className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all"
                  />
                </div>

                {closingMsg && (
                  <div className={`text-sm p-2.5 rounded-lg ${closingMsg.type === "error" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                    {closingMsg.text}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setShowClosing(false); setClosingMsg(null); }}
                    className="flex-1 border border-sage-200 text-sage-600 py-2 rounded-lg font-medium text-sm hover:bg-sage-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      setClosingMsg(null);
                      setClosingLoading(true);
                      try {
                        const res = await fetch("/api/closing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            esBatu: parseInt(closingEsBatu) || 0,
                            cupTerjual: parseInt(closingCup) || 0,
                          }),
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.error || "Gagal");
                        }
                        setClosingMsg({ type: "success", text: "Laporan closing berhasil disimpan!" });
                        setClosingEsBatu("");
                        setClosingCup("");
                        setTimeout(() => { setShowClosing(false); setClosingMsg(null); }, 1500);
                      } catch (err) {
                        setClosingMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan" });
                      } finally {
                        setClosingLoading(false);
                      }
                    }}
                    disabled={closingLoading}
                    className="flex-1 bg-sage-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-sage-700 disabled:bg-sage-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {closingLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : "Simpan Closing"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
