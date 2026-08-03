"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type Ringkasan = { totalOmset: number; totalDiskon: number; totalTransaksi: number; totalItem: number };
type MenuTerlaris = { menuId: string; namaMenu: string; totalTerjual: number };
type Transaksi = {
  id: string; noTransaksi: string; totalHarga: number; diskon: number; totalBayar: number;
  kembalian: number; metodeBayar: string; createdAt: string;
  itemTransaksi: Array<{ id: string; namaMenu: string; harga: number; jumlah: number; subtotal: number }>;
};
type LaporanData = { ringkasan: Ringkasan; menuTerlaris: MenuTerlaris[]; transaksi: Transaksi[]; total: number; totalPages: number; page: number };
type ClosingItem = { id: string; tanggal: string; createdAt: string; shift: string; uangAwal: number; catatan: string | null; belanjaUrgent: Array<{ nama: string; nominal: number }> | null; totalMakanan: number; totalMinuman: number; totalOmset: number; totalTransaksi: number; kasAktual: number | null; selisih: number | null; user: { nama: string } };
type Rentang = "JAM" | "HARI" | "MINGGU" | "BULAN";
type TitikGrafik = { label: string; tanggal: string; omset: number; transaksi: number };

const RENTANG_LABEL: Record<Rentang, string> = { JAM: "Per Jam", HARI: "Per Hari", MINGGU: "Per Minggu", BULAN: "Per Bulan" };

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [detail, setDetail] = useState<Transaksi | null>(null);
  const [closingData, setClosingData] = useState<ClosingItem[]>([]);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [closingPage, setClosingPage] = useState(1);
  const [closingTotalPages, setClosingTotalPages] = useState(1);
  const [rentang, setRentang] = useState<Rentang>("BULAN");
  const [grafikData, setGrafikData] = useState<TitikGrafik[]>([]);
  const [grafikLoading, setGrafikLoading] = useState(false);

  const loadData = (d?: string, s?: string, p?: number, r?: Rentang, cp?: number) => {
    setLoading(true);
    setGrafikLoading(true);
    setClosingError(null);
    const params = new URLSearchParams();
    if (d) params.set("dari", d);
    if (s) params.set("sampai", s);
    if (p) params.set("page", String(p));
    const paramsStr = params.toString();
    const closingParams = new URLSearchParams();
    if (d) closingParams.set("dari", d);
    if (s) closingParams.set("sampai", s);
    closingParams.set("page", String(cp ?? closingPage));
    const closingStr = closingParams.toString();
    const grafikParams = new URLSearchParams();
    grafikParams.set("rentang", r ?? rentang);
    if (d) grafikParams.set("dari", d);
    if (s) grafikParams.set("sampai", s);
    const grafikStr = grafikParams.toString();
    Promise.allSettled([
      fetch(`/api/laporan?${paramsStr}`).then((res) => res.json()),
      fetch(`/api/closing?${closingStr}`).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Gagal memuat data closing");
        }
        return res.json() as Promise<{ data: ClosingItem[]; total: number; totalPages: number }>;
      }),
      fetch(`/api/laporan/grafik?${grafikStr}`).then((res) => res.json()),
    ]).then(([lapResult, closingResult, grafikResult]) => {
      if (lapResult.status === "fulfilled") {
        const lapData = lapResult.value as LaporanData;
        setData(lapData);
        setTotalPages(lapData.totalPages);
      }
      if (closingResult.status === "fulfilled") {
        const closeRes = closingResult.value as { data: ClosingItem[]; totalPages: number };
        setClosingData(closeRes.data);
        setClosingTotalPages(closeRes.totalPages);
      } else {
        setClosingError(closingResult.reason?.message || "Gagal memuat data closing");
      }
      if (grafikResult.status === "fulfilled") {
        const g = grafikResult.value as { data?: TitikGrafik[] };
        setGrafikData(g.data ?? []);
      }
    }).finally(() => { setLoading(false); setGrafikLoading(false); });
  };

  const loadClosing = (p: number) => {
    setClosingPage(p);
    setClosingError(null);
    const params = new URLSearchParams();
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    params.set("page", String(p));
    fetch(`/api/closing?${params.toString()}`).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memuat data closing");
      }
      return res.json() as Promise<{ data: ClosingItem[]; total: number; totalPages: number }>;
    }).then((closeRes) => {
      setClosingData(closeRes.data);
      setClosingTotalPages(closeRes.totalPages);
    }).catch((e) => setClosingError(e.message || "Gagal memuat data closing"));
  };

  useEffect(() => { loadData(); }, []);

  const cari = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setClosingPage(1); loadData(dari || undefined, sampai || undefined, undefined, undefined, 1); };
  const getLocalDate = (d: Date) =>
    new Intl.DateTimeFormat("fr-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const hariIni = () => { const t = getLocalDate(new Date()); setDari(t); setSampai(t); setPage(1); setClosingPage(1); loadData(t, t, undefined, undefined, 1); };
  const mingguIni = () => { const skrg = new Date(); const t = getLocalDate(skrg); const w = new Date(skrg); w.setDate(w.getDate() - 7); const d = getLocalDate(w); setDari(d); setSampai(t); setPage(1); setClosingPage(1); loadData(d, t, undefined, undefined, 1); };
  const bulanIni = () => { const skrg = new Date(); const t = getLocalDate(skrg); const b = getLocalDate(new Date(skrg.getFullYear(), skrg.getMonth(), 1)); setDari(b); setSampai(t); setPage(1); setClosingPage(1); loadData(b, t, undefined, undefined, 1); };
  const gantiRentang = (r: Rentang) => { setRentang(r); loadData(dari || undefined, sampai || undefined, undefined, r); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sage-800">Laporan</h1>
        <p className="text-sm text-sage-500 mt-0.5">Rekap penjualan dan analisis</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={hariIni} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Hari Ini</button>
        <button onClick={mingguIni} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">7 Hari</button>
        <button onClick={bulanIni} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Bulan Ini</button>
        <form onSubmit={cari} className="flex items-center gap-2 ml-auto">
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="border border-sage-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
          <span className="text-sage-400 text-sm">–</span>
          <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="border border-sage-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
          <button type="submit" className="bg-red-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors">Cari</button>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (dari) params.set("dari", dari);
              if (sampai) params.set("sampai", sampai);
              window.open(`/api/laporan/export?${params.toString()}`, "_blank");
            }}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Excel
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-pulse text-sage-400">Memuat data...</div></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <p className="text-sm text-sage-500">Total Omset</p>
              <p className="text-xl font-bold text-sage-800 mt-1">{formatRupiah(data.ringkasan.totalOmset)}</p>
            </div>
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <p className="text-sm text-sage-500">Total Diskon</p>
              <p className="text-xl font-bold text-red-500 mt-1">{formatRupiah(data.ringkasan.totalDiskon)}</p>
            </div>
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <p className="text-sm text-sage-500">Total Transaksi</p>
              <p className="text-xl font-bold text-sage-800 mt-1">{data.ringkasan.totalTransaksi}</p>
            </div>
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <p className="text-sm text-sage-500">Total Item Terjual</p>
              <p className="text-xl font-bold text-sage-800 mt-1">{data.ringkasan.totalItem}</p>
            </div>
          </div>

          <div className="bg-white border border-sage-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-5 3 3 5-7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-sage-800">Grafik Penjualan</h2>
                  <p className="text-xs text-sage-400">Omset & jumlah transaksi</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-sage-50 border border-sage-200 rounded-lg p-1">
                {(Object.keys(RENTANG_LABEL) as Rentang[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => gantiRentang(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      r === rentang
                        ? "bg-red-800 text-white shadow-sm"
                        : "text-sage-500 hover:text-sage-700 hover:bg-white"
                    }`}
                  >
                    {RENTANG_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
            {grafikLoading ? (
              <div className="w-full animate-pulse rounded-xl bg-sage-200/40" style={{ height: 320 }} />
            ) : grafikData.length > 0 ? (
              <div className="w-full" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={grafikData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#7c8a83" }}
                      axisLine={{ stroke: "#e5e5e5" }}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis
                      yAxisId="omset"
                      tickFormatter={formatRpSingkat}
                      tick={{ fontSize: 11, fill: "#7c8a83" }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                    />
                    <YAxis
                      yAxisId="transaksi"
                      orientation="right"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#7c8a83" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip content={<GrafikTooltip />} cursor={{ stroke: "#d6d3d1", strokeDasharray: "4 4" }} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) => <span className="text-sage-600">{value}</span>}
                    />
                    <Line
                      yAxisId="omset"
                      type="monotone"
                      dataKey="omset"
                      name="Omset"
                      stroke="#991b1b"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 0, fill: "#991b1b" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="transaksi"
                      type="monotone"
                      dataKey="transaksi"
                      name="Transaksi"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 0, fill: "#10b981" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-sage-400">Belum ada data penjualan pada rentang ini</p>
              </div>
            )}
          </div>

          {closingError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{closingError}</p>
            </div>
          ) : closingData.length > 0 ? (
            <>
              <div className="bg-white border border-sage-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-sage-100">
                  <h2 className="text-sm font-semibold text-sage-800">Laporan Closing</h2>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100">
                      <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Tanggal</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Shift</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Kasir</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Uang Awal</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Makanan</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Minuman</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Omset</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Kas Aktual</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Selisih</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Transaksi</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Catatan</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">Barang Urgent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100">
                    {closingData.map((c) => (
                      <tr key={c.id} className="hover:bg-red-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-sage-500">{formatDate(new Date(c.createdAt))}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded">
                            {c.shift === "SHIFT_1" ? "Shift 1" : "Shift 2"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sage-700">{c.user.nama}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-800">{formatRupiah(c.uangAwal)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-800">{c.totalMakanan} <span className="text-xs text-sage-400 font-normal">item</span></td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-800">{c.totalMinuman} <span className="text-xs text-sage-400 font-normal">item</span></td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-800">{formatRupiah(c.totalOmset)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-800">{c.kasAktual != null ? formatRupiah(c.kasAktual) : "-"}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {c.selisih != null ? (
                            <span className={c.selisih === 0 ? "text-emerald-600" : "text-red-500"}>
                              {c.selisih === 0 ? "Pas" : (c.selisih > 0 ? `+${formatRupiah(c.selisih)}` : formatRupiah(c.selisih))}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sage-800">{c.totalTransaksi}</td>
                        <td className="px-4 py-3 text-sm text-sage-600">{c.catatan || "-"}</td>
                        <td className="px-4 py-3 text-sm text-sage-600">
                          {c.belanjaUrgent && c.belanjaUrgent.length > 0 ? (
                            <div className="space-y-0.5">
                              {c.belanjaUrgent.map((item, i) => (
                                <div key={i} className="flex justify-between gap-2">
                                  <span className="truncate">{item.nama || "-"}</span>
                                  <span className="font-medium text-sage-700 shrink-0">{formatRupiah(item.nominal)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between gap-2 pt-1 border-t border-sage-100 font-semibold text-sage-800">
                                <span>Total</span>
                                <span className="shrink-0">{formatRupiah(c.belanjaUrgent.reduce((sum, item) => sum + (item.nominal || 0), 0))}</span>
                              </div>
                            </div>
                          ) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              {closingTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => { const p = closingPage - 1; loadClosing(p); }}
                    disabled={closingPage <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: closingTotalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => loadClosing(p)}
                      className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === closingPage
                          ? "bg-red-800 text-white"
                          : "border border-sage-200 text-sage-600 hover:bg-sage-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => { const p = closingPage + 1; loadClosing(p); }}
                    disabled={closingPage >= closingTotalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-sage-200 rounded-xl p-6 text-center">
              <p className="text-sm text-sage-400">Belum ada data laporan closing</p>
            </div>
          )}

          {data.menuTerlaris.length > 0 && (
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-sage-800 mb-3">Menu Terlaris</h2>
              <div className="space-y-1">
                {data.menuTerlaris.map((item, i) => (
                  <div key={item.menuId} className="flex items-center justify-between py-2.5 border-b border-sage-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-sage-100 text-xs font-medium flex items-center justify-center text-sage-500">{i + 1}</span>
                      <span className="text-sm text-sage-700">{item.namaMenu}</span>
                    </div>
                    <span className="text-sm font-semibold text-sage-800">{item.totalTerjual}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-sage-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sage-100">
              <h2 className="text-sm font-semibold text-sage-800">Riwayat Transaksi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sage-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-sage-500 uppercase">No. Transaksi</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-sage-500 uppercase">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Item</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Metode</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Waktu</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-sage-500 uppercase">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {data.transaksi.map((t) => (
                    <tr key={t.id} className="hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-sage-400">{t.noTransaksi}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-sage-800">{formatRupiah(t.totalHarga)}</td>
                      <td className="px-4 py-3.5 text-center text-sage-500">{t.itemTransaksi.reduce((s, i) => s + i.jumlah, 0)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${t.metodeBayar === "QRIS" ? "bg-blue-50 text-blue-600" : t.metodeBayar === "CARD" ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {t.metodeBayar === "QRIS" ? "QRIS" : t.metodeBayar === "CARD" ? "Card" : "Cash"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-sage-400 text-xs">{formatDate(new Date(t.createdAt))}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => setDetail(t)} className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors">
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.transaksi.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-sage-400 text-sm">Belum ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); loadData(dari || undefined, sampai || undefined, p); }}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); loadData(dari || undefined, sampai || undefined, p); }}
                  className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-red-800 text-white"
                      : "border border-sage-200 text-sage-600 hover:bg-sage-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => { const p = page + 1; setPage(p); loadData(dari || undefined, sampai || undefined, p); }}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          )}

          {detail && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setDetail(null)}>
              <div className="bg-white rounded-xl p-6 shadow-xl border border-sage-200 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-sage-800">Detail Transaksi</h3>
                    <p className="font-mono text-xs text-sage-400 mt-0.5">{detail.noTransaksi}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-sage-400 hover:text-sage-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-100 text-left">
                      <th className="py-2 text-xs font-medium text-sage-500 uppercase">Menu</th>
                      <th className="py-2 text-xs font-medium text-sage-500 uppercase">Harga</th>
                      <th className="py-2 text-xs font-medium text-sage-500 uppercase">Jumlah</th>
                      <th className="py-2 text-xs font-medium text-sage-500 uppercase text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100">
                    {detail.itemTransaksi.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 text-sage-700">{item.namaMenu}</td>
                        <td className="py-2.5 text-sage-500">{formatRupiah(item.harga)}</td>
                        <td className="py-2.5 text-sage-500">{item.jumlah}</td>
                        <td className="py-2.5 text-right font-medium text-sage-800">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-sage-200">
                    <tr><td colSpan={3} className="py-2.5 text-right font-semibold text-sage-800">Total</td><td className="py-2.5 text-right font-bold text-sage-800">{formatRupiah(detail.totalHarga)}</td></tr>
                    {detail.diskon > 0 && (
                      <tr className="text-red-500 font-medium"><td colSpan={3} className="py-1 text-right">Diskon</td><td className="py-1 text-right">-{formatRupiah(detail.diskon)}</td></tr>
                    )}
                    <tr className="text-sage-500"><td colSpan={3} className="py-1 text-right">Bayar</td><td className="py-1 text-right">{formatRupiah(detail.totalBayar)}</td></tr>
                    <tr className="text-red-600 font-medium"><td colSpan={3} className="py-1 text-right">Kembali</td><td className="py-1 text-right">{formatRupiah(detail.kembalian)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-sage-400">Tidak ada data</div>
      )}
    </div>
  );
}

function formatRpSingkat(n: number): string {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
  if (n >= 1_000) return `Rp${(n / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })}rb`;
  return `Rp${n}`;
}

function GrafikTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TitikGrafik }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-sage-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-sage-800 mb-1">{d.label}</p>
      <p className="text-sage-500">
        Omset: <span className="font-bold text-red-700">{formatRupiah(d.omset)}</span>
      </p>
      <p className="text-sage-500">
        Transaksi: <span className="font-bold text-emerald-700">{d.transaksi}</span>
      </p>
      {d.transaksi > 0 && (
        <p className="text-sage-400 mt-0.5">
          Rata-rata/transaksi: <span className="font-semibold text-sage-600">{formatRupiah(Math.round(d.omset / d.transaksi))}</span>
        </p>
      )}
    </div>
  );
}
