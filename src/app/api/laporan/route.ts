import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  const dateFilter: Record<string, Date> = {};
  if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
  if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

  const where = dari || sampai ? { createdAt: dateFilter } : {};

  const transaksi = await prisma.transaksi.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      itemTransaksi: true,
    },
  });

  const totalOmset = transaksi.reduce((sum, t) => sum + t.totalHarga, 0);
  const totalTransaksi = transaksi.length;
  const totalItem = transaksi.reduce((sum, t) => sum + t.itemTransaksi.reduce((s, i) => s + i.jumlah, 0), 0);

  const menuTerlaris = await prisma.itemTransaksi.groupBy({
    by: ["menuId", "namaMenu"],
    _sum: { jumlah: true },
    where: dari || sampai ? {
      transaksi: { createdAt: dateFilter },
    } : {},
    orderBy: { _sum: { jumlah: "desc" } },
    take: 10,
  });

  return NextResponse.json({
    transaksi,
    ringkasan: {
      totalOmset,
      totalTransaksi,
      totalItem,
    },
    menuTerlaris: menuTerlaris.map((m) => ({
      menuId: m.menuId,
      namaMenu: m.namaMenu,
      totalTerjual: m._sum.jumlah ?? 0,
    })),
  });
}
