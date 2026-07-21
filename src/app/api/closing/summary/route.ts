import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTodayWIB } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.shift) {
      return NextResponse.json({ error: "Shift tidak ditemukan" }, { status: 400 });
    }

    const { searchParams } = request.nextUrl;
    const belanjaUrgentTotal = parseInt(searchParams.get("belanjaUrgentTotal") || "0") || 0;

    const today = getTodayWIB();

    const report = await prisma.dailyReport.findFirst({
      where: {
        tanggal: { gte: today },
        shift: session.shift as "SHIFT_1" | "SHIFT_2",
      },
      select: { openedAt: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Shift belum dibuka" }, { status: 400 });
    }

    const start = report.openedAt;
    const end = new Date();

    const items = await prisma.itemTransaksi.findMany({
      where: {
        transaksi: {
          createdAt: { gte: start, lte: end },
        },
      },
      include: {
        menu: {
          select: {
            kategori: { select: { nama: true } },
          },
        },
      },
    });

    let makananQty = 0;
    let makananTotal = 0;
    let minumanQty = 0;
    let minumanTotal = 0;
    const menuMap = new Map<string, { nama: string; qty: number; subtotal: number }>();

    for (const item of items) {
      const kat = item.menu.kategori.nama;
      if (kat === "Makanan") {
        makananQty += item.jumlah;
        makananTotal += item.subtotal;
      } else {
        minumanQty += item.jumlah;
        minumanTotal += item.subtotal;
      }

      const existing = menuMap.get(item.namaMenu);
      if (existing) {
        existing.qty += item.jumlah;
        existing.subtotal += item.subtotal;
      } else {
        menuMap.set(item.namaMenu, {
          nama: item.namaMenu,
          qty: item.jumlah,
          subtotal: item.subtotal,
        });
      }
    }

    const transaksiCount = await prisma.transaksi.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    const totalOmset = Math.max(0, makananTotal + minumanTotal - belanjaUrgentTotal);
    const breakdown = Array.from(menuMap.values()).sort((a, b) => b.qty - a.qty);

    return NextResponse.json({
      makanan: { qty: makananQty, total: makananTotal },
      minuman: { qty: minumanQty, total: minumanTotal },
      totalOmset,
      totalTransaksi: transaksiCount,
      breakdown,
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil ringkasan shift" }, { status: 500 });
  }
}
