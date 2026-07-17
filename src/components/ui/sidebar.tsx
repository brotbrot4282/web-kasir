"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Receipt, UtensilsCrossed, Package,
  BarChart3, LogOut, Menu, X, User, Users, ChefHat, Settings,
} from "lucide-react";

type Role = "OWNER" | "KASIR" | "DAPUR";

const ownerNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/stok", label: "Stok", icon: Package },
  { href: "/admin/customer", label: "Customer", icon: Users },
  { href: "/admin/pengaturan-poin", label: "Pengaturan Poin", icon: Settings },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3 },
];

const kasirNavItems = [
  { href: "/kasir", label: "Kasir", icon: Receipt },
];

const dapurNavItems = [
  { href: "/dapur", label: "Dapur", icon: ChefHat },
];

export default function Sidebar({
  role,
  shift,
  user,
}: {
  role: Role;
  shift: string | null;
  user: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = role === "OWNER" ? ownerNavItems : role === "DAPUR" ? dapurNavItems : kasirNavItems;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const shiftLabel = shift === "SHIFT_1" ? "Shift 1" : shift === "SHIFT_2" ? "Shift 2" : null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <Link href={role === "OWNER" ? "/" : role === "DAPUR" ? "/dapur" : "/kasir"} className="flex items-center gap-3 px-6 py-6">
        <img src="/logo.jpg" alt="WARKOP SOEKARDJO" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20" />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">WARKOP</p>
          <p className="text-[11px] text-sage-300 leading-tight">SOEKARDJO</p>
        </div>
      </Link>

      <div className="mx-6 border-t border-white/10" />

      {/* User info */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user}</p>
            <p className="text-[10px] text-sage-300 uppercase tracking-wider">
              {role === "OWNER" ? "Pemilik" : role === "DAPUR" ? "Dapur" : shiftLabel || "Kasir"}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-6 border-t border-white/10" />

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-sage-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <div className="mx-3 border-t border-white/10 mb-2" />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sage-300 hover:text-white hover:bg-white/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {loggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-dvh w-64 bg-red-900 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-red-900 shadow-lg flex items-center justify-center text-white hover:bg-red-800 transition-colors"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-dvh w-64 bg-red-900 z-50"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 text-sage-300 hover:text-white transition-colors"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
