"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils";

type Ringkasan = { totalOmset: number; totalTransaksi: number; totalItem: number };
type MenuTerlaris = { menuId: string; namaMenu: string; totalTerjual: number };
type TransaksiItem = { id: string; noTransaksi: string; totalHarga: number; createdAt: string };
type LaporanData = {
  ringkasan: Ringkasan;
  menuTerlaris: MenuTerlaris[];
  transaksi: TransaksiItem[];
};

export default function Dashboard() {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/laporan")
      .then((r) => r.json())
      .then((d: LaporanData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-pulse text-sage-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">Dashboard</h1>
          <p className="text-sage-500 text-sm mt-0.5">Ringkasan penjualan Warmindo</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-sage-400 bg-sage-50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-sage-400" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Omset"
          value={data ? formatRupiah(data.ringkasan.totalOmset) : "-"}
        />
        <StatCard
          title="Total Transaksi"
          value={data ? data.ringkasan.totalTransaksi.toString() : "-"}
        />
        <StatCard
          title="Item Terjual"
          value={data ? data.ringkasan.totalItem.toString() : "-"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && data.menuTerlaris.length > 0 && (
          <div className="bg-white border border-sage-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-sage-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.25.895-2.25 2.25m2.25-2.25c1.355 0 2.25.895 2.25 2.25M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-sage-800">Menu Terlaris</h2>
            </div>
            <div className="space-y-1">
              {data.menuTerlaris.slice(0, 5).map((item, i) => (
                <div key={item.menuId} className="flex items-center justify-between py-2.5 border-b border-sage-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sage-100 text-xs font-medium flex items-center justify-center text-sage-500">
                      {i + 1}
                    </span>
                    <span className="text-sm text-sage-700">{item.namaMenu}</span>
                  </div>
                  <span className="text-sm font-semibold text-sage-800">{item.totalTerjual}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data && data.transaksi.length > 0 && (
          <div className="bg-white border border-sage-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-sage-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-sage-800">Transaksi Terbaru</h2>
            </div>
            <div className="space-y-1">
              {data.transaksi.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-sage-100 last:border-0">
                  <div>
                    <p className="text-xs font-mono text-sage-400">{t.noTransaksi}</p>
                    <p className="text-xs text-sage-400 mt-0.5">{formatDate(new Date(t.createdAt))}</p>
                  </div>
                  <span className="text-sm font-semibold text-sage-800">{formatRupiah(t.totalHarga)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/kasir"
          className="flex items-center gap-4 bg-gradient-to-br from-sage-600 to-sage-700 rounded-xl p-5 text-white hover:from-sage-700 hover:to-sage-800 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Buka Kasir</h3>
            <p className="text-sm text-sage-200">Mulai transaksi baru</p>
          </div>
        </Link>

        <Link
          href="/admin/menu"
          className="flex items-center gap-4 bg-white border border-sage-200 rounded-xl p-5 hover:border-sage-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.25.895-2.25 2.25m2.25-2.25c1.355 0 2.25.895 2.25 2.25M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sage-800">Atur Menu</h3>
            <p className="text-sm text-sage-500">Tambah atau edit menu</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border border-sage-200 rounded-xl p-5 hover:border-sage-300 transition-all">
      <p className="text-sm text-sage-500">{title}</p>
      <p className="text-xl font-bold text-sage-800 mt-1">{value}</p>
    </div>
  );
}
