import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function getShiftRange(shift: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (shift === "SHIFT_1") {
    const start = new Date(today);
    start.setHours(7, 0, 0, 0);
    const end = new Date(today);
    end.setHours(14, 0, 0, 0);
    return { start, end };
  }

  const start = new Date(today);
  start.setHours(14, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.shift) {
      return NextResponse.json({ error: "Shift tidak ditemukan" }, { status: 400 });
    }

    const { start, end } = getShiftRange(session.shift);

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

    const totalOmset = makananTotal + minumanTotal;
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
