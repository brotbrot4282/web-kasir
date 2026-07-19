"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  DollarSign, ShoppingCart, Package,
  TrendingUp,
  Clock, ChevronRight,
  ArrowUpRight, ArrowRight,
  Receipt, UtensilsCrossed
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from "recharts";

type Ringkasan = { totalOmset: number; totalTransaksi: number; totalItem: number };
type MenuTerlaris = { menuId: string; namaMenu: string; totalTerjual: number };
type TransaksiItem = { id: string; noTransaksi: string; totalHarga: number; createdAt: string };
type LaporanData = {
  ringkasan: Ringkasan;
  menuTerlaris: MenuTerlaris[];
  transaksi: TransaksiItem[];
};

function useAnimatedCounter(end: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    setCount(0);

    function animate(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    }

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [end, duration]);

  return count;
}

function useTypewriter(text: string, speed = 70) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

function AnimatedStatCard({ title, rawValue, icon: Icon, gradient, delay, isCurrency }: {
  title: string;
  rawValue: number;
  icon: React.ElementType;
  gradient: string;
  delay: number;
  isCurrency?: boolean;
}) {
  const animatedNum = useAnimatedCounter(rawValue);
  const displayValue = isCurrency ? formatRupiah(animatedNum) : animatedNum.toLocaleString("id-ID");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      style={{
        background: gradient.includes("linear-gradient")
          ? undefined
          : undefined
      }}
    >
      <div
        className={`absolute inset-0 opacity-[0.05] ${gradient}`}
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />
      <div
        className={`absolute inset-0 ${gradient}`}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/80">{title}</p>
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mt-2 tabular-nums">{displayValue}</p>
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs text-white/70">Hari ini</span>
        </div>
      </div>
    </motion.div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-sage-200/50 ${className ?? ""}`} />
  );
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function Dashboard() {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/laporan")
      .then((r) => r.json())
      .then((d: LaporanData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const greeting = `${getTimeGreeting()}!`;
  const { displayed: typedGreeting, done: typingDone } = useTypewriter(greeting);

  const rotatingStats = data ? [
    { label: "Omset", value: formatRupiah(data.ringkasan.totalOmset), icon: <DollarSign className="w-3.5 h-3.5 text-sage-600" /> },
    { label: "Transaksi", value: data.ringkasan.totalTransaksi.toLocaleString("id-ID"), icon: <ShoppingCart className="w-3.5 h-3.5 text-sage-600" /> },
    { label: "Terjual", value: data.ringkasan.totalItem.toLocaleString("id-ID"), icon: <Package className="w-3.5 h-3.5 text-sage-600" /> },
  ] : [];

  const [activeStat, setActiveStat] = useState(0);

  useEffect(() => {
    if (!typingDone || rotatingStats.length === 0) return;
    const interval = setInterval(() => {
      setActiveStat((prev) => (prev + 1) % rotatingStats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [typingDone, rotatingStats.length]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="space-y-8"
    >
      {/* Greeting */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: -10 },
          visible: { opacity: 1, y: 0 },
        }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-sage-900">
            {typedGreeting}
            {!typingDone && <span className="animate-pulse text-sage-400 font-normal">|</span>}
          </h1>
          <p className="text-sage-500 text-sm mt-0.5">
            Ringkasan penjualan WARKOP SOEKARDJO
          </p>
        </div>
        <div className="flex items-center gap-3">
          {typingDone && rotatingStats.length > 0 && (
            <div className="h-9 flex items-center bg-white border border-sage-200 rounded-full px-3.5 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStat}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2 text-xs"
                >
                  {rotatingStats[activeStat].icon}
                  <span className="text-sage-400">{rotatingStats[activeStat].label}</span>
                  <span className="font-semibold text-sage-800 tabular-nums">{rotatingStats[activeStat].value}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-sage-400 bg-white border border-sage-200 px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatedStatCard
          title="Total Omset"
          rawValue={data?.ringkasan.totalOmset ?? 0}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-red-800 to-red-900"
          delay={0.1}
          isCurrency
        />
        <AnimatedStatCard
          title="Total Transaksi"
          rawValue={data?.ringkasan.totalTransaksi ?? 0}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-red-800 to-red-900"
          delay={0.2}
        />
        <AnimatedStatCard
          title="Item Terjual"
          rawValue={data?.ringkasan.totalItem ?? 0}
          icon={Package}
          gradient="bg-gradient-to-br from-red-800 to-red-900"
          delay={0.3}
        />
      </div>

      {/* Menu Terlaris & Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && data.menuTerlaris.length > 0 && (
          <MenuTerlarisSection items={data.menuTerlaris} />
        )}
        {data && data.transaksi.length > 0 && (
          <TransaksiTerbaruSection items={data.transaksi} />
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Link
          href="/kasir"
          className="group relative flex items-center gap-4 bg-gradient-to-br from-red-800 to-red-900 rounded-xl p-5 text-white overflow-hidden hover:from-red-900 hover:to-red-950 transition-all shadow-md hover:shadow-lg"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="relative z-10 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="font-semibold">Buka Kasir</h3>
            <p className="text-sm text-sage-200">Mulai transaksi baru</p>
          </div>
          <ArrowUpRight className="relative z-10 w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/menu"
          className="group flex items-center gap-4 bg-white border border-sage-200 rounded-xl p-5 hover:border-sage-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-sage-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sage-800">Atur Menu</h3>
            <p className="text-sm text-sage-500">Tambah atau edit menu</p>
          </div>
          <ChevronRight className="w-5 h-5 text-sage-300 group-hover:text-sage-500 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

const BAR_COLORS = [
  "url(#barGradient1)",
  "url(#barGradient2)",
  "url(#barGradient3)",
  "url(#barGradient4)",
  "url(#barGradient5)",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { namaMenu: string; totalTerjual: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-sage-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-sage-800">{d.namaMenu}</p>
      <p className="text-xs text-sage-500">Terjual: <span className="font-bold text-sage-700">{d.totalTerjual}</span></p>
    </div>
  );
}

function MenuTerlarisSection({ items }: { items: MenuTerlaris[] }) {
  const chartData = items.slice(0, 5).map((item) => ({
    namaMenu: item.namaMenu.length > 12 ? item.namaMenu.slice(0, 10) + ".." : item.namaMenu,
    namaMenuFull: item.namaMenu,
    totalTerjual: item.totalTerjual,
  }));

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="bg-white border border-sage-200 rounded-xl p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-amber-700" />
        </div>
        <h2 className="text-sm font-semibold text-sage-800">Menu Terlaris</h2>
      </div>
      <div className="w-full" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
              <linearGradient id="barGradient3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="barGradient4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a3a38a" />
                <stop offset="100%" stopColor="#8a8a73" />
              </linearGradient>
              <linearGradient id="barGradient5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4c4b0" />
                <stop offset="100%" stopColor="#a3a38a" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
            <XAxis
              dataKey="namaMenu"
              tick={{ fontSize: 11, fill: "#7c8a83" }}
              axisLine={{ stroke: "#e5e5e5" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#7c8a83" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="totalTerjual" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i]} />
              ))}
              <LabelList
                dataKey="totalTerjual"
                position="top"
                style={{ fontSize: 12, fontWeight: 600, fill: "#5c6b63" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function TransaksiTerbaruSection({ items }: { items: TransaksiItem[] }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="bg-white border border-sage-200 rounded-xl p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-700" />
          </div>
          <h2 className="text-sm font-semibold text-sage-800">Transaksi Terbaru</h2>
        </div>
        <Link
          href="/admin/laporan"
          className="text-xs text-sage-500 hover:text-sage-700 flex items-center gap-1 transition-colors"
        >
          Lihat Semua
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {items.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-sage-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-[10px] font-bold text-emerald-600">✓</span>
              </div>
              <div>
                <p className="text-xs font-mono text-sage-400">{t.noTransaksi}</p>
                <p className="text-[11px] text-sage-400 mt-0.5">
                  {getRelativeTime(new Date(t.createdAt))}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-sage-800">{formatRupiah(t.totalHarga)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
