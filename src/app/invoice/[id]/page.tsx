"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";

type Item = { id: string; namaMenu: string; harga: number; jumlah: number; subtotal: number; variant: string | null };
type Member = { noWa: string; nama: string | null; poin: number } | null;
type Transaksi = {
  noTransaksi: string; totalHarga: number; totalBayar: number;
  kembalian: number; createdAt: string; itemTransaksi: Item[];
  noWa: string | null; member: Member;
};

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Transaksi | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invoice/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Not found"))
      .then(setData)
      .catch(() => setError("Invoice tidak ditemukan"));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm shadow-sm border border-sage-200">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="font-bold text-sage-800 mb-1">Invoice Tidak Ditemukan</h1>
          <p className="text-sm text-sage-500">Link invoice tidak valid atau sudah kadaluwarsa</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
      </div>
    );
  }

  const tgl = new Date(data.createdAt).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-sage-50 flex items-start justify-center p-4 pt-12">
      <div className="bg-white rounded-xl shadow-sm border border-sage-200 w-full max-w-sm overflow-hidden">
        <div className="bg-sage-800 p-5 text-center text-white">
          <img src="/logo.jpg" alt="WARKOP SOEKARDJO" className="w-12 h-12 rounded-full object-cover mx-auto mb-3 ring-2 ring-white/20" />
          <h1 className="font-bold text-lg">WARKOP SOEKARDJO</h1>
          <p className="text-sage-300 text-xs mt-0.5">Invoice Pembayaran</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-sage-500">No. Invoice</span>
            <span className="font-mono font-medium text-sage-800">{data.noTransaksi}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sage-500">Tanggal</span>
            <span className="text-sage-800">{tgl}</span>
          </div>

          {data.member && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-sage-500">Member</span>
                <span className="font-medium text-sage-800">{data.member.nama || data.member.noWa}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sage-500">OV Poin</span>
                <span className="font-medium text-sage-700">{data.member.poin} poin</span>
              </div>
            </>
          )}

          <div className="border-t border-sage-200 pt-3">
            <h3 className="text-xs font-semibold text-sage-500 uppercase tracking-wider mb-2">Pesanan</h3>
            <div className="space-y-2">
              {data.itemTransaksi.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-sage-700">{item.namaMenu}</span>
                    <span className="text-sage-400 ml-1">x{item.jumlah}</span>
                  </div>
                  <span className="font-medium text-sage-800 ml-2">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-sage-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm font-bold text-sage-800">
              <span>Total</span><span>{formatRupiah(data.totalHarga)}</span>
            </div>
            <div className="flex justify-between text-sm text-sage-500">
              <span>Bayar</span><span>{formatRupiah(data.totalBayar)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-sage-600">
              <span>Kembali</span><span>{formatRupiah(data.kembalian)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-sage-200 px-5 py-4 text-center">
          <p className="text-xs text-sage-400">Terima kasih atas kunjungan Anda</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Link href="/" className="text-xs text-sage-600 hover:text-sage-800 transition-colors font-medium">
              WARKOP SOEKARDJO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
