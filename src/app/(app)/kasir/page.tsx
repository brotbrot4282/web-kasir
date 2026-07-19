"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatRupiah } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

type VariantOption = { nama: string; tambahHarga: number };
type VariantGroup = { nama: string; required: boolean; options: VariantOption[] };
type Kategori = { id: string; nama: string };
type Menu = {
  id: string; nama: string; harga: number; stok: number; gambar: string | null;
  isTersedia: boolean; kategoriId: string; kategori: Kategori; variants: VariantGroup[] | null;
};
type KeranjangItem = { key: string; menuId: string; nama: string; harga: number; jumlah: number; subtotal: number; variant: string | null; gratisPoin: boolean };
type PengaturanPoin = { rupiahPerPoin: number; poinPerGratisItem: number };

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
  const [pengaturanPoin, setPengaturanPoin] = useState<PengaturanPoin>({ rupiahPerPoin: 15000, poinPerGratisItem: 5 });
  const [diskon, setDiskon] = useState("");
  const [diskonTipe, setDiskonTipe] = useState<"nominal" | "persen">("nominal");
  const [metodeBayar, setMetodeBayar] = useState<"CASH" | "QRIS">("CASH");
  const [transaksiSukses, setTransaksiSukses] = useState<{
    noTransaksi: string; totalHarga: number; totalBayar: number;
    kembalian: number; metodeBayar: string; items: KeranjangItem[];
    poinDidapat: number; poinDigunakan: number; totalPoin: number;
    diskon: number;
    publicId: string; noWa: string | null; memberNama?: string;
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [noWa, setNoWa] = useState("");
  const [memberNama, setMemberNama] = useState("");
  const [memberPoin, setMemberPoin] = useState(0);
  const [memberTerdaftar, setMemberTerdaftar] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [showClosing, setShowClosing] = useState(false);
  const [belanjaUrgentItems, setBelanjaUrgentItems] = useState<Array<{ nama: string; nominal: number }>>([]);
  const [closingCatatan, setClosingCatatan] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const [closingMsg, setClosingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dailySummary, setDailySummary] = useState<{ cup: number; makanan: number } | null>(null);
  const [closingSummary, setClosingSummary] = useState<{
    makanan: { qty: number; total: number };
    minuman: { qty: number; total: number };
    totalOmset: number;
    totalTransaksi: number;
    breakdown: { nama: string; qty: number; subtotal: number }[];
  } | null>(null);
  const [closingSummaryLoading, setClosingSummaryLoading] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [uangAwalInput, setUangAwalInput] = useState("");
  const [openingLoading, setOpeningLoading] = useState(false);
  const [openingMsg, setOpeningMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [shiftOpened, setShiftOpened] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [riwayatData, setRiwayatData] = useState<Array<{
    id: string; noTransaksi: string; totalHarga: number; totalBayar: number;
    kembalian: number; metodeBayar: string; createdAt: string; poinDigunakan: number; totalPoin: number;
    diskon: number;
    noWa: string | null; publicId: string;
    itemTransaksi: Array<{ id: string; namaMenu: string; harga: number; jumlah: number; subtotal: number; variant: string | null }>;
    member: { nama: string | null; noWa: string } | null;
  }>>([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [riwayatCetakId, setRiwayatCetakId] = useState<string | null>(null);

  const fetchDailySummary = useCallback(() => {
    fetch("/api/kasir/daily-summary")
      .then((r) => r.json())
      .then(setDailySummary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/kategori").then((r) => r.json()),
      fetch("/api/menu").then((r) => r.json()),
    ]).then(([kategori, menu]) => {
      setKategoriList(kategori);
      setMenuList(menu);
      if (kategori.length > 0) setKategoriAktif(kategori[0].id);
    }).finally(() => setLoading(false));
    fetch("/api/pengaturan-poin").then((r) => r.json()).then(setPengaturanPoin).catch(() => {});
    fetchDailySummary();
  }, [fetchDailySummary]);

  useEffect(() => {
    if (showClosing) {
      setClosingSummaryLoading(true);
      fetch("/api/closing/summary")
        .then((r) => r.json())
        .then(setClosingSummary)
        .catch(() => setClosingSummary(null))
        .finally(() => setClosingSummaryLoading(false));
    }
  }, [showClosing]);

  useEffect(() => {
    if (!noWa.trim()) {
      setMemberPoin(0);
      setMemberTerdaftar(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/member?search=${encodeURIComponent(noWa)}`);
        if (res.ok) {
          const data = await res.json();
          const found = data.find((m: { noWa: string }) => m.noWa === noWa);
          if (found) {
            setMemberPoin(found.poin || 0);
            setMemberTerdaftar(true);
            if (!memberNama && found.nama) setMemberNama(found.nama);
            return;
          }
        }
      } catch {}
      setMemberPoin(0);
      setMemberTerdaftar(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [noWa]);

  useEffect(() => {
    fetch("/api/opening")
      .then((r) => r.json())
      .then((data) => {
        if (!data.opened) {
          setShowOpening(true);
        } else {
          setShiftOpened(true);
        }
      })
      .catch(() => setShowOpening(true));
  }, []);

  const menuFilter = menuList.filter((m) => {
    if (!m.isTersedia) return false;
    if (kategoriAktif && m.kategoriId !== kategoriAktif) return false;
    if (search && !m.nama.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalKeranjang = keranjang.reduce((sum, item) => sum + (item.gratisPoin ? 0 : item.subtotal), 0);
  const poinDigunakan = keranjang.filter((i) => i.gratisPoin).length * pengaturanPoin.poinPerGratisItem;
  const totalPoinRupiah = keranjang.filter((i) => i.gratisPoin).reduce((sum, i) => sum + i.subtotal, 0);
  const semuaGratis = keranjang.length > 0 && keranjang.every((i) => i.gratisPoin);

  const diskonInput = parseInt(diskon.replace(/\D/g, "")) || 0;
  const totalDiskon = diskonTipe === "persen"
    ? Math.min(Math.floor(totalKeranjang * diskonInput / 100), totalKeranjang)
    : Math.min(diskonInput, totalKeranjang);
  const totalBayarFinal = Math.max(0, totalKeranjang - totalDiskon);

  const hitungHarga = useCallback((menu: Menu, variantString: string | null): number => {
    if (!variantString || !menu.variants) return menu.harga;
    const selectedNames = variantString.split(" | ");
    let tambahan = 0;
    for (const group of menu.variants) {
      const opt = group.options.find((o) => selectedNames.includes(o.nama));
      if (opt) tambahan += opt.tambahHarga;
    }
    return menu.harga + tambahan;
  }, []);

  const tambahKeKeranjang = useCallback((menu: Menu, variantString: string | null) => {
    const key = `${menu.id}-${variantString || ""}`;
    const harga = hitungHarga(menu, variantString);
    const nama = variantString ? `${menu.nama} - ${variantString}` : menu.nama;
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
      return [...prev, { key, menuId: menu.id, nama, harga, jumlah: 1, subtotal: harga, variant: variantString, gratisPoin: false }];
    });
  }, [hitungHarga]);

  const toggleGratisPoin = useCallback((key: string) => {
    setKeranjang((prev) => {
      const item = prev.find((i) => i.key === key);
      if (!item) return prev;
      const akanGratis = !item.gratisPoin;
      if (akanGratis && poinDigunakan + pengaturanPoin.poinPerGratisItem > memberPoin) return prev;
      return prev.map((i) =>
        i.key === key
          ? akanGratis
            ? { ...i, gratisPoin: true, jumlah: 1, subtotal: i.harga }
            : { ...i, gratisPoin: false }
          : i
      );
    });
  }, [memberPoin, poinDigunakan, pengaturanPoin.poinPerGratisItem]);

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
    const bayarAmount = metodeBayar === "QRIS" ? totalBayarFinal : (parseInt(totalBayar.replace(/\D/g, "")) || 0);
    if (keranjang.length === 0) { setMessage({ type: "error", text: "Keranjang masih kosong" }); return; }
    if (metodeBayar === "CASH" && bayarAmount < totalBayarFinal) { setMessage({ type: "error", text: `Kurang Rp ${(totalBayarFinal - bayarAmount).toLocaleString()}` }); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: keranjang.map((i) => ({ menuId: i.menuId, jumlah: i.jumlah, variant: i.variant, gratisPoin: i.gratisPoin })),
          totalBayar: bayarAmount,
          diskon: totalDiskon,
          metodeBayar,
          noWa: noWa.trim() || undefined,
          memberNama: memberNama.trim() || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Gagal"); }
      const data = await res.json();
      setTransaksiSukses({ noTransaksi: data.noTransaksi, totalHarga: data.totalHarga, totalBayar: data.totalBayar, kembalian: data.kembalian, metodeBayar, items: [...keranjang], poinDidapat: data.poinDidapat || 0, poinDigunakan: data.poinDigunakan || 0, totalPoin: data.totalPoin || 0, diskon: data.diskon || 0, publicId: data.publicId, noWa: data.noWa || null, memberNama: memberNama.trim() || undefined });
      setKeranjang([]); setTotalBayar(""); setDiskon(""); setNoWa(""); setMemberNama(""); setMetodeBayar("CASH"); setMessage(null);
      fetch("/api/menu").then((r) => r.json()).then(setMenuList);
      fetchDailySummary();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal bayar" });
    } finally {
      setSubmitting(false);
    }
  };

  type StrukData = {
    noTransaksi: string; totalHarga: number; totalBayar: number;
    kembalian: number; metodeBayar: string; poinDidapat: number; poinDigunakan: number;
    diskon: number;
    noWa: string | null; memberNama?: string;
    items: KeranjangItem[];
  };

  const printReceipt = useCallback((jenis: "customer" | "catatan", data: StrukData) => {
    if (!iframeRef.current) return;
    const t = data;
    const tanggal = new Date().toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const jam = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit", minute: "2-digit"
    });

    const itemsHtml = t.items.map((item) => {
      const nm = item.nama.length > 28 ? item.nama.slice(0, 26) + ".." : item.nama;
      const harga = item.subtotal / item.jumlah;
      const gratisLabel = item.gratisPoin ? " [FREE]" : "";
      const subtotalStr = item.gratisPoin ? "Gratis" : formatRupiah(item.subtotal);
      return `
        <div style="display:flex;justify-content:space-between;">
          <span>${nm}${gratisLabel}</span>
          <span>${subtotalStr}</span>
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
  <img src="/logo.jpg" style="display:block;margin:0 auto 4px;width:32px;height:32px;border-radius:50%;object-fit:cover;" />
  <div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:2px;">WARKOP SOEKARDJO</div>
  <div style="text-align:center;font-size:9px;color:#666;">${tanggal} ${jam}</div>
  <div style="text-align:center;font-size:9px;color:#666;">${t.noTransaksi}</div>
  ${t.memberNama ? `<div style="text-align:center;font-size:9px;color:#666;margin-top:2px;">${t.memberNama}${t.noWa ? ` (${t.noWa})` : ""}</div>` : ""}
  ${labelCatatan}
  <div style="border-top:1px dashed #000;margin:6px 0;"></div>
  ${itemsHtml}
  <div style="border-top:1px dashed #000;margin:6px 0;"></div>
  <div style="display:flex;justify-content:space-between;font-weight:bold;">
    <span>TOTAL</span><span>${formatRupiah(t.totalHarga)}</span>
  </div>
  ${t.diskon > 0 ? `<div style="display:flex;justify-content:space-between;color:#c00;">
    <span>Diskon</span><span>-${formatRupiah(t.diskon)}</span>
  </div>` : ""}
  <div style="display:flex;justify-content:space-between;">
    <span>Bayar</span><span>${formatRupiah(t.totalBayar)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;">
    <span>Metode</span><span>${t.metodeBayar === "QRIS" ? "QRIS" : "Tunai"}</span>
  </div>
  ${t.metodeBayar !== "QRIS" ? `<div style="display:flex;justify-content:space-between;">
    <span>Kembali</span><span>${formatRupiah(t.kembalian)}</span>
  </div>` : ""}
  ${t.poinDigunakan > 0 ? `<div style="border-top:1px dashed #000;margin:6px 0;"></div>
  <div style="display:flex;justify-content:space-between;">
    <span>Poin Dipakai</span><span>${t.poinDigunakan} poin</span>
  </div>` : ""}
  ${t.poinDidapat > 0 ? `<div style="border-top:1px dashed #000;margin:6px 0;"></div>
  <div style="display:flex;justify-content:space-between;">
    <span>Poin</span><span>+${t.poinDidapat} poin</span>
  </div>` : ""}
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
  }, []);

  const cetakStruk = useCallback((jenis: "customer" | "catatan") => {
    if (!transaksiSukses) return;
    printReceipt(jenis, transaksiSukses);
  }, [transaksiSukses, printReceipt]);

  const fetchRiwayat = useCallback(() => {
    setRiwayatLoading(true);
    const today = new Date().toLocaleDateString("fr-CA", { timeZone: "Asia/Jakarta" });
    fetch(`/api/transaksi?dari=${today}&sampai=${today}&limit=50`)
      .then((r) => r.json())
      .then((data) => setRiwayatData(data.data || []))
      .catch(() => setRiwayatData([]))
      .finally(() => setRiwayatLoading(false));
  }, []);

  const cetakStrukUlang = useCallback(async (t: typeof riwayatData[0], jenis: "customer" | "catatan") => {
    setRiwayatCetakId(t.id);
    try {
      const res = await fetch(`/api/transaksi/${t.id}`);
      const full = await res.json();
      const poinDidapat = Math.floor(Math.max(0, (full.totalHarga - (full.totalPoin || 0) - (full.diskon || 0))) / pengaturanPoin.rupiahPerPoin);
      const strukData: StrukData = {
        noTransaksi: full.noTransaksi,
        totalHarga: full.totalHarga,
        totalBayar: full.totalBayar,
        kembalian: full.kembalian,
        metodeBayar: full.metodeBayar || "CASH",
        poinDidapat,
        poinDigunakan: full.poinDigunakan || 0,
        diskon: full.diskon || 0,
        noWa: full.noWa || full.member?.noWa || null,
        memberNama: full.member?.nama || undefined,
        items: full.itemTransaksi.map((item: { namaMenu: string; harga: number; jumlah: number; subtotal: number; variant: string | null; menuId: string }) => ({
          key: `${item.menuId}-${item.variant || ""}`,
          menuId: item.menuId,
          nama: item.variant ? `${item.namaMenu} - ${item.variant}` : item.namaMenu,
          harga: item.harga,
          jumlah: item.jumlah,
          subtotal: item.subtotal,
          variant: item.variant,
          gratisPoin: item.subtotal === 0,
        })),
      };
      printReceipt(jenis, strukData);
    } catch {
    } finally {
      setRiwayatCetakId(null);
    }
  }, [printReceipt, pengaturanPoin.rupiahPerPoin]);

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
                <span className="text-sage-600">
                  {item.nama} <span className="text-sage-400">x{item.jumlah}</span>
                  {item.gratisPoin && <span className="text-amber-500 font-bold ml-1">[FREE]</span>}
                </span>
                <span className={`font-medium ${item.gratisPoin ? "text-amber-500" : "text-sage-800"}`}>
                  {item.gratisPoin ? "Gratis" : formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-sage-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between font-bold text-sage-800">
              <span>Total</span><span>{formatRupiah(transaksiSukses.totalHarga)}</span>
            </div>
            {transaksiSukses.diskon > 0 && (
              <div className="flex justify-between text-red-500 font-medium">
                <span>Diskon</span><span>-{formatRupiah(transaksiSukses.diskon)}</span>
              </div>
            )}
            <div className="flex justify-between text-sage-500">
              <span>Bayar</span><span>{formatRupiah(transaksiSukses.totalBayar)}</span>
            </div>
            <div className="flex justify-between text-sage-500">
              <span>Metode</span><span>{transaksiSukses.metodeBayar === "QRIS" ? "QRIS" : "Tunai"}</span>
            </div>
            {transaksiSukses.metodeBayar !== "QRIS" && (
              <div className="flex justify-between text-sage-600 font-medium">
                <span>Kembali</span><span>{formatRupiah(transaksiSukses.kembalian)}</span>
              </div>
            )}
          </div>

          {transaksiSukses.poinDigunakan > 0 && (
            <div className="flex items-center justify-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-4">
              <span className="text-sm font-medium text-rose-600">Poin dipakai: {transaksiSukses.poinDigunakan}</span>
            </div>
          )}
          {transaksiSukses.poinDidapat > 0 && (
            <div className="flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
              <span className="text-sm font-medium text-amber-700">+{transaksiSukses.poinDidapat} Poin</span>
            </div>
          )}
          {transaksiSukses.memberNama && (
            <p className="text-xs text-sage-500 mt-3">Customer: {transaksiSukses.memberNama}</p>
          )}
          <p className="text-xs text-sage-300 mt-4">Terima kasih atas kunjungan Anda</p>
          {transaksiSukses.publicId && (
            <a
              href={`/invoice/${transaksiSukses.publicId}`}
              target="_blank"
              className="block mt-2 text-xs text-sage-400 hover:text-sage-600 transition-colors underline underline-offset-2"
            >
              Lihat invoice online
            </a>
          )}
        </div>

        {transaksiSukses.noWa && (
          <a
            href={(() => {
              const no = transaksiSukses.noWa!.replace(/^0+/, "62");
              const poinFmt = new Intl.NumberFormat("id-ID").format(transaksiSukses.poinDidapat);
              const poinPakaiFmt = new Intl.NumberFormat("id-ID").format(transaksiSukses.poinDigunakan);
              const barisPoinPakai = transaksiSukses.poinDigunakan > 0
                ? `* Poin Dipakai : ${poinPakaiFmt} POINT`
                : "";
              const pesan = [
                `Dear ${transaksiSukses.memberNama || "Customer"},`,
                "",
                "Terimakasih telah melakukan transaksi di WARKOP SOEKARDJO",
                "Berikut adalah INVOICE transaksi Anda :",
                "",
                `* No Invoice : ${transaksiSukses.noTransaksi}`,
                `* TOTAL TRANSAKSI : ${formatRupiah(transaksiSukses.totalHarga)}`,
                barisPoinPakai,
                `* Poin Didapat : ${poinFmt} POINT`,
                "",
                "Untuk melihat rincian transaksi dan point reward yang Anda dapatkan (POINT) klik link berikut",
                `${window.location.origin}/invoice/${transaksiSukses.publicId}`,
                "",
                "*WARKOP SOEKARDJO (17.00 - 23.00)*",
                "",
                "Update info kegiatan menarik follow : https://www.instagram.com/warkop.soekardjo/",
                "",
                "Have a Great Day,",
                "Management WARKOP SOEKARDJO",
                "#ojolalibaliomah",
                "#thefriendlyvapestoreinthetown",
              ].join("\n");
              return `https://wa.me/${no}?text=${encodeURIComponent(pesan)}`;
            })()}
            target="_blank"
            className="block mt-3 text-center bg-emerald-50 text-emerald-600 border border-emerald-200 py-2.5 rounded-xl font-medium hover:bg-emerald-100 transition-colors text-sm no-print"
          >
            Kirim WA 
          </a>
        )}
        <div className="flex gap-3 mt-4 no-print">
          <button onClick={() => cetakStruk("customer")} className="flex-1 bg-sage-600 text-white py-2.5 rounded-xl font-medium hover:bg-sage-700 transition-colors text-sm">
            Cetak Customer
          </button>
          <button onClick={() => cetakStruk("catatan")} className="flex-1 bg-white text-sage-600 border border-sage-200 py-2.5 rounded-xl font-medium hover:bg-sage-50 transition-colors text-sm">
            Cetak Catatan
          </button>
          <button onClick={() => { setTransaksiSukses(null); setMemberNama(""); setNoWa(""); }} className="flex-1 bg-sage-100 text-sage-600 py-2.5 rounded-xl font-medium hover:bg-sage-200 transition-colors text-sm">
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
          <div className="flex items-center gap-3">
            {dailySummary && (
              <div className="flex items-center gap-2.5 bg-white border border-sage-200 rounded-lg px-3 py-1.5 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-sky-500">Drink</span>
                  <span className="text-xs font-bold text-sage-700">{dailySummary.cup}</span>
                </div>
                <span className="text-sage-200 text-xs">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-500">Food</span>
                  <span className="text-xs font-bold text-sage-700">{dailySummary.makanan}</span>
                </div>
              </div>
            )}
            {shiftOpened && (
              <>
                <button
                  onClick={() => { setShowRiwayat(true); fetchRiwayat(); }}
                  className="flex items-center gap-1.5 bg-white text-sage-600 border border-sage-200 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-sage-50 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Riwayat
                </button>
                <button
                  onClick={() => setShowClosing(true)}
                  className="flex items-center gap-1.5 bg-sage-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-sage-700 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tutup Shift
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-print">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setKategoriAktif("")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              kategoriAktif === ""
                ? "bg-sage-600 text-white shadow-sm shadow-sage-200"
                : "bg-white text-sage-500 border border-sage-200 hover:border-sage-300 hover:text-sage-700 hover:bg-sage-50"
            }`}
          >
            Semua
          </motion.button>
          {kategoriList.map((k) => (
            <motion.button
              key={k.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setKategoriAktif(k.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                kategoriAktif === k.id
                  ? "bg-sage-600 text-white shadow-sm shadow-sage-200"
                  : "bg-white text-sage-500 border border-sage-200 hover:border-sage-300 hover:text-sage-700 hover:bg-sage-50"
              }`}
            >
              {k.nama}
            </motion.button>
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
            className="w-full border border-sage-200 rounded-xl pl-9 pr-9 py-2.5 text-sm bg-white text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 hover:bg-sage-100 rounded-lg p-1 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
              <div className="text-sm text-sage-400 font-medium">Memuat menu...</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            <AnimatePresence>
            {menuFilter.map((menu, idx) => (
              <motion.button
                key={menu.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                onClick={() => {
                  if (menu.variants && menu.variants.length > 0) {
                    setSelectedMenu(menu);
                  } else {
                    tambahKeKeranjang(menu, null);
                  }
                }}
                disabled={menu.stok === 0}
                className={`relative group bg-white border border-sage-200 rounded-xl overflow-hidden text-left transition-all duration-200 ${
                  menu.stok === 0
                    ? "opacity-45 cursor-not-allowed"
                    : "hover:border-sage-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md cursor-pointer"
                }`}
              >
                {menu.variants && menu.variants.length > 0 && (
                  <span className="absolute top-2 right-2 z-10 bg-amber-50 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-200 shadow-sm">
                    Varian
                  </span>
                )}
                {menu.stok === 0 && (
                  <span className="absolute top-2 left-2 z-10 bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200 shadow-sm">
                    Habis
                  </span>
                )}
                {menu.stok > 0 && menu.stok <= 5 && (
                  <span className="absolute top-2 left-2 z-10 bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 shadow-sm">
                    Sisa {menu.stok}
                  </span>
                )}
                {menu.gambar ? (
                  <div className="w-full h-28 sm:h-32 bg-sage-50 overflow-hidden">
                    <img src={menu.gambar} alt={menu.nama} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-full h-28 sm:h-32 bg-gradient-to-br from-sage-50 to-sage-100 flex items-center justify-center">
                    <svg className="w-9 h-9 text-sage-300 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <p className="font-medium text-sm text-sage-800 truncate leading-tight">{menu.nama}</p>
                  <p className="text-sm text-sage-700 font-bold">{formatRupiah(menu.harga)}</p>
                </div>
              </motion.button>
            ))}
            </AnimatePresence>
            {menuFilter.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <div className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="text-sm text-sage-500 font-medium">Menu tidak tersedia</p>
                <p className="text-xs text-sage-400 mt-1">Pilih kategori lain atau ubah pencarian</p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 no-print">
        <div className="bg-white border border-sage-200 rounded-xl shadow-sm p-4 sticky top-16">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-sage-800">Pesanan</h2>
            {keranjang.length > 0 && (
              <span className="text-xs bg-sage-100 text-sage-600 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                {keranjang.reduce((s, i) => s + i.jumlah, 0)} item
              </span>
            )}
          </div>

          <div className={`${keranjang.length > 0 ? "space-y-1.5 max-h-72 overflow-y-auto mb-4" : ""}`}>
            {keranjang.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-sage-400">Belum ada item</p>
                <p className="text-xs text-sage-300 mt-1">Klik menu untuk menambah pesanan</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
              {keranjang.map((item, idx) => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, x: -12, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 12, height: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="flex items-center gap-2 bg-white border border-sage-200 rounded-lg p-2.5 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sage-800 truncate">{item.nama}</p>
                    <p className="text-xs text-sage-400">{formatRupiah(item.harga)} / item</p>
                  </div>
                  {memberTerdaftar && memberPoin >= pengaturanPoin.poinPerGratisItem && (
                    <button
                      onClick={() => toggleGratisPoin(item.key)}
                      className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                        item.gratisPoin
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-sage-50 text-sage-400 border-sage-200 hover:border-amber-300 hover:text-amber-600"
                      }`}
                      title={item.gratisPoin ? "Batalkan gratis poin" : `Gratiskan dengan ${pengaturanPoin.poinPerGratisItem} poin`}
                    >
                      {item.gratisPoin ? "FREE" : "Poin"}
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => ubahJumlah(item.key, -1)} disabled={item.gratisPoin} className="w-7 h-7 rounded-lg bg-white border border-sage-200 flex items-center justify-center text-sage-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors text-sm font-bold disabled:opacity-30">-</button>
                    <span className="w-6 text-center text-sm font-bold text-sage-800">{item.jumlah}</span>
                    <button onClick={() => ubahJumlah(item.key, 1)} disabled={item.gratisPoin} className="w-7 h-7 rounded-lg bg-white border border-sage-200 flex items-center justify-center text-sage-500 hover:bg-sage-100 hover:text-sage-700 hover:border-sage-300 transition-colors text-sm font-bold disabled:opacity-30">+</button>
                  </div>
                  {item.gratisPoin ? (
                    <span className="text-sm font-bold text-amber-600 w-16 text-right">Gratis</span>
                  ) : (
                    <p className="text-sm font-bold text-sage-800 w-16 text-right">{formatRupiah(item.subtotal)}</p>
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
            )}
          </div>

          {keranjang.length > 0 && (
            <div className="border-t border-sage-200 pt-3 space-y-3">
              <div className="flex items-center justify-between bg-sage-50 rounded-lg px-3 py-2 -mx-1">
                <span className="text-sm font-semibold text-sage-600">Total Pesanan</span>
                <div className="text-right">
                  {totalDiskon > 0 && (
                    <span className="text-xs text-sage-400 line-through">{formatRupiah(totalKeranjang)}</span>
                  )}
                  <span className="text-xl font-bold text-sage-800 tracking-tight">{formatRupiah(totalBayarFinal)}</span>
                </div>
              </div>

              {memberTerdaftar && memberPoin >= pengaturanPoin.poinPerGratisItem && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 font-medium">Poin tersedia</span>
                    <span className="text-amber-700 font-bold">{memberPoin} poin</span>
                  </div>
                  {poinDigunakan > 0 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-600">Poin dipakai</span>
                        <span className="text-amber-700 font-semibold">-{poinDigunakan} poin</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-600">Potongan</span>
                        <span className="text-emerald-600 font-semibold">-{formatRupiah(totalPoinRupiah)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!semuaGratis && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-sage-500">Diskon</label>
                  <div className="flex gap-1.5">
                    <div className="flex bg-sage-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setDiskonTipe("nominal")}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          diskonTipe === "nominal" ? "bg-white text-sage-800 shadow-sm" : "text-sage-400 hover:text-sage-600"
                        }`}
                      >Rp</button>
                      <button
                        onClick={() => setDiskonTipe("persen")}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          diskonTipe === "persen" ? "bg-white text-sage-800 shadow-sm" : "text-sage-400 hover:text-sage-600"
                        }`}
                      >%</button>
                    </div>
                    <input
                      type="text"
                      value={diskon}
                      onChange={(e) => setDiskon(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="flex-1 border border-sage-200 rounded-lg px-3 py-1.5 text-sm font-medium text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all bg-white"
                    />
                  </div>
                  {totalDiskon > 0 && (
                    <p className="text-xs text-red-500 font-medium">Diskon: -{formatRupiah(totalDiskon)}</p>
                  )}
                </div>
              )}

              {!semuaGratis && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-sage-500">Metode Bayar</label>
                  <div className="flex bg-sage-100 rounded-lg p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setMetodeBayar("CASH")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                        metodeBayar === "CASH"
                          ? "bg-white text-sage-800 shadow-sm"
                          : "text-sage-400 hover:text-sage-600"
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodeBayar("QRIS")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                        metodeBayar === "QRIS"
                          ? "bg-white text-sage-800 shadow-sm"
                          : "text-sage-400 hover:text-sage-600"
                      }`}
                    >
                      QRIS
                    </button>
                  </div>
                </div>
              )}

              {!semuaGratis && metodeBayar === "CASH" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-sage-500">Jumlah Bayar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-sage-400">Rp</span>
                    <input
                      type="text"
                      value={totalBayar}
                      onChange={(e) => setTotalBayar(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-full border border-sage-200 rounded-lg pl-9 pr-3 py-2.5 text-right text-lg font-bold text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all bg-white"
                    />
                  </div>
                </div>
              )}

              {!semuaGratis && metodeBayar === "QRIS" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-xs text-blue-400">Total yang harus dibayar</p>
                  <p className="text-lg font-bold text-blue-700">{formatRupiah(totalBayarFinal)}</p>
                </div>
              )}

              {semuaGratis && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-3 text-center">
                  <p className="text-sm font-medium text-emerald-700">Semua item gratis dari Poin</p>
                  <p className="text-xs text-emerald-500 mt-0.5">Total bayar: Rp 0</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-sage-500">Nama (opsional)</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <input
                    type="text"
                    value={memberNama}
                    onChange={(e) => setMemberNama(e.target.value)}
                    placeholder="Nama customer"
                    className="w-full border border-sage-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-sage-500">No. WhatsApp (opsional)</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <input
                    type="text"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value.replace(/\D/g, ""))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full border border-sage-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all bg-white"
                  />
                </div>
              </div>

              {!semuaGratis && metodeBayar === "CASH" && totalBayar && parseInt(totalBayar) >= totalBayarFinal && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-emerald-700">Kembalian</span>
                  <span className="text-base font-bold text-emerald-700">{formatRupiah(parseInt(totalBayar) - totalBayarFinal)}</span>
                </div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm p-2.5 rounded-lg font-medium ${
                    message.type === "error"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-sage-100 text-sage-700"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}

              <button
                onClick={bayar}
                disabled={keranjang.length === 0 || submitting}
                className="w-full bg-sage-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-sage-700 disabled:bg-sage-100 disabled:text-sage-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : semuaGratis ? "Bayar (Gratis)" : metodeBayar === "QRIS" ? "Bayar via QRIS" : "Bayar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Riwayat Modal */}
      <AnimatePresence>
        {showRiwayat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowRiwayat(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div>
                  <h2 className="font-semibold text-sage-800">Riwayat Transaksi</h2>
                  <p className="text-xs text-sage-400 mt-0.5">Transaksi hari ini</p>
                </div>
                <button onClick={() => setShowRiwayat(false)} className="w-7 h-7 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors">
                  <X className="w-4 h-4 text-sage-500" />
                </button>
              </div>

              <div className="px-5 pb-5 overflow-y-auto flex-1">
                {riwayatLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
                  </div>
                ) : riwayatData.length === 0 ? (
                  <div className="text-center py-10 text-sm text-sage-400">Belum ada transaksi hari ini</div>
                ) : (
                  <div className="space-y-2">
                    {riwayatData.map((t) => (
                      <div key={t.id} className="border border-sage-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-sage-400">{t.noTransaksi}</p>
                            <p className="text-sm font-bold text-sage-800 mt-0.5">{formatRupiah(t.totalHarga)}</p>
                            <p className="text-xs text-sage-500 mt-0.5">
                              {new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              {t.member?.nama ? ` - ${t.member.nama}` : ""}
                            </p>
                            <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${t.metodeBayar === "QRIS" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                              {t.metodeBayar === "QRIS" ? "QRIS" : "Cash"}
                            </span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => cetakStrukUlang(t, "customer")}
                              disabled={riwayatCetakId === t.id}
                              className="text-xs font-medium text-sage-600 bg-sage-100 hover:bg-sage-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {riwayatCetakId === t.id ? (
                                <span className="flex items-center gap-1">
                                  <span className="w-3 h-3 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
                                </span>
                              ) : "Cetak"}
                            </button>
                            <button
                              onClick={() => cetakStrukUlang(t, "catatan")}
                              disabled={riwayatCetakId === t.id}
                              className="text-xs font-medium text-white bg-sage-600 hover:bg-sage-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Catatan
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opening Shift Modal */}
      <AnimatePresence>
        {showOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl w-full max-w-sm shadow-xl"
            >
              <div className="px-5 pt-5 pb-3">
                <h2 className="font-semibold text-sage-800 text-lg">Buka Shift</h2>
                <p className="text-xs text-sage-400 mt-0.5">Masukkan jumlah uang awal di mesin kasir</p>
              </div>

              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-sage-600 mb-1">Uang Awal (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-sage-400">Rp</span>
                    <input
                      type="text"
                      value={uangAwalInput}
                      onChange={(e) => setUangAwalInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      autoFocus
                      className="w-full border border-sage-200 rounded-lg pl-9 pr-3 py-2.5 text-right text-lg font-bold text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all bg-white"
                    />
                  </div>
                </div>

                {openingMsg && (
                  <div className={`text-sm p-2.5 rounded-lg ${openingMsg.type === "error" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                    {openingMsg.text}
                  </div>
                )}

                <button
                  onClick={async () => {
                    setOpeningMsg(null);
                    const nominal = parseInt(uangAwalInput) || 0;
                    if (nominal <= 0) {
                      setOpeningMsg({ type: "error", text: "Uang awal harus lebih dari 0" });
                      return;
                    }
                    setOpeningLoading(true);
                    try {
                      const res = await fetch("/api/opening", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uangAwal: nominal }),
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || "Gagal");
                      }
                      setShiftOpened(true);
                      setShowOpening(false);
                    } catch (err) {
                      setOpeningMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan" });
                    } finally {
                      setOpeningLoading(false);
                    }
                  }}
                  disabled={openingLoading}
                  className="w-full bg-sage-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-sage-700 disabled:bg-sage-300 disabled:cursor-not-allowed transition-colors"
                >
                  {openingLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : "Buka Shift"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant Modal */}
      <AnimatePresence>
        {selectedMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => { setSelectedMenu(null); setSelectedVariants({}); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-sm shadow-xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div>
                  <h2 className="font-semibold text-sage-800">Pilih Varian</h2>
                  <p className="text-xs text-sage-400 mt-0.5">{selectedMenu.nama} — {formatRupiah(selectedMenu.harga)}</p>
                </div>
                <button onClick={() => { setSelectedMenu(null); setSelectedVariants({}); }} className="w-7 h-7 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors">
                  <X className="w-4 h-4 text-sage-500" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4 overflow-y-auto flex-1">
                {selectedMenu.variants?.map((group) => (
                  <div key={group.nama}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm font-medium text-sage-700">{group.nama}</span>
                      {group.required && (
                        <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Wajib</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedVariants[group.nama] === opt.nama;
                        return (
                          <button
                            key={opt.nama}
                            onClick={() => setSelectedVariants((prev) => {
                              const next = { ...prev };
                              if (isSelected) {
                                delete next[group.nama];
                              } else {
                                next[group.nama] = opt.nama;
                              }
                              return next;
                            })}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isSelected
                                ? "bg-sage-700 text-white border-sage-700 shadow-sm"
                                : "bg-white text-sage-600 border-sage-200 hover:border-sage-400 hover:bg-sage-50"
                            }`}
                          >
                            {opt.nama}
                            {opt.tambahHarga > 0 && (
                              <span className="ml-1 text-xs opacity-75">+{formatRupiah(opt.tambahHarga)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5 pt-2 shrink-0">
                {(() => {
                  const requiredGroups = selectedMenu.variants?.filter((g) => g.required) || [];
                  const allRequiredSelected = requiredGroups.every((g) => selectedVariants[g.nama]);
                  const hasVariants = (selectedMenu.variants?.length || 0) > 0;
                  const variantString = hasVariants
                    ? selectedMenu.variants!
                        .map((g) => selectedVariants[g.nama])
                        .filter(Boolean)
                        .join(" | ") || null
                    : null;
                  const harga = hitungHarga(selectedMenu, variantString);

                  return (
                    <button
                      onClick={() => {
                        tambahKeKeranjang(selectedMenu, variantString);
                        setSelectedMenu(null);
                        setSelectedVariants({});
                      }}
                      disabled={!allRequiredSelected}
                      className="w-full bg-sage-700 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-sage-800 disabled:bg-sage-300 disabled:cursor-not-allowed transition-colors flex items-center justify-between px-4"
                    >
                      <span>{allRequiredSelected ? "Tambah ke Keranjang" : "Pilih semua varian wajib"}</span>
                      <span>{formatRupiah(harga)}</span>
                    </button>
                  );
                })()}
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
              className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="font-semibold text-sage-800">Tutup Shift</h2>
                  <p className="text-xs text-sage-400 mt-0.5">Ringkasan penjualan shift hari ini</p>
                </div>
                <button onClick={() => { setShowClosing(false); setBelanjaUrgentItems([]); }} className="w-7 h-7 rounded-lg bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors">
                  <X className="w-4 h-4 text-sage-500" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Ringkasan Otomatis */}
                {closingSummaryLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
                  </div>
                ) : closingSummary ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <p className="text-[10px] font-medium text-orange-500 uppercase tracking-wide">Makanan</p>
                        <p className="text-lg font-bold text-sage-800 mt-0.5">{closingSummary.makanan.qty} <span className="text-xs font-normal text-sage-400">item</span></p>
                        <p className="text-xs text-sage-500">{formatRupiah(closingSummary.makanan.total)}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wide">Minuman</p>
                        <p className="text-lg font-bold text-sage-800 mt-0.5">{closingSummary.minuman.qty} <span className="text-xs font-normal text-sage-400">item</span></p>
                        <p className="text-xs text-sage-500">{formatRupiah(closingSummary.minuman.total)}</p>
                      </div>
                    </div>

                    <div className="bg-sage-50 border border-sage-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-sage-600">Total Omset</span>
                        <span className="text-sm font-bold text-sage-800">{formatRupiah(closingSummary.totalOmset)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-sage-600">Total Transaksi</span>
                        <span className="text-sm font-bold text-sage-800">{closingSummary.totalTransaksi}</span>
                      </div>
                    </div>

                    {closingSummary.breakdown.length > 0 && (
                      <div className="border border-sage-200 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-sage-50 border-b border-sage-200">
                          <p className="text-xs font-medium text-sage-600">Detail Item</p>
                        </div>
                        <div className="max-h-32 overflow-y-auto divide-y divide-sage-100">
                          {closingSummary.breakdown.map((item) => (
                            <div key={item.nama} className="flex justify-between items-center px-3 py-1.5">
                              <span className="text-xs text-sage-700 truncate mr-2">{item.nama}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-sage-400">x{item.qty}</span>
                                <span className="text-xs font-medium text-sage-700">{formatRupiah(item.subtotal)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-sage-400">Gagal memuat ringkasan</div>
                )}

                {/* Input Manual */}
                <div className="border-t border-sage-100 pt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-sage-600">Barang Urgent</label>
                      <button
                        type="button"
                        onClick={() => setBelanjaUrgentItems([...belanjaUrgentItems, { nama: "", nominal: 0 }])}
                        className="text-xs font-medium text-sage-500 hover:text-sage-700 transition-colors"
                      >
                        + Tambah
                      </button>
                    </div>
                    {belanjaUrgentItems.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {belanjaUrgentItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.nama}
                              onChange={(e) => {
                                const items = [...belanjaUrgentItems];
                                items[idx] = { ...items[idx], nama: e.target.value };
                                setBelanjaUrgentItems(items);
                              }}
                              placeholder="Nama barang"
                              className="flex-1 border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 bg-white"
                            />
                            <div className="relative w-32">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-sage-400">Rp</span>
                              <input
                                type="text"
                                value={item.nominal ? item.nominal.toLocaleString("id-ID") : ""}
                                onChange={(e) => {
                                  const items = [...belanjaUrgentItems];
                                  items[idx] = { ...items[idx], nominal: parseInt(e.target.value.replace(/\D/g, "")) || 0 };
                                  setBelanjaUrgentItems(items);
                                }}
                                placeholder="0"
                                className="w-full border border-sage-200 rounded-lg pl-8 pr-2 py-2 text-sm text-right text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setBelanjaUrgentItems(belanjaUrgentItems.filter((_, i) => i !== idx))}
                              className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
                            >
                              <X className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          </div>
                        ))}
                        <div className="flex justify-end">
                          <span className="text-xs font-medium text-sage-500">
                            Total Urgent: <span className="text-sage-700">{formatRupiah(belanjaUrgentItems.reduce((sum, item) => sum + (item.nominal || 0), 0))}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-sage-600 mb-1">Catatan Kebutuhan Shift</label>
                    <textarea
                      value={closingCatatan}
                      onChange={(e) => setClosingCatatan(e.target.value)}
                      placeholder="Tulis kebutuhan shift ini... (contoh: beli sprite, beli gas, dll)"
                      rows={4}
                      className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-600/20 focus:border-sage-400 transition-all resize-none"
                    />
                  </div>
                </div>

                {closingMsg && (
                  <div className={`text-sm p-2.5 rounded-lg ${closingMsg.type === "error" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                    {closingMsg.text}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setShowClosing(false); setClosingMsg(null); setBelanjaUrgentItems([]); }}
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
                            catatan: closingCatatan || null,
                            belanjaUrgent: belanjaUrgentItems.length > 0 ? belanjaUrgentItems : null,
                            totalMakanan: closingSummary?.makanan.qty || 0,
                            totalMinuman: closingSummary?.minuman.qty || 0,
                            totalOmset: closingSummary?.totalOmset || 0,
                            totalTransaksi: closingSummary?.totalTransaksi || 0,
                          }),
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.error || "Gagal");
                        }
                        setClosingMsg({ type: "success", text: "Laporan closing berhasil disimpan!" });
                        setClosingCatatan("");
                        setBelanjaUrgentItems([]);
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
