"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Clock, Bell, CheckCircle, CookingPot } from "lucide-react";

type ItemDapur = {
  id: string;
  namaMenu: string;
  harga: number;
  jumlah: number;
  variant: string | null;
  statusDapur: "MENUNGGU" | "DIMASAK" | "SIAP";
  createdAt: string;
  menu: { nama: string; kategori: { nama: string } };
  transaksi: { noTransaksi: string; createdAt: string; noWa: string | null; totalHarga: number; member: { nama: string | null } | null };
};

export default function DapurPage() {
  const [items, setItems] = useState<ItemDapur[]>([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const prevIds = useRef<Set<string>>(new Set());
  const audioCtx = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new AudioContext();
      }
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.2);
      }, 150);
    } catch {}
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/dapur");
        if (!res.ok) return;
        const data: ItemDapur[] = await res.json();

        const newIds = new Set(data.map((i) => i.id));
        const hasNew = data.some(
          (i) => i.statusDapur === "MENUNGGU" && !prevIds.current.has(i.id)
        );
        if (hasNew) playBeep();
        prevIds.current = newIds;

        setItems(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    const int = setInterval(fetchItems, 5000);
    return () => clearInterval(int);
  }, [playBeep]);

  const updateStatus = async (id: string, status: "DIMASAK" | "SIAP") => {
    setUpdating(id);
    try {
      await fetch(`/api/dapur/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems((prev) =>
        status === "SIAP"
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? { ...i, statusDapur: status } : i))
      );
    } catch {
    } finally {
      setUpdating(null);
    }
  };

  const menunggu = items.filter((i) => i.statusDapur === "MENUNGGU");
  const dimasak = items.filter((i) => i.statusDapur === "DIMASAK");

  const formatJam = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-sage-200 border-t-sage-600 rounded-full animate-spin" />
          <div className="text-sm text-sage-400 font-medium">Memuat pesanan...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-900 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sage-800">Dapur</h1>
            <p className="text-xs text-sage-400">Pesanan masuk</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-sage-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Bell className="w-4 h-4 text-sage-400" />
            <span className="text-sm font-bold text-sage-700">
              {menunggu.length + dimasak.length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-sage-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Clock className="w-4 h-4 text-sage-400" />
            <span className="text-sm font-bold text-sage-700 font-mono">{clock}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* MENUNGGU Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="font-semibold text-sm text-sage-700">Menunggu</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{menunggu.length}</span>
          </div>
          <div className="space-y-2.5">
            <AnimatePresence>
              {menunggu.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-amber-500 bg-amber-100/70 px-1.5 py-0.5 rounded">
                          {item.transaksi.noTransaksi}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">{formatJam(item.transaksi.createdAt)}</span>
                        {item.transaksi.member?.nama && (
                          <span className="text-[10px] text-amber-600 font-medium truncate max-w-[120px]">
                            👤 {item.transaksi.member.nama}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base text-amber-900">
                        {item.variant ? `${item.menu.nama} - ${item.variant}` : item.menu.nama}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-amber-600">{item.menu.kategori.nama}</span>
                        <span className="text-amber-300">•</span>
                        <span className="text-xs font-bold text-amber-700">x{item.jumlah}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateStatus(item.id, "DIMASAK")}
                      disabled={updating === item.id}
                      className="shrink-0 flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {updating === item.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CookingPot className="w-3.5 h-3.5" />
                      )}
                      Ambil
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {menunggu.length === 0 && (
              <div className="text-center py-12 bg-white border border-sage-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-3">
                  <ChefHat className="w-6 h-6 text-sage-300" />
                </div>
                <p className="text-sm font-medium text-sage-500">Tidak ada pesanan baru</p>
                <p className="text-xs text-sage-400 mt-0.5">Silakan tunggu pesanan dari kasir</p>
              </div>
            )}
          </div>
        </div>

        {/* DIMASAK Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <h2 className="font-semibold text-sm text-sage-700">Dimasak</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{dimasak.length}</span>
          </div>
          <div className="space-y-2.5">
            <AnimatePresence>
              {dimasak.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-blue-500 bg-blue-100/70 px-1.5 py-0.5 rounded">
                          {item.transaksi.noTransaksi}
                        </span>
                        <span className="text-[10px] text-blue-400 font-mono">{formatJam(item.transaksi.createdAt)}</span>
                        {item.transaksi.member?.nama && (
                          <span className="text-[10px] text-blue-600 font-medium truncate max-w-[120px]">
                            👤 {item.transaksi.member.nama}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base text-blue-900">
                        {item.variant ? `${item.menu.nama} - ${item.variant}` : item.menu.nama}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">{item.menu.kategori.nama}</span>
                        <span className="text-blue-300">•</span>
                        <span className="text-xs font-bold text-blue-700">x{item.jumlah}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateStatus(item.id, "SIAP")}
                      disabled={updating === item.id}
                      className="shrink-0 flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {updating === item.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Selesai
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {dimasak.length === 0 && (
              <div className="text-center py-12 bg-white border border-sage-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-3">
                  <CookingPot className="w-6 h-6 text-sage-300" />
                </div>
                <p className="text-sm font-medium text-sage-500">Tidak ada yang dimasak</p>
                <p className="text-xs text-sage-400 mt-0.5">Ambil pesanan dari kolom Menunggu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
