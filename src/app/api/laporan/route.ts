import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const dateFilter: Record<string, Date> = {};
  if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
  if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

  const where = dari || sampai ? { createdAt: dateFilter } : {};

  const [total, aggTransaksi, transaksi, menuTerlaris] = await Promise.all([
    prisma.transaksi.count({ where }),
    prisma.transaksi.aggregate({
      where,
      _sum: { totalHarga: true },
    }),
    prisma.transaksi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        itemTransaksi: true,
      },
    }),
    prisma.itemTransaksi.groupBy({
      by: ["menuId", "namaMenu"],
      _sum: { jumlah: true },
      where: dari || sampai ? {
        transaksi: { createdAt: dateFilter },
      } : {},
      orderBy: { _sum: { jumlah: "desc" } },
      take: 10,
    }),
  ]);

  const totalOmset = aggTransaksi._sum.totalHarga || 0;

  const itemAgg = await prisma.itemTransaksi.aggregate({
    where: dari || sampai ? { transaksi: { createdAt: dateFilter } } : {},
    _sum: { jumlah: true },
  });
  const totalItem = itemAgg._sum.jumlah || 0;

  return NextResponse.json({
    transaksi,
    ringkasan: {
      totalOmset,
      totalTransaksi: total,
      totalItem,
    },
    menuTerlaris: menuTerlaris.map((m) => ({
      menuId: m.menuId,
      namaMenu: m.namaMenu,
      totalTerjual: m._sum.jumlah ?? 0,
    })),
    total,
    totalPages: Math.ceil(total / limit),
    page,
  });
}
